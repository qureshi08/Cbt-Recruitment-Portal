"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
    sendAssessmentEmail,
    sendRecommendedEmail,
    sendNotRecommendedEmail
} from "@/lib/email";
import { getCurrentUser } from "@/lib/auth-utils";

export type UserRole = 'Master' | 'Approver' | 'HR' | 'L1_Interviewer' | 'L2_Interviewer';

// --- Audit Logging Helper ---
async function logAction(action: string, entityId: string, entityType: string, details: any) {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        await supabaseAdmin.from('audit_logs').insert({
            user_id: user.id,
            user_name: user.full_name,
            action,
            entity_id: entityId,
            entity_type: entityType,
            details
        });

        // If it's a candidate action, also update the denormalized field for easy UI access
        if (entityType === 'candidate') {
            await supabaseAdmin
                .from('candidates')
                .update({ last_action_by: user.full_name })
                .eq('id', entityId);
        }
        return user.full_name;
    } catch (error) {
        console.error("Logging failed:", error);
        return null;
    }
}

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabaseClient = await createClient();

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin", "layout");
    redirect("/admin");
}

export async function logout() {
    console.log("LOGOUT INITIATED");
    const supabaseClient = await createClient();
    await supabaseClient.auth.signOut();

    const cookieStore = await cookies();
    // Manual aggressive cookie clearing
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
        // Clear all Supabase related cookies
        if (
            cookie.name.includes('auth') ||
            cookie.name.includes('supabase') ||
            cookie.name.includes('sb-') ||
            cookie.name.includes('session')
        ) {
            cookieStore.delete(cookie.name);
        }
    });

    // Clear the path cache
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");

    // Use a hard redirect to the home page first to break any cycles
    redirect("/login");
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
        .from('user_roles')
        .select(`
            roles (
                name
            )
        `)
        .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((d: any) => d.roles.name as UserRole);
}

export async function getAllRoles() {
    const { data, error } = await supabase.from('roles').select('*').neq('name', '_SYSTEM_AI_CRITERIA_').neq('name', 'Interviewer');
    if (error) throw error;
    return data;
}

export async function getAiCriteria(): Promise<string> {
    const { data } = await supabaseAdmin
        .from('roles')
        .select('description')
        .eq('name', '_SYSTEM_AI_CRITERIA_')
        .single();

    return data?.description || "Software Engineer with technical excellence, strong problem-solving skills, and good communication.";
}

export async function updateAiCriteria(newCriteria: string) {
    const { error } = await supabaseAdmin
        .from('roles')
        .upsert(
            { name: '_SYSTEM_AI_CRITERIA_', description: newCriteria },
            { onConflict: 'name' }
        );

    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function fetchAllUsers() {
    try {
        // Fetch public table users
        const { data: publicUsers, error: publicError } = await supabaseAdmin
            .from('users')
            .select(`
                *,
                user_roles (
                    roles (
                        name
                    )
                )
            `);

        if (publicError) throw publicError;

        // Fetch auth users to get created_at accurately
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
            console.error("Auth list error:", authError);
        }

        return publicUsers.map((u: any) => {
            const authUser = authUsers?.find(au => au.id === u.id);
            return {
                ...u,
                created_at: u.created_at || authUser?.created_at || null,
                roles: u.user_roles.map((ur: any) => ur.roles.name)
            };
        });
    } catch (error) {
        console.error("fetchAllUsers error:", error);
        throw error;
    }
}

export async function createAdminUser(email: string, fullName: string, roleNames: string[], password?: string) {
    try {
        console.log("Creating user:", email);
        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || 'Cbt@123456',
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        // 2. Create entry in public.users table
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({ id: userId, email, full_name: fullName });

        if (userError) throw userError;

        // 3. Assign roles
        for (const roleName of roleNames) {
            const { data: roleData } = await supabaseAdmin
                .from('roles')
                .select('id')
                .eq('name', roleName)
                .single();

            if (roleData) {
                await supabaseAdmin
                    .from('user_roles')
                    .insert({ user_id: userId, role_id: roleData.id });
            }
        }

        await logAction('USER_CREATED', userId, 'user', { email, roles: roleNames });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error("Create user error:", error);
        return { error: error.message };
    }
}

