"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import {
    sendAssessmentEmail,
    sendRecommendedEmail,
    sendNotRecommendedEmail
} from "@/lib/email";

export async function submitApplication(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const position = formData.get("position") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const resumeFile = formData.get("resume") as File;

    if (!resumeFile) {
        return { error: "Resume is required" };
    }

    try {
        // 1. Upload Resume to Storage
        const fileName = `${Date.now()}_${resumeFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from("resumes")
            .getPublicUrl(fileName);

        // 3. Insert into Database
        const { data: candidate, error: insertError } = await supabase
            .from("candidates")
            .insert({
                name,
                email,
                phone,
                position,
                cover_letter: coverLetter,
                resume_url: publicUrl,
                status: "Applied",
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 4. Create internal notification
        await supabase
            .from('notifications')
            .insert({
                title: 'New Application',
                message: `${name} has applied for the CGAP program.`,
                is_read: false
            });

        revalidatePath("/admin/applications");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Submission error:", error);
        return { error: error.message || "Failed to submit application" };
    }
}

export async function updateCandidateStatus(candidateId: string, status: string) {
    try {
        // 1. Fetch candidate details for email triggers
        const { data: candidate } = await supabase
            .from("candidates")
            .select("name, email")
            .eq("id", candidateId)
            .single();

        // 2. Update status
        const { error } = await supabase
            .from("candidates")
            .update({ status })
            .eq("id", candidateId);

        if (error) throw error;

        // 3. Trigger Email Notifications
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
                // Return success but with the SPECIFIC error message so we can debug it
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
        console.error("Error updating status:", error);
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
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/admin/slots");
        return { success: true, data };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function bookAssessmentSlot(slotId: string, candidateId: string) {
    try {
        // 1. Update the slot
        const { error: slotError } = await supabase
            .from("assessment_slots")
            .update({
                candidate_id: candidateId,
                is_locked: true
            })
            .eq("id", slotId);

        if (slotError) throw slotError;

        // 2. Update candidate status
        const { error: candidateError } = await supabase
            .from("candidates")
            .update({ status: "Assessment Scheduled" })
            .eq("id", candidateId);

        if (candidateError) throw candidateError;

        // 3. Create notification for HR
        await supabase
            .from('notifications')
            .insert({
                title: 'Assessment Scheduled',
                message: `An assessment slot has been booked.`,
                is_read: false
            });

        revalidatePath("/admin/slots");
        revalidatePath("/admin/applications");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function completeAssessment(candidateId: string) {
    try {
        // 1. Create an interview record first (using current date/time)
        const now = new Date();

        // We fetch the candidate name first for a better notification
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

        // 2. Update candidate status ONLY if interview was created successfully
        // Note: Using the updateCandidateStatus function here to trigger any related logic
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

export async function deleteCandidate(candidateId: string) {
    try {
        const { error } = await supabase
            .from("candidates")
            .delete()
            .eq("id", candidateId);

        if (error) throw error;

        revalidatePath("/admin/applications");
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
