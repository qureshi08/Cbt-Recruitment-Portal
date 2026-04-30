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
    sendNotRecommendedEmail,
    notifyWorkflowStage
} from "@/lib/email";
import { getCurrentUser } from "@/lib/auth-utils";
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from 'pdf-lib';
import sharp from 'sharp';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';

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
                ai_status: "pending",
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (candidateError) throw candidateError;

        // Auto-trigger AI Analysis
        try {
            await analyzeCandidateWithAi(candidate.id);
        } catch (aiErr) {
            console.error("Background AI Analysis failed for new applicant:", candidate.id, aiErr);
        }

        // Create notification for admin
        await supabase.from('notifications').insert({
            title: 'New Application',
            message: `${name} has applied for ${position}.`,
            is_read: false
        });

        // Notify recruitment team & Approvers
        try {
            const recipients = await getRecipientsByRoles(['recruitment_team', 'approver']);
            if (recipients.length > 0) {
                await notifyWorkflowStage('NEW_APPLICATION', recipients, { name, email, position });
            }
        } catch (notifyErr) {
            console.error("Workflow notification failed:", notifyErr);
        }

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
                // Use production URL as reliable fallback for emails
                const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://cbt-recruitment-portal.vercel.app';

                // --- Log Action ---
                await logAction('STATUS_UPDATE', candidateId, 'candidate', { new_status: status });

                if (status === "Approved") {
                    const bookingLink = `${origin}/book-slot/${candidateId}`;
                    await sendAssessmentEmail(candidate.email, candidate.name, bookingLink);

                    // Notify recruitment team about approval
                    const recipients = await getRecipientsByRoles(['recruitment_team']);
                    if (recipients.length > 0) {
                        await notifyWorkflowStage('APPROVED', recipients, { name: candidate.name });
                    }
                } else if (status === "Recommended") {
                    await sendRecommendedEmail(candidate.email, candidate.name);
                    // Notify recruitment team about the recommendation decision
                    const recipients = await getRecipientsByRoles(['recruitment_team']);
                    if (recipients.length > 0) {
                        await notifyWorkflowStage('DECISION', recipients, { name: candidate.name, status: 'Recommended', interviewer: userName });
                    }
                } else if (status === "Not Recommended" || status === "Rejected") {
                    await sendNotRecommendedEmail(candidate.email, candidate.name);
                    // Notify recruitment team that the candidate was rejected
                    const recipients = await getRecipientsByRoles(['recruitment_team']);
                    if (recipients.length > 0) {
                        await notifyWorkflowStage('DECISION', recipients, { name: candidate.name, status: status, interviewer: userName });
                    }
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

        // Notify recruitment team about booking
        try {
            const recipients = await getRecipientsByRoles(['recruitment_team']);
            if (recipients.length > 0) {
                const { data: cData } = await supabaseAdmin.from('candidates').select('name').eq('id', candidateId).single();
                const { data: sData } = await supabaseAdmin.from('assessment_slots').select('start_time').eq('id', slotId).single();

                await notifyWorkflowStage('SLOT_BOOKED', recipients, {
                    name: cData?.name || 'A candidate',
                    slotTime: sData ? new Date(sData.start_time).toLocaleString() : 'N/A'
                });
            }
        } catch (notifyErr) {
            console.error("Booking notification failed:", notifyErr);
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
        // Notify L1 Interviewers
        try {
            const recipients = await getRecipientsByRoles(['l1_interviewer']);
            if (recipients.length > 0) {
                await notifyWorkflowStage('INTERVIEW_L1', recipients, {
                    name: candidate?.name || 'A candidate',
                    candidateId: candidateId
                });
            }
        } catch (notifyErr) {
            console.error("L1 Interview notification failed:", notifyErr);
        }

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

// --- Team Notification Recipient Management ---
export async function getTeamNotificationRecipients() {
    const { data, error } = await supabaseAdmin
        .from('team_notifications')
        .select('*')
        .order('category', { ascending: true });

    if (error) throw error;
    return data;
}

// Helper to get emails for specific roles
async function getRecipientsByRoles(categories: string[]): Promise<string[]> {
    try {
        const { data } = await supabaseAdmin
            .from('team_notifications')
            .select('email')
            .in('category', categories);
        return data?.map(r => r.email) || [];
    } catch (e) {
        console.error("Failed to fetch recipients:", e);
        return [];
    }
}

export async function addTeamNotificationRecipient(email: string, category: string) {
    const { error } = await supabaseAdmin
        .from('team_notifications')
        .insert({ email, category });

    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function removeTeamNotificationRecipient(id: string) {
    const { error } = await supabaseAdmin
        .from('team_notifications')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function submitInterviewerAvailability(candidateId: string, email: string, isAvailable: boolean, preferredTime?: string, interviewerName?: string) {
    try {
        const { data: candidate } = await supabaseAdmin
            .from('candidates')
            .select('name')
            .eq('id', candidateId)
            .single();

        await logAction('INTERVIEWER_AVAILABILITY', candidateId, 'candidate', {
            interviewer_email: email,
            interviewer_name: interviewerName || email,
            is_available: isAvailable,
            preferred_time: preferredTime
        });

        const recipients = await getRecipientsByRoles(['recruitment_team']);
        if (recipients.length > 0) {
            await notifyWorkflowStage('AVAILABILITY_RESPONSE', recipients, {
                candidateName: candidate?.name || 'A candidate',
                interviewerEmail: email,
                interviewerName: interviewerName || email,
                isAvailable,
                preferredTime
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error("submitInterviewerAvailability error:", error);
        return { error: error.message };
    }
}

export async function getCandidateBasic(id: string) {
    const { data, error } = await supabaseAdmin
        .from('candidates')
        .select('name, position')
        .eq('id', id)
        .single();
    return data;
}

export async function getInterviewerNameByEmail(email: string) {
    if (!email) return null;

    // 1. Try public.users table
    const { data: userData } = await supabaseAdmin
        .from('users')
        .select('full_name')
        .ilike('email', email.trim())
        .maybeSingle();

    if (userData?.full_name) return userData.full_name;

    // 2. Fallback: Pretty print from email (e.g. muhammad.anas -> Muhammad Anas)
    const prefix = email.split('@')[0];
    const prettyName = prefix
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return prettyName || "Interviewer";
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

        try {
            const recipients = await getRecipientsByRoles(['l2_interviewer']);
            if (recipients.length > 0) {
                const { data: cData } = await supabaseAdmin.from('candidates').select('name').eq('id', candidateId).single();
                await notifyWorkflowStage('INTERVIEW_L2', recipients, {
                    name: cData?.name || 'A candidate',
                    candidateId: candidateId
                });
            }
        } catch (notifyErr) {
            console.error("L2 Interview notification failed:", notifyErr);
        }

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

        // Notify recruitment team about final decision
        try {
            const recipients = await getRecipientsByRoles(['recruitment_team']);
            if (recipients.length > 0) {
                const { data: cData } = await supabaseAdmin.from('candidates').select('name').eq('id', candidateId).single();
                await notifyWorkflowStage('DECISION', recipients, {
                    name: cData?.name || 'A candidate',
                    status: decision,
                    interviewer: interviewerName
                });
            }
        } catch (notifyErr) {
            console.error("Decision notification failed:", notifyErr);
        }

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

export async function markSingleNotificationAsRead(id: string) {
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);

        if (error) throw error;
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
        // Update status to processing
        await supabaseAdmin
            .from('candidates')
            .update({ ai_status: 'processing' })
            .eq('id', candidateId);

        // Prioritize direct Gemini API over OpenRouter for stability/free tier
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
        const isOpenRouter = !!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY;

        console.log(`[AI Analysis] API Key present: ${!!apiKey}, length: ${apiKey?.length || 0}, isOpenRouter: ${isOpenRouter}`);

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
                console.log(`[AI Analysis] Starting PDF Extraction (ID: ${candidateId}, Buffer: ${buffer.length} bytes)`);

                // Stage 1: Standard pdf-parse
                let text = "";
                try {
                    const pdfData = await pdf(buffer);
                    text = pdfData.text || "";
                    console.log(`[AI Analysis] Stage 1 (Standard): ${text.length} characters.`);
                } catch (pdfErr: any) {
                    console.warn("[AI Analysis] Stage 1 Error:", pdfErr.message);
                }

                // Stage 2: Robust String Sweep (fallback for corrupted layers)
                if (text.trim().length < 100) {
                    const rawBufferString = buffer.toString('binary');
                    const tokens = rawBufferString.match(/[a-zA-Z0-9\s\.\,\-\@\:]{3,}/g) || [];
                    const sweptText = tokens
                        .filter(s => s.trim().length > 3 && /[a-zA-Z]{1,}/.test(s))
                        .join(' ')
                        .replace(/\s+/g, ' ');

                    if (sweptText.length > 50) {
                        text += "\n\n--- RECOVERY SWEEP ---\n" + sweptText;
                        console.log(`[AI Analysis] Stage 2 (Sweep): ${sweptText.length} characters.`);
                    }
                }

                resumeText = text;

                // Stage 3: Vision Fallback (for image-based PDFs)
                let pdfImages: string[] = [];
                if (resumeText.trim().length < 400) {
                    try {
                        const pdfDoc = await PDFDocument.load(buffer);
                        const pages = pdfDoc.getPages();
                        for (let i = 0; i < Math.min(pages.length, 3); i++) {
                            const page = (pages[i] as any);
                            const resources = page.node.Resources();
                            if (!resources) continue;
                            const xObjects = resources.get(PDFName.of('XObject'));
                            if (!xObjects) continue;
                            const xObjectDict = pdfDoc.context.lookup(xObjects) as PDFDict;

                            for (const [name, ref] of xObjectDict.entries()) {
                                const xObject = pdfDoc.context.lookup(ref);
                                if (xObject instanceof PDFRawStream) {
                                    const subtype = xObject.dict.get(PDFName.of('Subtype'));
                                    if (subtype === PDFName.of('Image')) {
                                        const width = xObject.dict.get(PDFName.of('Width')) as any;
                                        if (width && width.numberValue && width.numberValue < 100) continue; // skip icons

                                        const imageBuffer = await sharp(xObject.contents).toFormat('jpeg').toBuffer();
                                        pdfImages.push(imageBuffer.toString('base64'));
                                    }
                                }
                            }
                        }
                        console.log(`[AI Analysis] Stage 3 (Vision): Found ${pdfImages.length} images.`);
                    } catch (vErr) {
                        console.warn("[AI Analysis] Stage 3 Vision attempt failed:", vErr);
                    }
                }

                if (pdfImages.length > 0) {
                    (candidate as any)._vision_images = pdfImages;
                    if (resumeText.length < 100) resumeText = `[SCAN-DETECTION: Analyzing ${pdfImages.length} images via Vision API]`;
                }
            } catch (err: any) {
                console.error("[AI Analysis] Fatal Extraction Block Error:", err.message);
            }
        } else {
            resumeText = buffer.toString('utf8');
        }

        const charCount = resumeText?.length || 0;
        const imgCount = (candidate as any)._vision_images?.length || 0;

        if (charCount < 50 && imgCount === 0) {
            throw new Error(`AI Analysis failed: Empty resume detected. (Extracted: ${charCount} chars, ${imgCount} images). Please ensure the file is a valid PDF or Word document.`);
        }

        // TARGETED STRIPPING: Normalize and clean structural noise
        resumeText = resumeText
            .replace(/\r\n/g, "\n")                        // Normalize line endings (from guide)
            .replace(/\n{3,}/g, "\n\n")                    // Collapse excessive blank lines (from guide)
            .replace(/[ \t]{2,}/g, " ")                    // Collapse multiple spaces (from guide)
            .replace(/<<[\s\S]*?>>/g, ' ')                 // Remove Dict blocks
            .replace(/[a-zA-Z0-9]{45,}/g, '')              // Remove long hex/encoded strings
            .replace(/\/Type\s+\/\w+/g, '')                // Remove /Type /Page etc
            .replace(/\/Length\s+\d+/g, '')                // Remove /Length 123
            .replace(/\/Filter\s+\/\w+/g, '')              // Remove /Filter /FlateDecode
            .replace(/\/FontDescriptor/g, '')
            .split('\n')
            .filter(line => {
                const l = line.trim();
                return l.length > 3 &&
                    !l.includes('Encoding') &&
                    !l.includes('ProcSet') &&
                    !l.includes('XObject');
            })
            .join(' ')
            .replace(/\s+/g, ' ')
            .substring(0, 26000);

        // Truncate to a safe but generous token limit
        if (resumeText.length > 28000) {
            resumeText = resumeText.substring(0, 28000) + "... [Truncated]";
        }

        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const prompt = `
            You are an expert recruitment screening assistant for the Convergent Graduate Academy Program (CGAP) 
            at Convergent Business Technologies (CBT), Islamabad.

            Perform a deep analysis of the following candidate's resume based on the recruiter's criteria.

            POSITION: CGAP — Convergent Graduate Academy Program
            RECRUITER'S CUSTOM CRITERIA:
            ${criteria}

            CANDIDATE SELF-REPORTED DETAILS (treat as high-priority override if present):
            - Full Name: ${candidate.name || "Not specified"}
            - Location: ${candidate.location || "Not specified"}
            - Education Status: ${candidate.education_status || "Not specified"}
            - Graduation Year: ${candidate.graduation_year || "Not specified"}
            - Degree Field: ${candidate.degree_field || "Not specified"}

            RESUME CONTENT:
            ${resumeText}

            INSTRUCTIONS:
            1. Apply the recruiter's criteria strictly in the order listed.
            2. If any HARD FILTER fails, set score to 0 and verdict to "Not Recommended". State which filter failed.
            3. For passing candidates, score secondary criteria holistically.
            4. Infer missing fields (e.g., location, graduation year) from resume content where possible.
            5. Flag anything inferred vs. explicitly stated.
            6. Assess English proficiency from the quality of the resume writing itself.

            Respond STRICTLY in JSON format with no extra text, no markdown, no backticks:
            {
                "score": 0-100,
                "reasoning": "One concise sentence summarizing the overall assessment.",
                "extracted_info": {
                    "name": "full name from resume",
                    "location": "extracted or inferred location",
                    "degree": "degree name",
                    "degree_field": "field of study",
                    "university": "university name",
                    "graduation_year": "year or expected year",
                    "years_of_experience": "number or 'Fresh Graduate'",
                    "email": "email if present",
                    "phone": "phone if present"
                },
                "extracted_skills": ["skill1", "skill2"],
                "experience_summary": "3-4 sentence summary of academic and work history.",
                "matching_analysis": {
                    "location_check": { "status": "PASS | FAIL | UNVERIFIABLE", "detail": "explanation" },
                    "degree_field_check": { "status": "PASS | FAIL", "detail": "explanation" },
                    "graduation_check": { "status": "PASS | FAIL", "detail": "explanation" },
                    "analytical_thinking": { "status": "STRONG | AVERAGE | WEAK", "detail": "explanation" },
                    "english_proficiency": { "status": "STRONG | AVERAGE | WEAK", "detail": "explanation" },
                    "commitment_signals": { "status": "STRONG | AVERAGE | WEAK", "detail": "explanation" },
                    "field_relevance": { "status": "HIGH | MODERATE | LOW", "detail": "explanation" },
                    "portfolio_projects": { "status": "STRONG | AVERAGE | WEAK | NONE", "detail": "explanation" }
                },
                "hard_filter_failed": "name of failed filter or null",
                "education_match": boolean,
                "flags": ["any warnings or inferences made"],
                "verdict": "Highly Recommended | Recommended | Potential | Not Recommended"
            }
        `;
        let analysis;

        if (isOpenRouter) {
            const visionImages = (candidate as any)._vision_images || [];
            let content: any = prompt;

            if (visionImages.length > 0) {
                content = [
                    { type: "text", text: `${prompt}\n\nSTRICT JSON ONLY.` },
                    ...visionImages.map((b64: string) => ({
                        type: "image_url",
                        image_url: { url: `data:image/jpeg;base64,${b64}` }
                    }))
                ];
            }

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://cbt-recruitment-portal.vercel.app",
                    "X-Title": "CBT Recruitment Portal"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [{ "role": "user", "content": content }],
                    "max_tokens": 1200,
                    "response_format": { "type": "json_object" },
                    "temperature": 0.1
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(`OpenRouter Error: ${errData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const responseContent = data.choices?.[0]?.message?.content;
            if (!responseContent) throw new Error("AI returned an empty response");
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            analysis = JSON.parse((jsonMatch ? jsonMatch[0] : responseContent).replace(/```json/gi, "").replace(/```/g, "").trim());
        } else {
            // Direct REST Implementation — model IDs verified against v1beta/models endpoint
            const modelsToTry: { model: string; apiVersion: string }[] = [
                { model: "gemini-2.0-flash", apiVersion: "v1beta" }, // confirmed available
                { model: "gemini-2.0-flash-lite", apiVersion: "v1beta" }, // confirmed available
                { model: "gemini-2.0-flash-001", apiVersion: "v1beta" }, // confirmed available
                { model: "gemini-flash-latest", apiVersion: "v1beta" }, // confirmed available
                { model: "gemini-2.5-flash", apiVersion: "v1beta" }, // confirmed available (thinking)
            ];
            let lastErr = null;

            for (const { model: modelName, apiVersion } of modelsToTry) {
                try {
                    const visionImages = (candidate as any)._vision_images || [];
                    const parts: any[] = [{ text: `${prompt}\n\nSTRICT JSON ONLY.` }];

                    if (visionImages.length > 0) {
                        visionImages.forEach((b64: string) => {
                            parts.push({ inline_data: { data: b64, mime_type: "image/jpeg" } });
                        });
                    }

                    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`;
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts }],
                            generationConfig: {
                                temperature: 0.1
                            }
                        })
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(`HTTP ${response.status}: ${errText}`);
                    }

                    const data = await response.json();
                    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        throw new Error("Empty response from AI");
                    }

                    const responseText = data.candidates[0].content.parts[0].text;
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    const cleanedResponse = jsonMatch ? jsonMatch[0] : responseText;
                    analysis = JSON.parse(cleanedResponse.replace(/```json/gi, "").replace(/```/g, "").trim());
                    console.log(`[REST] Success with ${apiVersion}/${modelName}`);

                    if (analysis) break;
                } catch (err: any) {
                    console.warn(`[REST] ${apiVersion}/${modelName} failed: ${err.message}`);
                    lastErr = err;
                }
            }

            // FINAL FALLBACK: OpenRouter
            if (!analysis && process.env.OPENROUTER_API_KEY) {
                console.log("Direct REST failed. Attempting OpenRouter fallback...");
                const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": "google/gemini-2.0-flash-001",
                        "messages": [{ "role": "user", "content": prompt }],
                        "max_tokens": 2000,
                        "response_format": { "type": "json_object" }
                    })
                });
                if (orResponse.ok) {
                    const orData = await orResponse.json();
                    const orContent = orData.choices?.[0]?.message?.content;
                    const orMatch = orContent?.match(/\{[\s\S]*\}/);
                    if (orMatch) {
                        analysis = JSON.parse(orMatch[0].replace(/```json/gi, "").replace(/```/g, "").trim());
                    }
                }
            }

            if (!analysis) throw lastErr || new Error("AI analysis failed on all models.");
        }

        const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({
                ai_score: analysis.score,
                ai_reasoning: analysis.reasoning,
                ai_analysis_json: analysis,
                analysis_criteria: criteria,
                ai_status: 'completed'
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
        console.error("AI Analysis fatal error:", error);

        let userMessage = "The AI service is temporarily unavailable. Please try again in 5 minutes.";
        const errMsg = error.message?.toLowerCase() || "";

        if (errMsg.includes("404") || errMsg.includes("not found")) {
            userMessage = `AI Setup Error: The system is trying to use a model that isn't fully enabled on your account. Raw error: ${errMsg.slice(0, 100)}`;
        } else if (errMsg.includes("apikey") || errMsg.includes("api key") || errMsg.includes("unauthorized")) {
            userMessage = "Security Key Error: The AI Key configured in Vercel is invalid or has expired. Please update your GEMINI_API_KEY.";
        } else if (errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("429")) {
            userMessage = "Usage Limit Reached: Too many resumes were screened at once. Please wait 60 seconds and try again (Free Tier limits).";
        } else if (errMsg.includes("json")) {
            userMessage = "Reading Error: The AI couldn't parse this specific resume format. Please try re-uploading the resume as a standard PDF.";
        } else if (errMsg.includes("empty resume")) {
            userMessage = "File Error: This resume appears to be empty or unscannable. Please check the file and try again.";
        } else {
            userMessage = `Analysis Failed: ${errMsg.slice(0, 80)}...`;
        }

        // Update status to failed in database
        try {
            await supabaseAdmin
                .from('candidates')
                .update({
                    ai_status: 'failed' as any,
                    ai_reasoning: userMessage
                })
                .eq('id', candidateId);
        } catch (dbErr) {
            console.error("Failed to update AI failure status in DB:", dbErr);
        }

        return { error: userMessage, rawError: error.message };
    }
}