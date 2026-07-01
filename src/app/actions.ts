"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { after } from 'next/server';
import {
    sendAssessmentEmail,
    sendCustomCandidateEmail,
    sendRecommendedEmail,
    sendNotRecommendedEmail,
    sendSelectedEmail,
    notifyWorkflowStage,
    sendTeamNotification
} from "@/lib/email";
import { getCurrentUser } from "@/lib/auth-utils";
import { PDFDocument, PDFName, PDFDict, PDFRawStream } from 'pdf-lib';
import sharp from 'sharp';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { createTeamsMeeting } from "@/lib/microsoft";
import { CHATBOT_PROMPT_KEY, CGAP_SUPPORT_SYSTEM_PROMPT_DEFAULT } from "@/lib/chatbot-prompt";

export type UserRole = 'Master' | 'Approver' | 'HR' | 'L1_Interviewer' | 'L2_Interviewer';

// --- Audit Logging Helper ---
async function logAction(action: string, entityId: string, entityType: string, details: any) {
    try {
        const user = await getCurrentUser();
        // Unauthenticated requests come from the candidate self-service flow
        // (/book-slot/[id]). Log them as 'Candidate (self)' so the audit trail
        // is complete — silently skipping these used to make candidate-triggered
        // status changes invisible.
        const actorName = user?.full_name ?? 'Candidate (self)';
        const actorId = user?.id ?? null;

        await supabaseAdmin.from('audit_logs').insert({
            user_id: actorId,
            user_name: actorName,
            action,
            entity_id: entityId,
            entity_type: entityType,
            details,
        });

        // If it's a candidate action, also update the denormalized field for easy UI access
        if (entityType === 'candidate') {
            await supabaseAdmin
                .from('candidates')
                .update({ last_action_by: actorName })
                .eq('id', entityId);
        }
        return actorName;
    } catch (error) {
        console.error("Logging failed:", error);
        return null;
    }
}

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabaseClient = await createClient();

    // Hard-clear any existing session first. Without this, a stale cookie
    // from a previous user can survive a failed login attempt and silently
    // keep them signed in as whoever was on the machine before.
    try {
        await supabaseClient.auth.signOut();
    } catch {
        // Already signed out — fine.
    }

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
    // IMPORTANT: Must use supabaseAdmin (service role) here.
    // The anonymous client is subject to RLS policies and has no user session
    // context in Server Actions, causing it to silently return [] for all users,
    // which triggers an infinite redirect loop (admin -> login -> admin).
    const { data, error } = await supabaseAdmin
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
        console.log("Attempting to create/sync user:", email);
        let userId: string;

        // 1. Try to create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || 'Cbt@123456',
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            // If user already exists in Auth, we need to find their ID
            if (authError.message.includes("already been registered") || authError.status === 422) {
                console.log("User already exists in Auth, fetching details...");
                const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) throw listError;
                
                const existingUser = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                if (!existingUser) throw new Error("Could not find existing user even though Auth reported they exist.");
                userId = existingUser.id;
            } else {
                throw authError;
            }
        } else {
            userId = authData.user.id;
        }

        // 2. Ensure entry exists in public.users table (Upsert)
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({ id: userId, email, full_name: fullName });

        if (userError) throw userError;

        // 3. Clear existing roles to avoid duplicates and re-assign
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

        await logAction('USER_SYNCED', userId, 'user', { email, roles: roleNames });

        revalidatePath('/admin/settings');
        revalidatePath('/admin', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error("Create user error:", error);
        return { error: error.message };
    }
}

