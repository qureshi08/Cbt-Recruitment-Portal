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

export type UserRole = 'Master' | 'Approver' | 'HR' | 'Interviewer' | 'L1_Interviewer' | 'L2_Interviewer';

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
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data;
}

export async function fetchAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            user_roles (
                roles (
                    name
                )
            )
        `);

    if (error) throw error;
    return data.map((u: any) => ({
        ...u,
        roles: u.user_roles.map((ur: any) => ur.roles.name)
    }));
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

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateAdminUser(userId: string, fullName: string, roleNames: string[]) {
    try {
        // 1. Update public.users
        const { error: userError } = await supabaseAdmin
            .from('users')
            .update({ full_name: fullName })
            .eq('id', userId);

        if (userError) throw userError;

        // 2. Update Auth metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { full_name: fullName }
        });

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
    const resume = formData.get("resume") as File;
    const position = formData.get("position") as string || "General Application";

    try {
        if (!resume || resume.size === 0) throw new Error("Resume is required");

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
                resume_url: publicUrl,
                position,
                status: "Applied"
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
        const { data: candidate, error } = await supabase
            .from("candidates")
            .update({ status })
            .eq("id", candidateId)
            .select()
            .single();

        if (error) throw error;

        // Trigger Email Notifications
        if (candidate) {
            try {
                const origin = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

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
                    note: `Status updated, but email failed: ${emailError.message}`
                };
            }
        }

        revalidatePath("/admin/applications");
        revalidatePath("/admin");
        return { success: true };
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

export async function requestL2Interview(interviewId: string, candidateId: string, l1Feedback: string) {
    try {
        // 1. Save L1 feedback and mark as needing L2 review (same record, no duplicate)
        const { error: updateError } = await supabaseAdmin
            .from("interviews")
            .update({
                decision: "L2 Interview Required",
                feedback: `L1: ${l1Feedback}`
            })
            .eq("id", interviewId);

        if (updateError) throw updateError;

        // 2. Update Candidate Status
        await updateCandidateStatus(candidateId, "L2 Interview Required");

        revalidatePath("/admin/interviews");
        revalidatePath("/admin/applications");
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
        const { error: uploadError } = await supabaseAdmin.storage
            .from('assessment-scores')
            .upload(finalFileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('assessment-scores')
            .getPublicUrl(finalFileName);

        // Update candidate record
        const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({ assessment_score_url: publicUrl })
            .eq('id', candidateId);

        if (updateError) throw new Error(`Database update failed: ${updateError.message}`);

        revalidatePath('/admin/applications');
        return { success: true, publicUrl };
    } catch (error: any) {
        console.error("uploadAssessmentScore error:", error.message);
        return { error: error.message };
    }
}

export async function updateCandidate(candidateId: string, updates: Partial<any>) {
    try {
        const { error } = await supabase
            .from("candidates")
            .update(updates)
            .eq("id", candidateId);

        if (error) throw error;

        revalidatePath("/admin/applications");
        revalidatePath("/admin/interviews");
        return { success: true };
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
            { name: 'Interviewer', description: 'Can do interviews' },
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
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in .env.local");

        // 1. Get candidate and resume URL
        const { data: candidate, error: fetchError } = await supabaseAdmin
            .from('candidates')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (fetchError || !candidate) throw new Error("Candidate not found");
        if (!candidate.resume_url) throw new Error("No resume found for this candidate");

        // 2. Download resume from Supabase Storage
        // Extract filename from URL
        const urlParts = candidate.resume_url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('resumes')
            .download(fileName);

        if (downloadError || !fileData) throw new Error(`Failed to download resume: ${downloadError?.message}`);

        // 3. Prepare PDF for Gemini
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const base64Data = buffer.toString("base64");

        // 4. Send to Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert recruiter for a tech company. 
            Analyze the attached resume for the position of: ${candidate.position || 'Software Engineer'}.
            
            Candidate Name: ${candidate.name}

            Please provide:
            1. A score from 0 to 100 based on how well the candidate fits the role.
            2. A brief reasoning (2-3 sentences) explaining the score. Focus on skills, experience, and educational background.

            Format your response strictly as a JSON object:
            {
                "score": 85,
                "reasoning": "Strong technical background with 5 years of React experience. Has worked on relevant projects but lacks specific cloud infrastructure knowledge required for this role."
            }
        `;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            }
        ]);
        const responseText = result.response.text();

        // Clean up response if Gemini adds markdown code blocks
        const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanedResponse);

        // 5. Update candidate record
        const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({
                ai_score: analysis.score,
                ai_reasoning: analysis.reasoning
            })
            .eq('id', candidateId);

        if (updateError) throw updateError;

        revalidatePath('/admin/applications');
        return {
            success: true,
            score: analysis.score,
            reasoning: analysis.reasoning
        };
    } catch (error: any) {
        console.error("AI Analysis error:", error);
        return { error: error.message };
    }
}