export async function deleteAdminUser(userId: string) {
    try {
        // 1. Delete from Auth (this also deletes from public.users due to CASCADE in DB)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        await logAction('USER_DELETED', userId, 'user', {});

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateAdminUser(userId: string, fullName: string, roleNames: string[], password?: string) {
    try {
        // 1. Update public.users
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({ full_name: fullName })
            .eq('id', userId);

        if (userError) throw userError;

        // 2. Update Auth metadata and potentially password
        const updateData: any = {
            user_metadata: { full_name: fullName }
        };

        if (password && password.trim().length > 0) {
            updateData.password = password;
        }

        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
        if (authUpdateError) throw authUpdateError;

        // 3. Update Roles
        await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
        for (const roleName of roleNames) {
            const { data: roleData } = await supabaseAdmin
                .from('roles')
                .select('id')
                .eq('name', roleName)
                .single();

            if (roleData) {
                await supabaseAdmin
                    .from('user_roles')
                    .insert({ user_id: userId, role_id: roleData.id });
            }
        }

        await logAction('USER_UPDATED', userId, 'user', { roles: roleNames, password_changed: !!password });

        revalidatePath('/admin/settings');
        revalidatePath('/admin', 'layout');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function submitApplication(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;
    const education_status = formData.get("education_status") as string;
    const graduation_year = formData.get("graduation_year") as string;
    const degree_field = (formData.get("degree_field") as string) || "Not Specified";
    const university = (formData.get("university") as string) || "Not Specified";
    const cnic = formData.get("cnic") as string;
    const resume = formData.get("resume") as File;
    const position = formData.get("position") as string || "General Application";

    try {
        if (!resume || resume.size === 0) throw new Error("Resume is required");
        if (!cnic) throw new Error("CNIC Number is required");

        // Normalize CNIC: Remove all non-digit characters for consistent lookup
        const normalizedCnic = cnic.replace(/\D/g, '');
        if (normalizedCnic.length < 5) throw new Error("Invalid CNIC format");

        // --- Reapplication Logic Based on CNIC ---
        // 1. Check if there's any previous application with this (normalized) CNIC
        // We use a broader check to find matches even if we previously stored them with dashes
        const { data: pastApps, error: pastAppError } = await supabaseAdmin
            .from('candidates')
            .select('id, status, created_at, updated_at, cnic')
            .or(`cnic.eq."${cnic}",cnic.eq."${normalizedCnic}"`) // Try both raw and normalized
            .order('created_at', { ascending: false })
            .limit(1);

        if (pastAppError) {
            console.error("Error checking past applications:", pastAppError);
            throw new Error("System is currently unable to verify eligibility. Please try again in a few minutes.");
        } else if (pastApps && pastApps.length > 0) {
            const lastApp = pastApps[0];

            // If an active application exists, block
            const activeStatuses = ['Applied', 'Approved', 'Assessment Scheduled', 'Confirmed', 'Rescheduled', 'Assessment Completed', 'To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required'];
            if (activeStatuses.includes(lastApp.status)) {
                return {
                    error: "You already have an active application in the system. Please wait for your current application process to conclude."
                };
            }

            // If rejected, check time restrictions
            if (lastApp.status === 'Rejected' || lastApp.status === 'Not Recommended') {
                // Check if they reached interview stage (existed in interviews table)
                const { count, error: countError } = await supabaseAdmin
                    .from('interviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('candidate_id', lastApp.id);

                if (countError) console.error("Error checking interviews:", countError);

                const isInterviewPhase = (count || 0) > 0 || lastApp.status === 'Not Recommended';
                const requiredWaitMonths = isInterviewPhase ? 6 : 3;

                // Use the later of created_at or updated_at
                const lastActivityDate = new Date(lastApp.updated_at || lastApp.created_at);
                const now = new Date();

                // Calculate difference in days (more robust than months/days ratio)
                const diffTime = now.getTime() - lastActivityDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                // 30 days per month estimate for the restriction
                if (diffDays < (requiredWaitMonths * 30)) {
                    const daysLeft = Math.ceil((requiredWaitMonths * 30) - diffDays);
                    const monthsLeft = Math.ceil(daysLeft / 30);
                    const phaseName = isInterviewPhase ? "interview phase" : "initial filtering phase";

                    return {
                        error: `Candidates rejected at the ${phaseName} can reapply after ${requiredWaitMonths} months. Based on your previous application, you can reapply in approximately ${monthsLeft} month(s).`
                    };
                }
            }
        }
        // Save normalized CNIC for future consistency
        const finalCnic = normalizedCnic;
        // -----------------------------------------


        const fileExt = resume.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(fileName, resume);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from("resumes")
            .getPublicUrl(fileName);

        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .insert({
                name,
                email,
                phone,
                location,
                education_status,
                graduation_year,
                degree_field,
                university,
                cnic: finalCnic,
                resume_url: publicUrl,
                position,
                status: "Applied",
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (candidateError) throw candidateError;

        // Create notification for admin
        await supabase.from('notifications').insert({
            title: 'New Application',
            message: `${name} has applied for ${position}.`,
            is_read: false
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("submitApplication error:", error);
        return { error: error.message };
    }
}

export async function updateCandidateStatus(candidateId: string, status: string) {
    try {
        const actingUser = await getCurrentUser();
        const userName = actingUser?.full_name || 'System User';

        const { data: candidate, error } = await supabase
            .from("candidates")
            .update({
                status,
                last_action_by: userName,
                updated_at: new Date().toISOString()
            })
            .eq("id", candidateId)
            .select()
            .single();

        if (error) throw error;

        // Trigger Email Notifications
        if (candidate) {
            try {
                const origin = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

                // --- Log Action ---
                await logAction('STATUS_UPDATE', candidateId, 'candidate', { new_status: status });

                if (status === "Approved") {
                    const bookingLink = `${origin}/book-slot/${candidateId}`;
                    await sendAssessmentEmail(candidate.email, candidate.name, bookingLink);
                } else if (status === "Recommended") {
                    await sendRecommendedEmail(candidate.email, candidate.name);
                } else if (status === "Not Recommended" || status === "Rejected") {
                    await sendNotRecommendedEmail(candidate.email, candidate.name);
                }
            } catch (emailError: any) {
                console.error("Email delivery failed, but status was updated:", emailError.message);
                return {
                    success: true,
                    last_action_by: userName,
                    note: `Status updated, but email failed: ${emailError.message}`
                };
            }
        }

        revalidatePath("/admin/applications");
        revalidatePath("/admin");
        return { success: true, last_action_by: userName };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function createAssessmentSlot(startTime: string, endTime: string) {
    try {
        const { data, error } = await supabase
            .from("assessment_slots")
            .insert({
                start_time: startTime,
                end_time: endTime,
                is_locked: false
            })
            .select('*')
            .single();

        if (error) throw error;

        revalidatePath("/admin/slots");
        return { success: true, data };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function bookAssessmentSlot(candidateId: string, slotId: string) {
    try {
        // 0. Verify candidate is actually allowed to book (must be 'Approved')
        const { data: candidate } = await supabase
            .from("candidates")
            .select("status")
            .eq("id", candidateId)
            .single();

        if (candidate?.status !== "Approved") {
            return { error: `You have scheduled an assessment (Current status: ${candidate?.status}).` };
        }

        // 1. Check if the slot is still available...
        const { data: currentSlot, error: fetchError } = await supabase
            .from("assessment_slots")
            .select("is_locked, candidate_id")
            .eq("id", slotId)
            .single();

        if (fetchError) throw new Error("Could not verify slot availability.");

        // If locked by someone else, prevent booking
        if (currentSlot.is_locked && currentSlot.candidate_id !== candidateId) {
            return { error: "This slot was just booked by another candidate. Please select a different one." };
        }

        // 2. Unlock any previous slots booked by this candidate (CLEANUP BEFORE RESCHEDULING)
        await supabase
            .from("assessment_slots")
            .update({
                candidate_id: null,
                is_locked: false
            })
            .eq("candidate_id", candidateId);

        // 3. Lock the new slot (with concurrency check)
        const { error: lockError, data: updatedData } = await supabase
            .from("assessment_slots")
            .update({
                candidate_id: candidateId,
                is_locked: true
            })
            .eq("id", slotId)
            .or(`is_locked.eq.false,candidate_id.eq.${candidateId}`) // Atomic check
            .select();

        if (lockError) throw lockError;

        if (!updatedData || updatedData.length === 0) {
            return { error: "Slot is no longer available. Please refresh and try another." };
        }

        // Update candidate status
        const statusResult = await updateCandidateStatus(candidateId, "Assessment Scheduled");
        if (!statusResult.success) {
            throw new Error(statusResult.error || "Failed to update candidate status.");
        }

        revalidatePath("/admin/slots");
        revalidatePath("/admin");
        revalidatePath(`/book-slot/${candidateId}`);
        return { success: true };
    } catch (error: any) {
        console.error("bookAssessmentSlot error:", error);
        return { error: error.message };
    }
}

export async function rescheduleAssessment(candidateId: string) {
    try {
        // 1. Verify candidate is currently scheduled
        const { data: candidate } = await supabase
            .from("candidates")
            .select("status")
            .eq("id", candidateId)
            .single();

        if (candidate?.status !== "Assessment Scheduled") {
            return { error: "Only candidates with 'Assessment Scheduled' status can reschedule." };
        }

        // 2. Free up their current slot
        const { error: slotError } = await supabaseAdmin
            .from("assessment_slots")
            .update({
                candidate_id: null,
                is_locked: false
            })
            .eq("candidate_id", candidateId);

        if (slotError) throw slotError;

        // 3. Reset candidate status back to Approved
        await updateCandidateStatus(candidateId, "Approved");

        revalidatePath("/admin/slots");
        revalidatePath("/admin/applications");
        revalidatePath(`/book-slot/${candidateId}`);
        return { success: true };
    } catch (error: any) {
        console.error("rescheduleAssessment error:", error);
        return { error: error.message };
    }
}

export async function completeAssessment(candidateId: string) {
    try {
        // 1. Create interview entry
        const now = new Date();
        const { data: candidate } = await supabase
            .from("candidates")
            .select("name")
            .eq("id", candidateId)
            .single();

        const { error: interviewError } = await supabase
            .from("interviews")
            .insert({
                candidate_id: candidateId,
                scheduled_at: now.toISOString(),
                decision: null,
            });

        if (interviewError) throw new Error(`Failed to create interview: ${interviewError.message}`);

        // 2. Update candidate status
        await updateCandidateStatus(candidateId, "To Be Interviewed");

        // 3. Create notification
        await supabase.from('notifications').insert({
            title: 'Interview Ready',
            message: `${candidate?.name || 'Candidate'} is ready for interview feedback.`,
            is_read: false
        });

        revalidatePath("/admin/slots");
        revalidatePath("/admin/applications");
        revalidatePath("/admin/interviews");
        revalidatePath("/admin");

        return { success: true };
    } catch (error: any) {
        console.error("completeAssessment error:", error);
        return { error: error.message };
    }
}

export async function requestL2Interview(interviewId: string, candidateId: string, l1Feedback: string, l1FeedbackJson?: object) {
    try {
        const user = await getCurrentUser();
        const interviewerName = user?.full_name || 'Interviewer';

        // 1. Save L1 feedback and mark as needing L2 review (same record, no duplicate)
        const { error: updateError } = await supabaseAdmin
            .from("interviews")
            .update({
                decision: "L2 Interview Required",
                feedback: `L1: ${l1Feedback}`,
                l1_feedback_json: l1FeedbackJson || null,
                l1_interviewer_name: interviewerName
            })
            .eq("id", interviewId);

        if (updateError) throw updateError;

        // 2. Update Candidate Status
        await updateCandidateStatus(candidateId, "L2 Interview Required");

        await logAction('INTERVIEW_L2_REQUESTED', candidateId, 'candidate', {
            interview_id: interviewId,
            interviewer: interviewerName
        });

        revalidatePath("/admin/interviews");
        revalidatePath("/admin/applications");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function submitFinalInterviewFeedback(
    interviewId: string,
    candidateId: string,
    decision: string,
    feedbackText: string,
    feedbackJson: object,
    round: 'L1' | 'L2'
) {
    try {
        const user = await getCurrentUser();
        const interviewerName = user?.full_name || 'Interviewer';

        const updates: any = {
            decision,
            feedback: feedbackText,
        };

        if (round === 'L1') {
            updates.l1_feedback_json = feedbackJson;
            updates.l1_interviewer_name = interviewerName;
        } else {
            updates.l2_feedback_json = feedbackJson;
            updates.l2_interviewer_name = interviewerName;
        }

        const { error: updateError } = await supabaseAdmin
            .from('interviews')
            .update(updates)
            .eq('id', interviewId);

        if (updateError) throw updateError;

        await updateCandidateStatus(candidateId, decision);
        await logAction(`INTERVIEW_${round}_COMPLETED`, candidateId, 'candidate', {
            decision,
            interviewer: interviewerName
        });

        revalidatePath('/admin/interviews');
        revalidatePath('/admin/applications');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteCandidate(candidateId: string) {
    try {
        // 1. Delete dependent records
        await supabase.from("assessment_slots").delete().eq("candidate_id", candidateId);
        await supabase.from("interviews").delete().eq("candidate_id", candidateId);

        // 2. Delete the candidate
        const { error } = await supabase
            .from("candidates")
            .delete()
            .eq("id", candidateId);

        if (error) throw error;

        await logAction('CANDIDATE_DELETED', candidateId, 'candidate', {});

        revalidatePath("/admin/applications");
        revalidatePath("/admin/slots");
        revalidatePath("/admin/interviews");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Delete error:", error);
        return { error: error.message };
    }
}

export async function markNotificationsAsRead() {
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("is_read", false);

        if (error) throw error;

        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Force-refresh build comment: v3.1
export async function uploadAssessmentScore(formData: FormData) {
    try {
        const candidateId = formData.get('candidateId') as string;
        const file = formData.get('file') as File;

        if (!file || !candidateId) throw new Error("Missing file or candidate ID");

        const fileExt = file.name.split('.').pop();
        const finalFileName = `${candidateId}_score_${Date.now()}.${fileExt}`;

        // Convert File to Buffer for Supabase storage upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload using admin client
        const { error } = await supabaseAdmin.storage
            .from('assessment-scores')
            .upload(finalFileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw new Error(`Upload failed: ${error.message}`);

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('assessment-scores')
            .getPublicUrl(finalFileName);

        // Update candidate record
        const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({ assessment_score_url: publicUrl })
            .eq('id', candidateId);

        if (updateError) throw new Error(`Database update failed: ${updateError.message}`);

        const actingUserName = await logAction('SCORE_UPLOADED', candidateId, 'candidate', { url: publicUrl });

        revalidatePath('/admin/applications');
        return { success: true, publicUrl, last_action_by: actingUserName };
    } catch (error: any) {
        console.error("uploadAssessmentScore error:", error.message);
        return { error: error.message };
    }
}

export async function updateCandidate(candidateId: string, updates: Partial<any>) {
    try {
        if (updates.cnic) {
            updates.cnic = updates.cnic.replace(/\D/g, '');
        }
        const { error } = await supabase
            .from("candidates")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", candidateId);

        if (error) throw error;

        const actingUserName = await logAction('CANDIDATE_UPDATED', candidateId, 'candidate', updates);

        revalidatePath("/admin/applications");
        revalidatePath("/admin/interviews");
        return { success: true, last_action_by: actingUserName };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function ensureBuckets() {
    try {
        // 1. Ensure Storage Buckets exist and are configured correctly
        const buckets = ['resumes', 'assessment-scores'];
        const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
        const existingBucketIds = existingBuckets?.map(b => b.id) || [];

        for (const bucketId of buckets) {
            if (!existingBucketIds.includes(bucketId)) {
                await supabaseAdmin.storage.createBucket(bucketId, {
                    public: true,
                });
            } else {
                // Update existing buckets to ensure they are public with no MIME restrictions
                await supabaseAdmin.storage.updateBucket(bucketId, {
                    public: true,
                    allowedMimeTypes: null as any, // Remove restrictions
                });
            }
        }

        // 2. Ensure Roles Exist
        const roles = [
            { name: 'Master', description: 'Can do everything' },
            { name: 'Approver', description: 'Can do initial approvals' },
            { name: 'HR', description: 'Recruitment team - View only' },
            { name: 'L1_Interviewer', description: 'Can do L1 interviews and request L2' },
            { name: 'L2_Interviewer', description: 'Can do dynamic L2 interviews' }
        ];

        for (const role of roles) {
            const { data: existingRole } = await supabaseAdmin
                .from('roles')
                .select('name')
                .eq('name', role.name)
                .single();

            if (!existingRole) {
                await supabaseAdmin.from('roles').insert(role);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Initialization error:", error.message);
        return { error: error.message };
    }
}

export async function analyzeCandidateWithAi(candidateId: string) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
        const isOpenRouter = apiKey?.startsWith('sk-or-');

        if (!apiKey) throw new Error("API Key (OPENROUTER_API_KEY or GEMINI_API_KEY) is not configured in .env.local");

        // 1. Get candidate and resume URL
        const { data: candidate, error: fetchError } = await supabaseAdmin
            .from('candidates')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (fetchError || !candidate) throw new Error("Candidate not found");
        if (!candidate.resume_url) throw new Error("No resume found for this candidate");

        const criteria = await getAiCriteria();

        // 2. Download resume
        const urlParts = candidate.resume_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const isWord = fileName.toLowerCase().endsWith('.docx');
        const isPdf = fileName.toLowerCase().endsWith('.pdf');

        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('resumes')
            .download(fileName);

        if (downloadError || !fileData) throw new Error(`Failed to download resume: ${downloadError?.message}`);

        let resumeText = "";
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (isWord) {
            const mammoth = (await import("mammoth")).default;
            const { value: text } = await mammoth.extractRawText({ buffer: buffer });
            resumeText = text;
        } else if (isPdf) {
            try {
                // pdfjs-dist (used internally by pdf-parse) requires DOMMatrix which
                // doesn't exist in Node.js. Polyfill it before importing.
                if (typeof (globalThis as any).DOMMatrix === 'undefined') {
                    (globalThis as any).DOMMatrix = class DOMMatrix {
                        constructor() { }
                        transformPoint(p: any) { return p; }
                        multiply() { return this; }
                        translate() { return this; }
                        scale() { return this; }
                        rotate() { return this; }
                        inverse() { return this; }
                    };
                }
                const { PDFParse } = await import("pdf-parse");
                const parser = new PDFParse({ data: buffer });
                const pdfData = await parser.getText();
                resumeText = pdfData.text;
                await parser.destroy();
            } catch (pdfErr: any) {
                console.warn("pdf-parse failed, falling back to raw buffer text:", pdfErr.message);
                resumeText = buffer.toString('utf8');
            }
        } else {
            resumeText = buffer.toString('utf8');
        }

        if (!resumeText || resumeText.trim().length < 50) {
            throw new Error("Could not extract enough text from the resume. Please ensure it's a valid document.");
        }

        // Truncate text if it's extremely long to avoid token limit issues (OpenRouter/Gemini)
        // 25,000 characters is ~6,000-8,000 tokens, which is plenty for any resume.
        if (resumeText.length > 25000) {
            resumeText = resumeText.substring(0, 25000) + "... [Text Truncated]";
        }

        const prompt = `
            You are an expert recruiter for a tech company. 
            Perform a deep analysis of the following candidate's resume content based on specific criteria.
            
            POSITION: ${candidate.position || 'Software Engineer'}
            RECRUITER'S CUSTOM CRITERIA: ${criteria}

            CANDIDATE SELF-REPORTED DETAILS (High Priority overrides):
            - Location: ${candidate.location || "Not specified"}
            - Education Status: ${candidate.education_status || "Not specified"}
            - Graduation Year: ${candidate.graduation_year || "Not specified"}
            - Degree Field: ${candidate.degree_field || "Not specified"}

            RESUME CONTENT:
            ${resumeText}

            Perform a structural and qualitative analysis and respond STRICTLY in JSON:
            {
                "score": number (0-100),
                "reasoning": "Quick one-sentence summary",
                "extracted_skills": ["skill1", "skill2", "..."],
                "experience_summary": "3-4 sentence detailed summary of work history",
                "matching_analysis": "Detailed breakdown of how they meet or miss the specific criteria mentioned above",
                "education_match": boolean,
                "verdict": "Highly Recommended" | "Recommended" | "Potential" | "Not Recommended"
            }

            BE OBJECTIVE AND CRITICAL. If they don't match the criteria, score them lower.
        `;

        let analysis;

        if (isOpenRouter) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://localhost:3000",
                    "X-Title": "CBT Recruitment Portal"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        { "role": "user", "content": prompt }
                    ],
                    "response_format": { "type": "json_object" }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(`OpenRouter Error: ${errData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const responseContent = data.choices[0].message.content;
            analysis = JSON.parse(responseContent);
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanedResponse = responseText.replace(/\`\`\`json|\`\`\`/g, '').trim();
            analysis = JSON.parse(cleanedResponse);
        }

        const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({
                ai_score: analysis.score,
                ai_reasoning: analysis.reasoning,
                ai_analysis_json: analysis,
                analysis_criteria: criteria
            })
            .eq('id', candidateId);

        if (updateError) throw updateError;

        await logAction('AI_ANALYSIS_COMPLETED', candidateId, 'candidate', { score: analysis.score });

        revalidatePath('/admin/applications');
        return {
            success: true,
            analysis: analysis
        };
    } catch (error: any) {
        console.error("AI Analysis error:", error);
        return { error: error.message };
    }
}