export async function deleteAdminUser(userId: string) {
    try {
        // 1. Detach or delete dependent records to avoid Foreign Key violations
        // Set user_id to null in audit_logs so history is preserved but link is gone
        await supabaseAdmin.from('audit_logs').update({ user_id: null }).eq('user_id', userId);

        // Detach from interviews and slots
        await supabaseAdmin.from('interviews').update({ interviewer_id: null }).eq('interviewer_id', userId);
        await supabaseAdmin.from('assessment_slots').update({ hr_id: null }).eq('hr_id', userId);

        // Delete notifications for this user
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

        // 2. Delete from Auth (this also deletes from public.users due to CASCADE in public.users table)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        await logAction('USER_DELETED', userId, 'user', { target_user_id: userId });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error("deleteAdminUser error:", error);
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
        // Master kill-switch — if applications are closed, reject the submit
        // server-side regardless of what the client sent. The button on the
        // landing page is also disabled, but this guard means a direct POST
        // (curl, replayed request, etc.) can't bypass the closure.
        const intake = await getApplicationsOpenSetting();
        if (!intake.open) {
            return { error: "Applications are currently closed. Please check back later for the next intake." };
        }

        if (!resume || resume.size === 0) throw new Error("Resume is required");
        if (!cnic) throw new Error("CNIC Number is required");
        if (!email) throw new Error("Email is required");
        if (!phone) throw new Error("Phone number is required");

        // Normalize CNIC and enforce strict Pakistani 13-digit format. The
        // previous `< 5` check let 12-digit (truncated) CNICs through, which
        // made the same person look like two different people in dedup.
        const normalizedCnic = cnic.replace(/\D/g, '');
        if (normalizedCnic.length !== 13) {
            throw new Error("CNIC must be 13 digits (format: XXXXX-XXXXXXX-X).");
        }
        const normalizedEmail = email.trim().toLowerCase();

        // Phone: Pakistani local mobile only (03XXXXXXXXX, 11 digits). Accept
        // common variants (+92…, 0092…) and rewrite to the canonical 03 form.
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0092')) {
            normalizedPhone = '0' + normalizedPhone.slice(4);
        } else if (normalizedPhone.startsWith('92')) {
            normalizedPhone = '0' + normalizedPhone.slice(2);
        }
        if (!/^03\d{9}$/.test(normalizedPhone)) {
            throw new Error("Phone must be a Pakistani mobile number in the format 03XXXXXXXXX (11 digits).");
        }

        // --- Reapplication Logic — dedup on CNIC OR email ---
        // Email is the most reliable identifier; CNIC catches the edge case
        // where someone changes email addresses between applications. We use
        // ilike for email so existing rows stored with mixed casing still
        // match, and check both the normalized and as-typed CNIC so legacy
        // rows stored with dashes still match too.
        const { data: pastApps, error: pastAppError } = await supabaseAdmin
            .from('candidates')
            .select('id, status, created_at, updated_at, cnic, email')
            .or(`cnic.eq.${normalizedCnic},cnic.eq.${cnic},email.ilike.${normalizedEmail}`)
            .order('created_at', { ascending: false })
            .limit(1);

        if (pastAppError) {
            console.error("Error checking past applications:", pastAppError);
            throw new Error("System is currently unable to verify eligibility. Please try again in a few minutes.");
        } else if (pastApps && pastApps.length > 0) {
            const lastApp = pastApps[0];

            // If an active application exists, block
            const activeStatuses = ['Applied', 'Approved', 'Invite Sent', 'Assessment Scheduled', 'Confirmed', 'Rescheduled', 'Assessment Completed', 'To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required', 'Recommended', 'Selected'];
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

        // Fetch current batch number from settings
        const { data: batchSetting } = await supabaseAdmin
            .from('portal_settings')
            .select('value')
            .eq('key', 'current_batch_number')
            .single();

        const currentBatch = batchSetting?.value || '31'; // Default fallback

        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .insert({
                name,
                email: normalizedEmail,
                phone: normalizedPhone,
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
                batch_number: currentBatch, // <--- Assigned automatically
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (candidateError) throw candidateError;

        // 1. Notify Candidate IMMEDIATELY (UX: Provide instant feedback)
        try {
            await notifyWorkflowStage('APPLICATION_RECEIVED_CANDIDATE', [email], { name, position });
        } catch (candidateNotifyErr) {
            console.error("Candidate receipt email failed:", candidateNotifyErr);
        }

        // 2. Notify recruitment team & Approvers
        try {
            const recipients = await getRecipientsByRoles(['recruitment_team', 'approver']);
            if (recipients.length > 0) {
                await notifyWorkflowStage('NEW_APPLICATION', recipients, { name, email, position });
            }
        } catch (notifyErr) {
            console.error("Workflow notification failed:", notifyErr);
        }

        // 3. Create notification for admin dashboard
        await supabase.from('notifications').insert({
            title: 'New Application',
            message: `${name} has applied for ${position}.`,
            is_read: false
        });

        // 4. Automatically trigger AI resume analysis in the background after the response is returned to candidate
        after(async () => {
            try {
                console.log(`[AI Auto-Screening] Starting background analysis for candidate: ${candidate.id} (${candidate.name})`);
                await analyzeCandidateWithAi(candidate.id);
                console.log(`[AI Auto-Screening] Finished background analysis for candidate: ${candidate.id}`);
            } catch (err) {
                console.error(`[AI Auto-Screening] Error in background analysis for candidate ${candidate.id}:`, err);
            }
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
                // --- Log Action ---
                await logAction('STATUS_UPDATE', candidateId, 'candidate', { new_status: status });

                if (status === "Approved") {
                    // Step 1: Notify ONLY the recruitment team — do NOT email the candidate yet.
                    // HR will first create slots, then manually send the booking invite.
                    const recipients = await getRecipientsByRoles(['recruitment_team']);
                    if (recipients.length > 0) {
                        await notifyWorkflowStage('APPROVED_PENDING_SLOTS', recipients, { name: candidate.name });
                    }
                } else if (status === "Recommended") {
                    // Queue candidate email to be sent with daily cron instead of sending instantly
                    await supabaseAdmin
                        .from('notification_queue')
                        .insert({
                            category: 'candidate_decision',
                            event_type: 'CANDIDATE_RECOMMENDED',
                            details: { email: candidate.email, name: candidate.name }
                        });

                    // Notify recruitment team about the recommendation decision
                    const recipients = await getRecipientsByRoles(['recruitment_team']);
                    if (recipients.length > 0) {
                        await notifyWorkflowStage('DECISION', recipients, { name: candidate.name, status: 'Recommended', interviewer: userName });
                    }
                } else if (status === "Not Recommended" || status === "Rejected") {
                    // Queue candidate email to be sent with daily cron instead of sending instantly
                    await supabaseAdmin
                        .from('notification_queue')
                        .insert({
                            category: 'candidate_decision',
                            event_type: 'CANDIDATE_REJECTED',
                            details: { email: candidate.email, name: candidate.name }
                        });

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

/**
 * Manual override for the recruitment team to jump a candidate into a
 * specific pipeline status without going through the normal workflow buttons.
 * Useful when an assessment / interview happened off-system (e.g. on the
 * phone) and the team just needs to record the outcome.
 *
 * In addition to the standard status flip (delegated to
 * updateCandidateStatus so emails/queues still fire correctly), this also:
 *  - Creates an interview row when transitioning to 'To Be Interviewed' or
 *    'Interview Scheduled' so the candidate shows up in the Evaluation
 *    Center ready for the interviewer to add scores. Idempotent — won't
 *    create a duplicate if one already exists for this candidate.
 *  - Logs a MANUAL_STATUS_CHANGE audit entry separate from the regular
 *    STATUS_UPDATE so manual overrides are auditable.
 */
export async function setCandidateStatusManually(
    candidateId: string,
    newStatus: string,
    reason?: string,
) {
    try {
        const actingUser = await getCurrentUser();
        if (!actingUser) {
            return { error: 'You must be signed in to change a candidate status.' };
        }

        // Use the existing updateCandidateStatus so all the side-effect logic
        // (Approved -> notify recruitment, Recommended/Rejected -> queue
        // candidate email + notify team) keeps firing for those statuses.
        const statusResult = await updateCandidateStatus(candidateId, newStatus);
        if (!statusResult.success) {
            return { error: statusResult.error || 'Failed to update status.' };
        }

        // For statuses that imply 'an interview is happening', ensure a row
        // exists in the interviews table so the Evaluation Center renders
        // the candidate with an Add Evaluation button.
        const INTERVIEW_REQUIRING_STATUSES = ['To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required'];
        if (INTERVIEW_REQUIRING_STATUSES.includes(newStatus)) {
            const { data: existing } = await supabaseAdmin
                .from('interviews')
                .select('id, decision')
                .eq('candidate_id', candidateId)
                .order('created_at', { ascending: false })
                .limit(1);

            const latest = existing?.[0];
            const needsNewRow = !latest || (latest.decision === 'Recommended' || latest.decision === 'Not Recommended');

            if (needsNewRow) {
                const { error: insertError } = await supabaseAdmin
                    .from('interviews')
                    .insert({
                        candidate_id: candidateId,
                        scheduled_at: new Date().toISOString(),
                        decision: null,
                        is_locked: false,
                    });
                if (insertError) {
                    console.error('setCandidateStatusManually: failed to create interview row', insertError);
                }
            }
        }

        await logAction('MANUAL_STATUS_CHANGE', candidateId, 'candidate', {
            new_status: newStatus,
            reason: reason || null,
            changed_by: actingUser.full_name,
        });

        revalidatePath('/admin/applications');
        revalidatePath('/admin/interviews');
        revalidatePath('/admin');
        return { success: true, last_action_by: actingUser.full_name };
    } catch (error: any) {
        console.error('setCandidateStatusManually error:', error);
        return { error: error.message };
    }
}

/**
 * Step 2 of the approval flow (HR action):
 * Sends the assessment booking link email to the candidate.
 * This is called AFTER the recruitment team has made slots available.
 */
export async function sendAssessmentInvite(candidateId: string) {
    try {
        const actingUser = await getCurrentUser();
        const userName = actingUser?.full_name || 'System User';

        // Fetch candidate details
        const { data: candidate, error } = await supabaseAdmin
            .from('candidates')
            .select('name, email, status')
            .eq('id', candidateId)
            .single();

        if (error || !candidate) throw new Error('Candidate not found.');
        if (candidate.status !== 'Approved' && candidate.status !== 'Invite Sent' && candidate.status !== 'Absent') {
            throw new Error(`Cannot send invite: candidate status is "${candidate.status}", expected "Approved", "Invite Sent" or "Absent".`);
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://cbt-recruitment-portal.vercel.app';
        const bookingLink = `${origin}/book-slot/${candidateId}`;

        // Send the booking email to the candidate
        await sendAssessmentEmail(candidate.email, candidate.name, bookingLink);

        // Update candidate status to Invite Sent in database
        const { error: statusUpdateError } = await supabaseAdmin
            .from('candidates')
            .update({
                status: 'Invite Sent',
                last_action_by: userName,
                updated_at: new Date().toISOString()
            })
            .eq('id', candidateId);

        if (statusUpdateError) throw statusUpdateError;

        // Log the action
        await logAction('ASSESSMENT_INVITE_SENT', candidateId, 'candidate', { sent_by: userName });

        // Also notify the recruitment team that the invite has been dispatched
        try {
            const recipients = await getRecipientsByRoles(['recruitment_team']);
            if (recipients.length > 0) {
                await notifyWorkflowStage('INVITE_SENT', recipients, { name: candidate.name, sentBy: userName });
            }
        } catch (notifyErr) {
            console.error('Invite dispatch notification failed:', notifyErr);
        }

        revalidatePath('/admin/applications');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('sendAssessmentInvite error:', error);
        return { error: error.message };
    }
}

/**
 * Step 2 of the post-interview flow:
 * Marks the candidate as 'Selected' and sends them the final
 * "Welcome to CGAP!" email. Called manually by HR/Master from the UI.
 */
export async function sendCandidateSelectionEmail(candidateId: string) {
    try {
        const actingUser = await getCurrentUser();
        const userName = actingUser?.full_name || 'System User';

        const { data: candidate, error } = await supabaseAdmin
            .from('candidates')
            .select('name, email, status')
            .eq('id', candidateId)
            .single();

        if (error || !candidate) throw new Error('Candidate not found.');
        if (candidate.status !== 'Recommended') {
            throw new Error(`Cannot send selection email: candidate status is "${candidate.status}", expected "Recommended".`);
        }

        // 1. Update status to 'Selected'
        const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({
                status: 'Selected',
                last_action_by: userName,
                updated_at: new Date().toISOString()
            })
            .eq('id', candidateId);

        if (updateError) throw updateError;

        // 2. Send the final selection email to the candidate
        await sendSelectedEmail(candidate.email, candidate.name);

        // 3. Log the action
        await logAction('CANDIDATE_SELECTED', candidateId, 'candidate', { sent_by: userName });

        // 4. Notify recruitment team
        try {
            const recipients = await getRecipientsByRoles(['recruitment_team']);
            if (recipients.length > 0) {
                await notifyWorkflowStage('DECISION', recipients, {
                    name: candidate.name,
                    status: 'Selected for CGAP',
                    interviewer: userName
                });
            }
        } catch (notifyErr) {
            console.error('Selection team notification failed:', notifyErr);
        }

        revalidatePath('/admin/applications');
        revalidatePath('/admin');
        return { success: true, last_action_by: userName };
    } catch (error: any) {
        console.error('sendCandidateSelectionEmail error:', error);
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

export async function createAssessmentSlotsBulk(
    slots: { start_time: string; end_time: string }[]
) {
    try {
        if (!slots.length) return { error: "No slots provided." };

        const { data, error } = await supabase
            .from("assessment_slots")
            .insert(slots.map(s => ({
                start_time: s.start_time,
                end_time: s.end_time,
                is_locked: false,
            })))
            .select('*');

        if (error) throw error;

        revalidatePath("/admin/slots");
        return { success: true, data };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteAssessmentSlot(slotId: string) {
    try {
        const { data: slot, error: fetchError } = await supabase
            .from("assessment_slots")
            .select("candidate_id")
            .eq("id", slotId)
            .single();

        if (fetchError) throw fetchError;
        if (!slot) throw new Error("Slot not found");

        if (slot.candidate_id) {
            return { error: "Cannot delete a slot that is already booked by a candidate." };
        }

        const { error } = await supabase
            .from("assessment_slots")
            .delete()
            .eq("id", slotId);

        if (error) throw error;

        revalidatePath("/admin/slots");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function bookAssessmentSlot(candidateId: string, slotId: string) {
    try {
        // 0. Verify candidate is allowed to book. 'Assessment Scheduled' is
        //    allowed because that's the swap path — they're picking a new slot
        //    while still holding their existing one. The subsequent unlock+lock
        //    sequence in this same function performs the swap atomically.
        const { data: candidate } = await supabase
            .from("candidates")
            .select("status")
            .eq("id", candidateId)
            .single();

        const ALLOWED_STATUSES = ['Approved', 'Invite Sent', 'Absent', 'Assessment Scheduled'];
        if (!candidate?.status || !ALLOWED_STATUSES.includes(candidate.status)) {
            return { error: `You cannot book a slot from your current status (${candidate?.status}).` };
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

        // 2. Capture the previous slot (if any) BEFORE we unlock it, so the
        //    audit log can record what was swapped out.
        const { data: previousSlots } = await supabaseAdmin
            .from("assessment_slots")
            .select("id, start_time")
            .eq("candidate_id", candidateId);
        const previousSlot = previousSlots?.[0] ?? null;

        // 3. Unlock any previous slots booked by this candidate (CLEANUP BEFORE RESCHEDULING)
        await supabase
            .from("assessment_slots")
            .update({
                candidate_id: null,
                is_locked: false
            })
            .eq("candidate_id", candidateId);

        // 4. Lock the new slot (with concurrency check)
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

        const newSlotStart = updatedData[0]?.start_time;

        // Update candidate status
        const statusResult = await updateCandidateStatus(candidateId, "Assessment Scheduled");
        if (!statusResult.success) {
            throw new Error(statusResult.error || "Failed to update candidate status.");
        }

        // Explicit slot-level audit entry so the full booking transition
        // (who, when, from-which-slot, to-which-slot) is recoverable even
        // months later. Includes a flag for whether this was a reschedule.
        await logAction('SLOT_BOOKED', candidateId, 'candidate', {
            slot_id: slotId,
            new_slot_start: newSlotStart,
            previous_slot_id: previousSlot?.id ?? null,
            previous_slot_start: previousSlot?.start_time ?? null,
            is_reschedule: !!previousSlot,
        });

        // Notify recruitment team & candidate separately
        try {
            const recruitmentEmails = await getRecipientsByRoles(['recruitment_team']);
            const { data: cData } = await supabaseAdmin.from('candidates').select('name, email').eq('id', candidateId).single();
            const { data: sData } = await supabaseAdmin.from('assessment_slots').select('start_time').eq('id', slotId).single();

            const slotTimeFormatted = sData ? new Date(sData.start_time).toLocaleString('en-US', {
                timeZone: 'Asia/Karachi',
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }) : 'N/A';

            // 1. Send detailed briefing to Candidate ONLY
            if (cData?.email) {
                await notifyWorkflowStage('CANDIDATE_ASSESSMENT_CONFIRMED', [cData.email], {
                    name: cData.name,
                    slotTime: slotTimeFormatted
                });
            }

            // 2. Send concise alert to Recruitment Team ONLY
            if (recruitmentEmails.length > 0) {
                await notifyWorkflowStage('SLOT_BOOKED_INTERNAL', recruitmentEmails, {
                    name: cData?.name || 'A candidate',
                    slotTime: slotTimeFormatted
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
        // 1. Verify candidate is currently scheduled — also grab name + email
        //    so we can email them confirming the cancellation.
        const { data: candidate } = await supabaseAdmin
            .from("candidates")
            .select("status, name, email")
            .eq("id", candidateId)
            .single();

        const RESCHEDULABLE_STATUSES = ['Assessment Scheduled', 'Confirmed', 'Rescheduled', 'Invite Sent'];
        if (!candidate?.status || !RESCHEDULABLE_STATUSES.includes(candidate.status)) {
            return { error: `Cannot reschedule from status "${candidate?.status ?? 'unknown'}".` };
        }

        // 2. Capture the prior slot times before nulling them out, so the
        //    cancellation email can reference what we're cancelling.
        const { data: priorSlots } = await supabaseAdmin
            .from("assessment_slots")
            .select("start_time, end_time")
            .eq("candidate_id", candidateId);

        // 3. Free up their current slot
        const { error: slotError } = await supabaseAdmin
            .from("assessment_slots")
            .update({
                candidate_id: null,
                is_locked: false
            })
            .eq("candidate_id", candidateId);

        if (slotError) throw slotError;

        // 4. Reset candidate status back to Invite Sent
        await updateCandidateStatus(candidateId, "Invite Sent");

        // Explicit slot-level cancellation audit so the trail shows what slot
        // was given up, not just that the candidate moved back to Invite Sent.
        if (priorSlots && priorSlots.length > 0) {
            await logAction('SLOT_CANCELLED', candidateId, 'candidate', {
                cancelled_slots: priorSlots.map(s => ({
                    start_time: s.start_time,
                    end_time: s.end_time,
                })),
            });
        }

        // 5. Email the candidate so they have a record that their booking was
        //    cancelled. Without this email, a candidate who self-cancels and
        //    forgets to re-book has no signal that anything changed and may
        //    show up to a slot that no longer exists.
        if (candidate.email) {
            try {
                const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://cbt-recruitment-portal.vercel.app';
                const bookingLink = `${origin}/book-slot/${candidateId}`;
                const priorSlot = priorSlots?.[0];
                const priorSlotTime = priorSlot
                    ? new Date(priorSlot.start_time).toLocaleString('en-US', {
                        timeZone: 'Asia/Karachi',
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    })
                    : null;

                await notifyWorkflowStage('ASSESSMENT_RESCHEDULED', [candidate.email], {
                    name: candidate.name,
                    priorSlotTime,
                    bookingLink,
                });
            } catch (notifyErr) {
                console.error("Reschedule notification failed:", notifyErr);
            }
        }

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
        const now = new Date();
        const actingUser = await getCurrentUser();
        const userName = actingUser?.full_name || 'System User';

        // 1. ATOMIC status guard — flip the candidate from 'Assessment
        //    Scheduled' to 'To Be Interviewed' in a single UPDATE…WHERE.
        //    Only one concurrent caller can match, so a rapid double-click
        //    fires this twice but only the FIRST call actually changes a row.
        //    The second one sees no rows updated and returns idempotently
        //    without creating a duplicate interview entry.
        const { data: flipped, error: flipError } = await supabaseAdmin
            .from('candidates')
            .update({
                status: 'To Be Interviewed',
                last_action_by: userName,
                updated_at: now.toISOString(),
            })
            .eq('id', candidateId)
            .eq('status', 'Assessment Scheduled')
            .select('id, name, status');

        if (flipError) throw new Error(`Failed to update candidate status: ${flipError.message}`);

        if (!flipped || flipped.length === 0) {
            // Either already complete, or candidate is in a non-eligible
            // status. Idempotent success: don't create a duplicate row.
            return { success: true, alreadyCompleted: true };
        }
        const candidate = flipped[0];

        // Audit the status flip (logAction is null-safe for unauthenticated
        // callers, but the slot flow is always invoked by an authenticated HR
        // user, so this records who clicked the button).
        await logAction('STATUS_UPDATE', candidateId, 'candidate', { new_status: 'To Be Interviewed' });

        // 2. Create the interview row. Now that we know we 'won' the status
        //    flip, only this caller will reach here for this candidate.
        const { error: interviewError } = await supabaseAdmin
            .from("interviews")
            .insert({
                candidate_id: candidateId,
                scheduled_at: now.toISOString(),
                decision: null,
            });

        if (interviewError) throw new Error(`Failed to create interview: ${interviewError.message}`);

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

        // Save to dedicated availability table
        const { error: availError } = await supabaseAdmin
            .from('interviewer_availability')
            .insert({
                candidate_id: candidateId,
                interviewer_email: email,
                interviewer_name: interviewerName || email,
                is_available: isAvailable,
                preferred_time: preferredTime
            });

        if (availError) {
            console.error("Failed to save to interviewer_availability:", availError);
            throw availError;
        }

        await logAction('INTERVIEWER_AVAILABILITY', candidateId, 'candidate', {
            interviewer_email: email,
            interviewer_name: interviewerName || email,
            is_available: isAvailable,
            preferred_time: preferredTime
        });

        const recipients = await getRecipientsByRoles(['recruitment_team']);
        if (recipients.length > 0) {
            const formattedTime = preferredTime ? new Date(preferredTime).toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Karachi'
            }) : null;

            await notifyWorkflowStage('AVAILABILITY_RESPONSE', recipients, {
                candidateName: candidate?.name || 'A candidate',
                interviewerEmail: email,
                interviewerName: interviewerName || email,
                isAvailable,
                preferredTime: formattedTime
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error("submitInterviewerAvailability error:", error);
        return { error: error.message };
    }
}

export async function getInterviewerAvailability(candidateId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('interviewer_availability')
            .select('*')
            .eq('candidate_id', candidateId)
            .eq('is_available', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
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

        // 1. Save L1 feedback, mark as needing L2 review, and reset meeting fields
        //    so HR can lock a fresh L2 meeting via the same scheduler used for L1.
        const { error: updateError } = await supabaseAdmin
            .from("interviews")
            .update({
                decision: "L2 Interview Required",
                feedback: `L1: ${l1Feedback}`,
                l1_feedback_json: l1FeedbackJson || null,
                l1_interviewer_name: interviewerName,
                is_locked: false,
                meeting_link: null,
                locked_by: null,
                scheduled_at: new Date().toISOString(),
            } as any)
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

// Re-fires the INTERVIEW_L2 invitation email to all configured L2
// interviewer recipients for a candidate that's already in 'L2 Interview
// Required'. Used when the first invitation didn't land (SMTP glitch, spam,
// or the recipient list was empty at the time of the original request).
// Returns a meaningful error (not silent) if no L2 recipients are configured.
export async function resendL2Invitation(candidateId: string) {
    try {
        const { data: candidate, error: cErr } = await supabaseAdmin
            .from('candidates')
            .select('id, name, status')
            .eq('id', candidateId)
            .single();

        if (cErr || !candidate) throw new Error('Candidate not found.');
        if (candidate.status !== 'L2 Interview Required') {
            return { error: `Candidate is not awaiting L2 (current status: ${candidate.status}).` };
        }

        const recipients = await getRecipientsByRoles(['l2_interviewer']);
        if (recipients.length === 0) {
            return {
                error: 'No L2 interviewer recipients are configured. Add one under Portal Settings → Team Emails → L2 Interviewers, then try again.',
            };
        }

        await notifyWorkflowStage('INTERVIEW_L2', recipients, {
            name: candidate.name || 'A candidate',
            candidateId: candidateId,
        });

        await logAction('L2_INVITATION_RESENT', candidateId, 'candidate', {
            recipient_count: recipients.length,
            recipients,
        });

        return { success: true, recipientCount: recipients.length };
    } catch (error: any) {
        console.error('resendL2Invitation error:', error);
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

/**
 * Locks a Teams meeting link for an interview.
 * Sends confirmation email to Candidate, Interviewer, and the Master Email.
 */
export async function lockInterviewMeeting(interviewId: string, candidateId: string, meetingLink: string, scheduledAt: string) {
    try {
        const user = await getCurrentUser();
        const userName = user?.full_name || 'System User';

        // 1. Update the interview record
        // Note: Using dynamic keys to allow for missing columns if schema hasn't been updated yet
        const { data: interview, error: updateError } = await supabaseAdmin
            .from('interviews')
            .update({
                meeting_link: meetingLink,
                is_locked: true,
                locked_by: userName,
                scheduled_at: scheduledAt
            } as any)
            .eq('id', interviewId)
            .select('*, candidates(name, email)')
            .single();

        if (updateError) throw updateError;

        // 2. Log the action
        await logAction('INTERVIEW_MEETING_LOCKED', candidateId, 'candidate', {
            meeting_link: meetingLink,
            scheduled_at: scheduledAt,
            locked_by: userName
        });

        // 3. Update candidate status to "Interview Scheduled"
        await updateCandidateStatus(candidateId, "Interview Scheduled");

        // 4. Notify everyone
        try {
            // Priority Emails
            const recipients = [
                interview.candidates?.email // Candidate
            ];

            // Determine if it was an L1 or L2 based on current candidate status/flow
            // Fetch roles to notify appropriate interviewers
            const { data: cData } = await supabaseAdmin.from('candidates').select('status').eq('id', candidateId).single();
            const targetRoles = cData?.status === 'L2 Interview Required' ? ['l2_interviewer'] : ['l1_interviewer', 'recruitment_team'];

            const interviewerEmails = await getRecipientsByRoles(targetRoles);
            const allEmails = Array.from(new Set([...recipients, ...interviewerEmails])).filter(Boolean) as string[];

            if (allEmails.length > 0) {
                await notifyWorkflowStage('INTERVIEW_CONFIRMED', allEmails, {
                    candidateName: interview.candidates?.name,
                    scheduledAt: new Date(scheduledAt).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    meetingLink: meetingLink
                });
            }
        } catch (notifyErr) {
            console.error("Interview confirmation email failed:", notifyErr);
        }

        revalidatePath('/admin/interviews');
        revalidatePath('/admin/applications');
        revalidatePath('/admin');

        return { success: true };
    } catch (error: any) {
        console.error("lockInterviewMeeting error:", error);
        return { error: error.message };
    }
}

/**
 * Automatically generates a Teams meeting link and locks the interview.
 * Uses the interviewer's responded availability.
 */
export async function generateAndLockInterview(interviewId: string, candidateId: string, availabilityId: string) {
    try {
        const user = await getCurrentUser();
        const userName = user?.full_name || 'System User';

        // 1. Get the availability details
        const { data: avail, error: availError } = await supabaseAdmin
            .from('interviewer_availability')
            .select('*')
            .eq('id', availabilityId)
            .single();

        if (availError || !avail) throw new Error("Selected availability record not found.");

        // Detect round before we overwrite the interview row — if its current
        // decision is 'L2 Interview Required', HR is locking the L2 meeting.
        const { data: priorInterview } = await supabaseAdmin
            .from('interviews')
            .select('decision')
            .eq('id', interviewId)
            .single();
        const round: 'L1' | 'L2' = priorInterview?.decision === 'L2 Interview Required' ? 'L2' : 'L1';

        const startTime = avail.preferred_time;
        // Default duration 1 hour
        const endTime = new Date(new Date(startTime).getTime() + (60 * 60 * 1000)).toISOString();

        // 2. Create the Teams meeting
        const meetingResult = await createTeamsMeeting(
            `CBT Interview: ${avail.interviewer_name} vs Candidate`,
            startTime,
            endTime
        );

        if (meetingResult.error) throw new Error(meetingResult.error);
        const meetingLink = meetingResult.joinUrl!;

        // 3. Update the interview record
        const { data: interview, error: updateError } = await supabaseAdmin
            .from('interviews')
            .update({
                meeting_link: meetingLink,
                is_locked: true,
                locked_by: userName,
                scheduled_at: startTime
            } as any)
            .eq('id', interviewId)
            .select('*, candidates(name, email)')
            .single();

        if (updateError) throw updateError;

        // 4. Log the action
        await logAction('INTERVIEW_MEETING_LOCKED_AUTO', candidateId, 'candidate', {
            meeting_link: meetingLink,
            scheduled_at: startTime,
            locked_by: userName,
            interviewer: avail.interviewer_name
        });

        // 5. Update candidate status
        await updateCandidateStatus(candidateId, "Interview Scheduled");

        // 6. Notify everyone
        try {
            // Explicitly handle candidate data (Supabase join can returned as object or array)
            const candidateData = Array.isArray(interview.candidates)
                ? interview.candidates[0]
                : interview.candidates;

            const scheduledAtFormatted = new Date(startTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Karachi'
            });

            const sharedPayload = {
                candidateName: candidateData?.name || 'Candidate',
                interviewerName: avail.interviewer_name,
                scheduledAt: scheduledAtFormatted,
                meetingLink: meetingLink,
                startTime: startTime,
                round: round,
            };

            // Candidate gets the celebratory, candidate-facing copy.
            if (candidateData?.email) {
                await notifyWorkflowStage('INTERVIEW_CONFIRMED', [candidateData.email], {
                    ...sharedPayload,
                    audience: 'candidate',
                });
            }

            // Interviewer gets a separate, interviewer-facing briefing — never
            // the candidate's "Congratulations" email.
            if (avail.interviewer_email && avail.interviewer_email !== candidateData?.email) {
                await notifyWorkflowStage('INTERVIEW_CONFIRMED', [avail.interviewer_email], {
                    ...sharedPayload,
                    audience: 'interviewer',
                });
            }
        } catch (notifyErr) {
            console.error("Failed to send scheduled interview notification:", notifyErr);
        }

        revalidatePath('/admin/interviews');
        revalidatePath('/admin/applications');
        revalidatePath('/admin');

        return { success: true, meetingLink };
    } catch (error: any) {
        console.error("generateAndLockInterview error:", error);
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

export async function getMasterMeetingLink() {
    try {
        const { data, error } = await supabaseAdmin
            .from('portal_settings')
            .select('value')
            .eq('key', 'master_meeting_link')
            .single();

        if (error) return { success: false, value: "" };
        return { success: true, value: data?.value || "" };
    } catch (err) {
        return { success: false, value: "" };
    }
}

export async function updateMasterMeetingLink(link: string) {
    try {
        const { error } = await supabaseAdmin
            .from('portal_settings')
            .upsert({ key: 'master_meeting_link', value: link }, { onConflict: 'key' });

        if (error) throw error;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendTestInvite() {
    try {
        const user = await getCurrentUser();
        const email = user?.email || process.env.EMAIL_USER;
        if (!email) throw new Error("No user email found to send test to.");

        const { notifyWorkflowStage } = await import("@/lib/email");

        await notifyWorkflowStage('INTERVIEW_CONFIRMED', [email], {
            candidateName: "Test Candidate",
            scheduledAt: new Date().toLocaleString(),
            meetingLink: "https://teams.microsoft.com/test-link",
            startTime: new Date().toISOString()
        });

        return { success: true };
    } catch (error: any) {
        console.error("Test invite failed:", error);
        return { success: false, error: error.message };
    }
}

export async function getCurrentBatchNumber() {
    try {
        const { data, error } = await supabaseAdmin
            .from('portal_settings')
            .select('value')
            .eq('key', 'current_batch_number')
            .single();

        if (error) return { success: false, value: "31" };
        return { success: true, value: data?.value || "31" };
    } catch (err) {
        return { success: false, value: "31" };
    }
}

export async function updateCurrentBatchNumber(batch: string) {
    try {
        const { error } = await supabaseAdmin
            .from('portal_settings')
            .upsert({ key: 'current_batch_number', value: batch }, { onConflict: 'key' });

        if (error) throw error;
        revalidatePath('/admin/settings');
        revalidatePath('/admin/applications');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updatePassword(newPassword: string) {
    try {
        const supabaseServer = await createClient();
        const { error } = await supabaseServer.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendDailySummaryNotifications() {
    try {
        console.log("[Daily Summary] Running daily digest generation...");

        // 1. Fetch all queued notifications
        const { data: queuedItems, error: fetchError } = await supabaseAdmin
            .from('notification_queue')
            .select('*')
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        if (!queuedItems || queuedItems.length === 0) {
            console.log("[Daily Summary] No pending notifications in queue. Skipping summary dispatch.");
            return { success: true, message: "No items queued" };
        }

        // 2. Separate candidate decision emails from team daily digest notifications
        const candidateItems = queuedItems.filter(item => item.category === 'candidate_decision');
        const teamItems = queuedItems.filter(item => item.category !== 'candidate_decision');

        // --- Process Candidate Decision Emails ---
        console.log(`[Daily Summary] Processing ${candidateItems.length} candidate decision emails...`);
        for (const item of candidateItems) {
            const { email, name } = item.details || {};
            if (!email || !name) {
                console.warn("[Daily Summary] Queued candidate email item had missing details:", item);
                continue;
            }
            try {
                if (item.event_type === 'CANDIDATE_RECOMMENDED') {
                    await sendRecommendedEmail(email, name);
                    console.log(`[Daily Summary] Sent Recommended email to candidate: ${name} (${email})`);
                } else if (item.event_type === 'CANDIDATE_REJECTED') {
                    await sendNotRecommendedEmail(email, name);
                    console.log(`[Daily Summary] Sent Rejected email to candidate: ${name} (${email})`);
                }
            } catch (err: any) {
                console.error(`[Daily Summary] Failed to send decision email to ${email}:`, err.message);
            }
        }

        // --- Process Team Daily Digest Notifications ---
        if (teamItems.length > 0) {
            // Group items by category (role)
            const itemsByCategory: Record<string, typeof teamItems> = {};
            for (const item of teamItems) {
                if (!itemsByCategory[item.category]) {
                    itemsByCategory[item.category] = [];
                }
                itemsByCategory[item.category].push(item);
            }

            const categories = Object.keys(itemsByCategory);
            console.log(`[Daily Summary] Dispatching summaries for roles: ${categories.join(', ')}`);

            // For each category, get recipients and send a consolidated email
            for (const category of categories) {
                const items = itemsByCategory[category];
                const recipients = await getRecipientsByRoles([category]);
                if (recipients.length === 0) {
                    console.warn(`[Daily Summary] No email recipients configured for role category: ${category}. Skipping.`);
                    continue;
                }

                // Group by event type
                const eventsByStyle: Record<string, any[]> = {};
                for (const item of items) {
                    if (!eventsByStyle[item.event_type]) {
                        eventsByStyle[item.event_type] = [];
                    }
                    eventsByStyle[item.event_type].push(item.details);
                }

                // De-duplicate events to ensure the digest looks clean and professional
                if (eventsByStyle['NEW_APPLICATION']?.length > 0) {
                    const uniqueNewApps = [];
                    const seenEmails = new Set();
                    for (const app of eventsByStyle['NEW_APPLICATION']) {
                        if (app?.email && !seenEmails.has(app.email)) {
                            seenEmails.add(app.email);
                            uniqueNewApps.push(app);
                        }
                    }
                    eventsByStyle['NEW_APPLICATION'] = uniqueNewApps;
                }

                // Queue items are ordered ASC (oldest first). Dedup must keep
                // the LATEST entry per candidate so reschedules / re-invites
                // overwrite stale earlier entries. Otherwise the digest can
                // show a slotTime the candidate has since changed (e.g. they
                // booked Thursday, then moved to Wednesday — old code kept the
                // Thursday entry and dropped Wednesday).
                const keepLatestByName = <T extends { name?: string }>(items: T[]): T[] => {
                    const seen = new Set<string>();
                    const out: T[] = [];
                    for (let i = items.length - 1; i >= 0; i--) {
                        const x = items[i];
                        if (x?.name && !seen.has(x.name)) {
                            seen.add(x.name);
                            out.unshift(x);
                        }
                    }
                    return out;
                };

                if (eventsByStyle['SLOT_BOOKED_INTERNAL']?.length > 0) {
                    eventsByStyle['SLOT_BOOKED_INTERNAL'] = keepLatestByName(eventsByStyle['SLOT_BOOKED_INTERNAL']);
                }

                if (eventsByStyle['APPROVED_PENDING_SLOTS']?.length > 0) {
                    eventsByStyle['APPROVED_PENDING_SLOTS'] = keepLatestByName(eventsByStyle['APPROVED_PENDING_SLOTS']);
                }

                if (eventsByStyle['INVITE_SENT']?.length > 0) {
                    eventsByStyle['INVITE_SENT'] = keepLatestByName(eventsByStyle['INVITE_SENT']);
                }

                if (eventsByStyle['DECISION']?.length > 0) {
                    const decisionsMap = new Map();
                    for (const dec of eventsByStyle['DECISION']) {
                        if (dec?.name) {
                            decisionsMap.set(dec.name, dec);
                        }
                    }
                    eventsByStyle['DECISION'] = Array.from(decisionsMap.values());
                }

                if (eventsByStyle['AVAILABILITY_RESPONSE']?.length > 0) {
                    // Keep the latest availability submission per (candidate, interviewer)
                    // pair. If an interviewer re-submitted (e.g. changed their
                    // preferred time), the latest one should reach the digest.
                    const latestByPair = new Map<string, any>();
                    for (const av of eventsByStyle['AVAILABILITY_RESPONSE']) {
                        const key = `${av?.candidateName || av?.candidateId}-${av?.interviewerEmail || av?.interviewerName}`;
                        latestByPair.set(key, av);
                    }
                    eventsByStyle['AVAILABILITY_RESPONSE'] = Array.from(latestByPair.values());
                }

                // Build HTML Body sections
                let sectionsHtml = '';

                // A. New Applications
                if (eventsByStyle['NEW_APPLICATION']?.length > 0) {
                    sectionsHtml += `
                        <div style="margin-bottom: 25px; border-left: 4px solid #009245; padding-left: 15px;">
                            <h3 style="color: #009245; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Intake: New Applications</h3>
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid #eee; color: #666;">
                                        <th style="padding: 6px 0;">Candidate</th>
                                        <th style="padding: 6px 0;">Position</th>
                                        <th style="padding: 6px 0;">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${eventsByStyle['NEW_APPLICATION'].map(d => `
                                        <tr style="border-bottom: 1px dashed #f0f0f0;">
                                            <td style="padding: 8px 0; font-weight: bold; color: #111;">${d.name}</td>
                                            <td style="padding: 8px 0; color: #555;">${d.position}</td>
                                            <td style="padding: 8px 0; color: #888;">${d.email}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                // B. Slot Bookings
                if (eventsByStyle['SLOT_BOOKED_INTERNAL']?.length > 0) {
                    sectionsHtml += `
                        <div style="margin-bottom: 25px; border-left: 4px solid #1e293b; padding-left: 15px;">
                            <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Technical Assessments Scheduled</h3>
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid #eee; color: #666;">
                                        <th style="padding: 6px 0;">Candidate</th>
                                        <th style="padding: 6px 0;">Scheduled Date / Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${eventsByStyle['SLOT_BOOKED_INTERNAL'].map(d => `
                                        <tr style="border-bottom: 1px dashed #f0f0f0;">
                                            <td style="padding: 8px 0; font-weight: bold; color: #111;">${d.name}</td>
                                            <td style="padding: 8px 0; color: #009245; font-weight: bold;">${d.slotTime}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                // C. Approved, Pending Slots
                if (eventsByStyle['APPROVED_PENDING_SLOTS']?.length > 0) {
                    sectionsHtml += `
                        <div style="margin-bottom: 25px; border-left: 4px solid #b45309; padding-left: 15px;">
                            <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Approved (Awaiting Slots)</h3>
                            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #333; line-height: 1.6;">
                                ${eventsByStyle['APPROVED_PENDING_SLOTS'].map(d => `
                                    <li style="margin-bottom: 4px;"><strong>${d.name}</strong> has been approved. HR needs to create slot resources.</li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }

                // D. Invites Sent
                if (eventsByStyle['INVITE_SENT']?.length > 0) {
                    sectionsHtml += `
                        <div style="margin-bottom: 25px; border-left: 4px solid #2563eb; padding-left: 15px;">
                            <h3 style="color: #2563eb; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Assessment Invites Dispatched</h3>
                            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #333; line-height: 1.6;">
                                ${eventsByStyle['INVITE_SENT'].map(d => `
                                    <li style="margin-bottom: 4px;"><strong>${d.name}</strong> was sent a slot booking invitation link by <em>${d.sentBy}</em>.</li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }

                // E. Decisions Logged
                if (eventsByStyle['DECISION']?.length > 0) {
                    sectionsHtml += `
                        <div style="margin-bottom: 25px; border-left: 4px solid #0d9488; padding-left: 15px;">
                            <h3 style="color: #0d9488; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Decisions & Feedback Logs</h3>
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                                <thead>
                                    <tr style="border-bottom: 1px solid #eee; color: #666;">
                                        <th style="padding: 6px 0;">Candidate</th>
                                        <th style="padding: 6px 0;">Status Outcome</th>
                                        <th style="padding: 6px 0;">Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${eventsByStyle['DECISION'].map(d => `
                                        <tr style="border-bottom: 1px dashed #f0f0f0;">
                                            <td style="padding: 8px 0; font-weight: bold; color: #111;">${d.name}</td>
                                            <td style="padding: 8px 0; font-weight: bold; color: ${d.status === 'Recommended' || d.status === 'Selected' ? '#009245' : '#dc2626'}">${d.status}</td>
                                            <td style="padding: 8px 0; color: #666; font-style: italic;">${d.interviewer}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                // F. Availability Responses
                if (eventsByStyle['AVAILABILITY_RESPONSE']?.length > 0) {
                    sectionsHtml += `
                        <div style="margin-bottom: 25px; border-left: 4px solid #4f46e5; padding-left: 15px;">
                            <h3 style="color: #4f46e5; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Interviewer Availability Updates</h3>
                            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #333; line-height: 1.6;">
                                ${eventsByStyle['AVAILABILITY_RESPONSE'].map(d => `
                                    <li style="margin-bottom: 6px;">
                                        <strong>${d.interviewerName || d.interviewerEmail}</strong> responded for <strong>${d.candidateName}</strong>: 
                                        <span style="font-weight: bold; color: ${d.isAvailable ? '#009245' : '#dc2626'};">${d.isAvailable ? 'Available' : 'Unavailable'}</span>
                                        ${d.isAvailable && d.preferredTime ? ` (Preferred time: <em>${d.preferredTime}</em>)` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }

                // Format Role Name for Header Title
                const roleDisplayName = category === 'recruitment_team' ? 'Recruitment & HR Team' : 'Approver Panel';

                // Send the unified digest
                const subject = `[Daily Summary] CBT Recruitment Updates — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                const fullHtml = `
                    <div style="margin-bottom: 25px;">
                        <h2 style="color: #009245; margin: 0 0 5px 0; font-size: 20px; font-weight: bold;">Daily Recruitment Summary</h2>
                        <p style="font-size: 12px; color: #666; margin: 0;">Compiled for <strong>${roleDisplayName}</strong> | Local Time: ${new Date().toLocaleString()}</p>
                    </div>
                    ${sectionsHtml}
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cbt-recruitment-portal.vercel.app'}/admin" style="background-color: #009245; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 13px; display: inline-block;">Access Admin Dashboard</a>
                    </div>
                `;

                await sendTeamNotification(recipients, subject, fullHtml);
                console.log(`[Daily Summary] Dispatch complete for: ${category} to ${recipients.length} users.`);
            }
        }

        // 4. Delete successfully processed items from the queue
        const itemIds = queuedItems.map(item => item.id);
        const { error: deleteError } = await supabaseAdmin
            .from('notification_queue')
            .delete()
            .in('id', itemIds);

        if (deleteError) {
            console.error("[Daily Summary] Failed to delete processed items from queue:", deleteError);
            return { success: false, error: `Failed to clear queue: ${deleteError.message}` };
        } else {
            console.log(`[Daily Summary] Flushed ${itemIds.length} processed items from notification queue.`);
        }

        return { success: true, count: queuedItems.length };
    } catch (error: any) {
        console.error("[Daily Summary] Error running daily summary dispatch:", error);
        return { success: false, error: error.message };
    }
}

export async function getQueuedNotifications() {
    try {
        const { data, error } = await supabaseAdmin
            .from('notification_queue')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearQueuedNotifications() {
    try {
        const { error } = await supabaseAdmin
            .from('notification_queue')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Remove a single entry from the daily-summary queue. Used by the per-row
// X button on the Portal Settings queue panel so the recruitment team can
// drop a specific stale/test event without nuking everything else.
export async function removeQueuedNotification(itemId: string) {
    try {
        if (!itemId) return { success: false, error: 'Missing notification id.' };
        const { error } = await supabaseAdmin
            .from('notification_queue')
            .delete()
            .eq('id', itemId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// =============================================================================
// Custom broadcast — recruitment team writes a one-off email to a list of
// candidates picked from the database (announcements, postponements, etc.)
// =============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendCustomBroadcastToCandidates(params: {
    candidateIds?: string[];
    directEmails?: string[]; // Raw emails (internal team members) without candidate IDs.
    subject: string;
    bodyPlain: string;
    cc?: string[];
    personalize?: boolean;
}) {
    try {
        const actingUser = await getCurrentUser();
        if (!actingUser) return { error: 'You must be signed in.' };
        const roles = actingUser.roles ?? [];
        if (!roles.includes('Master') && !roles.includes('HR')) {
            return { error: 'Only HR or Master can send custom emails.' };
        }

        const subject = (params.subject ?? '').trim();
        const bodyPlain = (params.bodyPlain ?? '').trim();
        const candidateIds = Array.from(new Set(params.candidateIds ?? []));
        const directEmails = Array.from(new Set(
            (params.directEmails ?? []).map(e => (e ?? '').trim().toLowerCase()).filter(Boolean)
        ));
        const personalize = params.personalize !== false; // default true

        if (candidateIds.length === 0 && directEmails.length === 0) {
            return { error: 'Pick at least one recipient.' };
        }
        const totalRecipientCount = candidateIds.length + directEmails.length;
        if (totalRecipientCount > 500) return { error: 'Maximum 500 recipients per send.' };
        if (!subject) return { error: 'Subject is required.' };
        if (!bodyPlain) return { error: 'Body is required.' };

        const invalidDirect = directEmails.filter(e => !EMAIL_REGEX.test(e));
        if (invalidDirect.length) {
            return { error: `Invalid direct address(es): ${invalidDirect.join(', ')}` };
        }

        const ccList = (params.cc ?? [])
            .map(e => (e ?? '').trim())
            .filter(Boolean);
        const invalidCc = ccList.filter(e => !EMAIL_REGEX.test(e));
        if (invalidCc.length) {
            return { error: `Invalid CC address(es): ${invalidCc.join(', ')}` };
        }
        if (ccList.length > 10) {
            return { error: 'Maximum 10 CC addresses.' };
        }

        // Resolve candidate recipients (have a name we can personalize with).
        let candidateRecipients: { id?: string; name: string; email: string }[] = [];
        if (candidateIds.length > 0) {
            const { data: rows, error: fetchErr } = await supabaseAdmin
                .from('candidates')
                .select('id, name, email')
                .in('id', candidateIds);
            if (fetchErr) throw fetchErr;
            candidateRecipients = (rows ?? [])
                .filter(c => c.email && EMAIL_REGEX.test(c.email))
                .map(c => ({ id: c.id, name: c.name, email: c.email }));
        }

        // Direct (internal team) recipients — try to recover a proper name
        // from public.users first, then derive it from the email local-part
        // (firstName.lastName@…) so personalize tokens read 'Dear Ghasif,'
        // instead of the previous 'Dear Team,' fallback. Names land back in
        // the same {name, email} shape candidate recipients use.
        let directRecipients: { name: string; email: string }[] = [];
        if (directEmails.length > 0) {
            const { data: userRows } = await supabaseAdmin
                .from('users')
                .select('email, full_name')
                .in('email', directEmails);
            const nameByEmail = new Map<string, string>();
            for (const u of userRows ?? []) {
                if (u.email && u.full_name) nameByEmail.set(u.email.toLowerCase(), u.full_name);
            }
            directRecipients = directEmails.map(email => ({
                email,
                name: nameByEmail.get(email.toLowerCase()) || deriveNameFromEmail(email),
            }));
        }

        const allRecipients = [...candidateRecipients, ...directRecipients];
        if (allRecipients.length === 0) {
            return { error: 'No valid recipient emails found.' };
        }

        // Audit the broadcast intent BEFORE the emails fire so even if a
        // background send dies we have a record of who initiated what.
        await logAction('CUSTOM_BROADCAST', 'batch', 'email', {
            recipient_count: allRecipients.length,
            subject,
            cc: ccList,
            personalized: personalize,
            sent_by: actingUser.full_name,
            candidate_ids: candidateRecipients.map(r => r.id).filter(Boolean),
            direct_emails: directEmails,
        });

        // Fire the actual SMTP loop in the background so the click returns
        // immediately. Office 365 SMTP pool will queue them; the existing
        // transporter is configured with maxConnections: 3 so we don't trip
        // the throttle.
        after(async () => {
            let success = 0;
            let failed = 0;
            for (const recipient of allRecipients) {
                try {
                    const firstName = (recipient.name ?? '').trim().split(/\s+/)[0] || recipient.name || 'Team';
                    const personalizedBody = personalize
                        ? bodyPlain
                            .replace(/\{\{\s*name\s*\}\}/gi, recipient.name ?? 'Team')
                            .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
                        : bodyPlain;
                    await sendCustomCandidateEmail({
                        to: recipient.email,
                        cc: ccList,
                        subject,
                        bodyPlain: personalizedBody,
                        senderName: actingUser.full_name,
                    });
                    success++;
                } catch (err: any) {
                    failed++;
                    console.error(`[CustomBroadcast] Failed for ${recipient.email}:`, err?.message ?? err);
                }
            }
            console.log(`[CustomBroadcast] Done. success=${success} failed=${failed} subject="${subject}"`);
        });

        return {
            success: true,
            queued: allRecipients.length,
            skipped: totalRecipientCount - allRecipients.length,
        };
    } catch (error: any) {
        console.error('sendCustomBroadcastToCandidates error:', error);
        return { error: error.message ?? 'Failed to queue broadcast.' };
    }
}

// Fetches a thin slice of candidate rows for the composer's recipient picker.
// Same data the Candidate Pipeline page already exposes, but trimmed to what
// the picker actually needs (id, name, email, status, batch, position) and
// only candidates that have a deliverable email.
export async function getCandidatesForBroadcast() {
    try {
        const user = await getCurrentUser();
        if (!user) return { error: 'Not signed in.' };
        const roles = user.roles ?? [];
        if (!roles.includes('Master') && !roles.includes('HR')) {
            return { error: 'Not authorized.' };
        }
        const { data, error } = await supabaseAdmin
            .from('candidates')
            .select('id, name, email, status, batch_number, position')
            .not('email', 'is', null)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data: data ?? [] };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Best-effort name derivation from an email address. Used when we can't
// find the team member in public.users (they may not have logged in yet).
// Pattern is firstName.lastName.middleName@... so we split the local part
// on .  _ -, title-case the tokens, and rejoin.
function deriveNameFromEmail(email: string): string {
    const local = (email.split('@')[0] || '').trim();
    if (!local) return 'Team';
    const tokens = local.split(/[._-]+/).filter(Boolean);
    if (tokens.length === 0) return 'Team';
    return tokens
        .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
        .join(' ');
}

// Fetches the internal team members from the team_notifications table so the
// composer can target the recruitment team / approvers / interviewers as
// recipients (useful for announcements and for testing the composer itself).
// De-duplicates by email — the same person can be registered under multiple
// categories (e.g. recruitment_team + l1_interviewer), but the picker should
// show them once, with all their categories. Joins to public.users for the
// real display name; falls back to deriving from the email local-part.
export async function getInternalTeamMembersForBroadcast() {
    try {
        const user = await getCurrentUser();
        if (!user) return { error: 'Not signed in.' };
        const roles = user.roles ?? [];
        if (!roles.includes('Master') && !roles.includes('HR')) {
            return { error: 'Not authorized.' };
        }

        const { data: notifs, error } = await supabaseAdmin
            .from('team_notifications')
            .select('email, category')
            .order('email', { ascending: true });
        if (error) throw error;

        const emails = Array.from(new Set((notifs ?? []).map(n => (n.email ?? '').toLowerCase()).filter(Boolean)));
        if (emails.length === 0) return { success: true, data: [] };

        // Pull display names from public.users for anyone who has logged in.
        const { data: userRows } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .in('email', emails);
        const nameByEmail = new Map<string, string>();
        for (const u of userRows ?? []) {
            if (u.email && u.full_name) nameByEmail.set(u.email.toLowerCase(), u.full_name);
        }

        // Group categories per email + assemble the display name.
        const byEmail = new Map<string, { email: string; name: string; categories: string[] }>();
        for (const n of notifs ?? []) {
            const email = (n.email ?? '').toLowerCase();
            if (!email) continue;
            let row = byEmail.get(email);
            if (!row) {
                row = {
                    email,
                    name: nameByEmail.get(email) || deriveNameFromEmail(email),
                    categories: [],
                };
                byEmail.set(email, row);
            }
            if (n.category && !row.categories.includes(n.category)) {
                row.categories.push(n.category);
            }
        }

        return { success: true, data: Array.from(byEmail.values()) };
    } catch (error: any) {
        return { error: error.message };
    }
}

// =============================================================================
// Candidate-facing AI support chatbot (used by the floating widget on /)
// =============================================================================

// Chatbot prompt default + DB sentinel name live in src/lib/chatbot-prompt.ts
// (a non-"use server" module). server-action files can only export async
// functions, so the const + sentinel have to live outside this file.

// =============================================================================
// Applications open / closed master switch — controls whether the public
// landing page accepts new applications.
// =============================================================================

const APPLICATIONS_OPEN_KEY = 'applications_open';

// Returns the current intake state. Defaults to "open" if the setting has
// never been written — so existing deploys keep working without any DB
// migration step.
export async function getApplicationsOpenSetting(): Promise<{ open: boolean }> {
    try {
        const { data } = await supabaseAdmin
            .from('portal_settings')
            .select('value')
            .eq('key', APPLICATIONS_OPEN_KEY)
            .single();
        // Anything other than the literal string "false" is treated as open,
        // including a missing row.
        return { open: data?.value !== 'false' };
    } catch {
        return { open: true };
    }
}

export async function setApplicationsOpenSetting(open: boolean) {
    try {
        const user = await getCurrentUser();
        if (!user) return { error: 'You must be signed in.' };
        if (!user.roles?.includes('Master')) {
            return { error: 'Only Master users can change the applications intake setting.' };
        }
        const { error } = await supabaseAdmin
            .from('portal_settings')
            .upsert(
                { key: APPLICATIONS_OPEN_KEY, value: open ? 'true' : 'false' },
                { onConflict: 'key' }
            );
        if (error) return { error: error.message };

        await logAction('APPLICATIONS_INTAKE_TOGGLED', APPLICATIONS_OPEN_KEY, 'config', {
            new_state: open ? 'open' : 'closed',
            changed_by: user.full_name,
        });

        revalidatePath('/');
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { error: error.message ?? 'Failed to update setting.' };
    }
}

// Returns the current system prompt for the candidate support chatbot —
// either the one Master has saved in the DB, or the hardcoded default if no
// override exists. Anyone authenticated can read it (the bot itself calls
// this on every message), but only Master can change it via updateChatbotPrompt.
export async function getChatbotPrompt(): Promise<{ prompt: string; isDefault: boolean }> {
    try {
        const { data } = await supabaseAdmin
            .from('roles')
            .select('description')
            .eq('name', CHATBOT_PROMPT_KEY)
            .single();
        const stored = data?.description?.trim();
        if (stored) return { prompt: stored, isDefault: false };
    } catch {
        // Row doesn't exist yet — fine, fall through to the default.
    }
    return { prompt: CGAP_SUPPORT_SYSTEM_PROMPT_DEFAULT, isDefault: true };
}

export async function updateChatbotPrompt(newPrompt: string) {
    try {
        const user = await getCurrentUser();
        if (!user) return { error: 'You must be signed in.' };
        if (!user.roles?.includes('Master')) {
            return { error: 'Only Master users can change the chatbot system prompt.' };
        }
        const trimmed = (newPrompt ?? '').trim();
        if (!trimmed) return { error: 'Prompt cannot be empty.' };
        if (trimmed.length > 20000) {
            return { error: 'Prompt is too long (max 20,000 characters).' };
        }

        const { error } = await supabaseAdmin
            .from('roles')
            .upsert(
                { name: CHATBOT_PROMPT_KEY, description: trimmed },
                { onConflict: 'name' }
            );
        if (error) return { error: error.message };

        await logAction('CHATBOT_PROMPT_UPDATED', CHATBOT_PROMPT_KEY, 'config', {
            length: trimmed.length,
            updated_by: user.full_name,
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { error: error.message ?? 'Failed to update chatbot prompt.' };
    }
}

export async function restoreChatbotPromptToDefault() {
    try {
        const user = await getCurrentUser();
        if (!user) return { error: 'You must be signed in.' };
        if (!user.roles?.includes('Master')) {
            return { error: 'Only Master users can change the chatbot system prompt.' };
        }
        // Delete the override row so getChatbotPrompt falls back to the hardcoded default.
        await supabaseAdmin
            .from('roles')
            .delete()
            .eq('name', CHATBOT_PROMPT_KEY);

        await logAction('CHATBOT_PROMPT_RESTORED', CHATBOT_PROMPT_KEY, 'config', {
            restored_by: user.full_name,
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { error: error.message ?? 'Failed to restore default prompt.' };
    }
}

interface CandidateChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function askCandidateSupport(messages: CandidateChatMessage[]) {
    try {
        if (!Array.isArray(messages) || messages.length === 0) {
            return { error: 'No message provided.' };
        }

        // Trim to the last 12 messages to keep the prompt small + protect
        // against a client sending an enormous history.
        const trimmed = messages.slice(-12).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content ?? '').slice(0, 2000),
        }));

        // Last message must be from the user; if not, drop trailing assistant
        // messages so the API call shape is valid.
        while (trimmed.length > 0 && trimmed[trimmed.length - 1].role !== 'user') {
            trimmed.pop();
        }
        if (trimmed.length === 0) {
            return { error: 'No user message in history.' };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { error: 'AI assistant is not configured. Please contact us via email or phone instead.' };
        }

        // Build the Gemini REST payload. Mirror the same v1beta REST pattern
        // the AI screener uses (the SDK's getGenerativeModel can fail to find
        // newer models depending on what apiVersion it defaults to — going
        // straight to v1beta avoids that). System prompt rides on the
        // top-level systemInstruction field; the chat history fills `contents`.
        const contents = trimmed.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        // Pull the live system prompt — Master can override it via Portal Settings.
        const { prompt: livePrompt } = await getChatbotPrompt();
        // Append the current intake state so the bot's tone matches reality
        // without Master having to remember to rewrite the prompt every time
        // the toggle flips.
        const intakeState = await getApplicationsOpenSetting();
        // Runtime state note only — no behavioural rules here. The Master-
        // edited prompt above (Portal Settings) is the source of truth for
        // tone, reopening dates, and what to tell candidates. This addendum
        // just tells the model whether the form on the landing page is
        // currently accepting submissions so it doesn't send someone to a
        // disabled button.
        const intakeAddendum = intakeState.open
            ? "\n\n[INTAKE STATUS — LIVE] Applications are currently OPEN. The application form on the landing page is active. If a qualified candidate asks how to apply, tell them the form is right there on the landing page."
            : "\n\n[INTAKE STATUS — LIVE] Applications are currently CLOSED. The application form on the landing page is disabled — do not tell candidates to submit an application right now. If the instructions above mention a reopening date or waitlist process, use that; otherwise honestly acknowledge the closure without inventing details.";
        const finalSystemPrompt = livePrompt + intakeAddendum;

        const payload = {
            systemInstruction: { parts: [{ text: finalSystemPrompt }] },
            contents,
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1400,
            },
        };

        const modelsToTry = [
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-2.0-flash-001',
            'gemini-2.5-flash',
        ];

        let lastError: string | null = null;
        for (const modelName of modelsToTry) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errText = await response.text();
                    lastError = `${modelName} returned ${response.status}: ${errText.slice(0, 200)}`;
                    console.warn('[askCandidateSupport]', lastError);
                    continue;
                }

                const data = await response.json();
                const rawReply = data?.candidates?.[0]?.content?.parts
                    ?.map((p: any) => p?.text ?? '')
                    .join('')
                    .trim();

                if (!rawReply) {
                    lastError = `${modelName} returned empty content`;
                    console.warn('[askCandidateSupport]', lastError, JSON.stringify(data).slice(0, 300));
                    continue;
                }

                // Belt-and-suspenders: even though the system prompt forbids
                // markdown, strip residual **bold** / *italic* / ` ` / leading
                // # headings so the user never sees raw asterisks in the chat
                // bubble (the panel renders text literally, not as markdown).
                const reply = rawReply
                    .replace(/\*\*(.*?)\*\*/g, '$1')        // **bold**
                    .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1') // *italic*
                    .replace(/`([^`]+)`/g, '$1')            // `code`
                    .replace(/^#{1,6}\s+/gm, '')            // # heading prefixes
                    .replace(/\n{3,}/g, '\n\n')             // collapse triple newlines
                    .trim();

                return { success: true, reply };
            } catch (err: any) {
                lastError = `${modelName} threw: ${err?.message ?? err}`;
                console.warn('[askCandidateSupport]', lastError);
            }
        }

        console.error('[askCandidateSupport] all models failed:', lastError);
        return {
            error: 'I had trouble answering that. Please try again, or email us at careers@convergentbt.com if the problem continues.',
        };
    } catch (error: any) {
        console.error('askCandidateSupport error:', error);
        return {
            error: 'I had trouble answering that. Please try again, or email us at careers@convergentbt.com if the problem continues.',
        };
    }
}

