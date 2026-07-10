"use server";

// Academy (post-selection) server actions — deliberately kept in their own
// file, separate from the recruiting src/app/actions.ts. The only place this
// file reads from recruiting data is getUnprovisionedConfirmedCandidates()
// and provisionFellowAccount() — the single door between the two systems.
// Nothing here writes to `candidates`, `interviews`, or `assessment_slots`.

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUser } from "@/lib/auth-utils";
import { logAction } from "@/app/actions";
import { sendFellowCredentialsEmail, sendMentorAssignedEmail } from "@/lib/email";
import { CHECKLIST_ITEMS, ChecklistItemKey, ONBOARDING_DOC_TYPES, OnboardingDocType } from "@/types/academy";

const MENTOR_CAPACITY = 2;

async function requireProgramAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be signed in.");
    if (!user.roles.includes("Program_Admin") && !user.roles.includes("Master")) {
        throw new Error("Only Program Admin or Master can do this.");
    }
    return user;
}

function generateTempPassword(): string {
    // Cryptographically random, url-safe — readable enough to type from an
    // email, unlike the shared default password used for internal accounts.
    return `Cgap@${crypto.randomBytes(9).toString("base64url")}`;
}

// ─── Batches ────────────────────────────────────────────────────────────────

export async function createBatch(data: {
    batchNumber: string;
    orientationDate: string;
    expectedCount?: number | null;
    notes?: string | null;
}) {
    try {
        const user = await requireProgramAdmin();

        const { data: batch, error } = await supabaseAdmin
            .from("batches")
            .insert({
                batch_number: data.batchNumber.trim(),
                orientation_date: data.orientationDate,
                expected_count: data.expectedCount ?? null,
                notes: data.notes?.trim() || null,
                status: "Pending Orientation",
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return { error: `Batch ${data.batchNumber} already exists.` };
            }
            throw error;
        }

        // Seed the pre-orientation checklist rows for this batch up front so
        // the checklist screen has something to render immediately.
        await supabaseAdmin.from("pre_orientation_checklist").insert(
            CHECKLIST_ITEMS.map(item => ({ batch_id: batch.id, item_key: item.key }))
        );

        await logAction("BATCH_CREATED", batch.id, "batch", { batch_number: batch.batch_number, created_by: user.full_name });

        revalidatePath("/program/batches");
        return { success: true, batch };
    } catch (error: any) {
        console.error("createBatch error:", error);
        return { error: error.message };
    }
}

// ─── Mentor assignment ──────────────────────────────────────────────────────

export async function getAvailableMentors() {
    try {
        await requireProgramAdmin();

        const { data: mentorRoles, error: roleErr } = await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", "Mentor")
            .single();
        if (roleErr || !mentorRoles) return { success: true, mentors: [] };

        const { data: userRoles, error: urErr } = await supabaseAdmin
            .from("user_roles")
            .select("user_id, users(id, full_name, email)")
            .eq("role_id", mentorRoles.id);
        if (urErr) throw urErr;

        const { data: assignments, error: assignErr } = await supabaseAdmin
            .from("mentor_assignments")
            .select("mentor_user_id, batches(batch_number)");
        if (assignErr) throw assignErr;

        const loadByMentor = new Map<string, string[]>();
        for (const a of assignments ?? []) {
            const list = loadByMentor.get(a.mentor_user_id) ?? [];
            const batchNumber = (a.batches as any)?.batch_number;
            if (batchNumber) list.push(batchNumber);
            loadByMentor.set(a.mentor_user_id, list);
        }

        const mentors = (userRoles ?? [])
            .map((ur: any) => ur.users)
            .filter(Boolean)
            .map((u: any) => ({
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                batches: loadByMentor.get(u.id) ?? [],
            }));

        return { success: true, mentors };
    } catch (error: any) {
        console.error("getAvailableMentors error:", error);
        return { error: error.message };
    }
}

export async function assignMentorToBatch(mentorUserId: string, batchId: string) {
    try {
        await requireProgramAdmin();

        const { data: batch, error: batchErr } = await supabaseAdmin
            .from("batches")
            .select("batch_number, orientation_date")
            .eq("id", batchId)
            .single();
        if (batchErr || !batch) throw new Error("Batch not found.");

        const { data: mentor, error: mentorErr } = await supabaseAdmin
            .from("users")
            .select("full_name, email")
            .eq("id", mentorUserId)
            .single();
        if (mentorErr || !mentor) throw new Error("Mentor not found.");

        // Capacity is shown as an informational tag in the UI, but was never
        // actually enforced — a mentor could silently be assigned a 3rd, 4th
        // batch. Enforcing it for real here.
        const { count: currentLoad } = await supabaseAdmin
            .from("mentor_assignments")
            .select("id", { count: "exact", head: true })
            .eq("mentor_user_id", mentorUserId);
        if ((currentLoad ?? 0) >= MENTOR_CAPACITY) {
            throw new Error(`${mentor.full_name} is already at capacity (${MENTOR_CAPACITY} batches).`);
        }

        const { error: insertErr } = await supabaseAdmin
            .from("mentor_assignments")
            .insert({ mentor_user_id: mentorUserId, batch_id: batchId });
        if (insertErr) throw insertErr;

        try {
            await sendMentorAssignedEmail(mentor.email, mentor.full_name, batch.batch_number, batch.orientation_date);
        } catch (emailErr) {
            console.error("Mentor-assigned email failed (assignment still saved):", emailErr);
        }

        await logAction("MENTOR_ASSIGNED", batchId, "batch", { mentor_name: mentor.full_name, batch_number: batch.batch_number });

        revalidatePath("/program/mentors");
        revalidatePath(`/program/batches/${batchId}`);
        return { success: true };
    } catch (error: any) {
        console.error("assignMentorToBatch error:", error);
        return { error: error.message };
    }
}

// ─── Pre-orientation checklist ──────────────────────────────────────────────

export async function updateChecklistItem(batchId: string, itemKey: ChecklistItemKey, done: boolean) {
    try {
        const user = await requireProgramAdmin();

        const item = CHECKLIST_ITEMS.find(i => i.key === itemKey);
        if (item?.auto) {
            return { error: "This item is set automatically and can't be changed manually." };
        }

        const { error } = await supabaseAdmin
            .from("pre_orientation_checklist")
            .update({ done_at: done ? new Date().toISOString() : null, done_by: done ? user.full_name : null })
            .eq("batch_id", batchId)
            .eq("item_key", itemKey);
        if (error) throw error;

        revalidatePath(`/program/batches/${batchId}`);
        return { success: true };
    } catch (error: any) {
        console.error("updateChecklistItem error:", error);
        return { error: error.message };
    }
}

// The checklist banner said a batch "can't move to Orientation until all
// items are done" but nothing actually moved it — this is the missing
// transition. Only callable once every checklist item is done.
export async function launchBatch(batchId: string) {
    try {
        const user = await requireProgramAdmin();

        const { data: checklist, error: checklistErr } = await supabaseAdmin
            .from("pre_orientation_checklist")
            .select("done_at")
            .eq("batch_id", batchId);
        if (checklistErr) throw checklistErr;

        const allDone = (checklist ?? []).length === CHECKLIST_ITEMS.length && (checklist ?? []).every(c => c.done_at);
        if (!allDone) {
            return { error: "All checklist items must be complete before launching this batch." };
        }

        const { error } = await supabaseAdmin
            .from("batches")
            .update({ status: "Active" })
            .eq("id", batchId);
        if (error) throw error;

        await logAction("BATCH_LAUNCHED", batchId, "batch", { launched_by: user.full_name });

        revalidatePath(`/program/batches/${batchId}`);
        revalidatePath("/program/batches");
        return { success: true };
    } catch (error: any) {
        console.error("launchBatch error:", error);
        return { error: error.message };
    }
}

// ─── The one door: candidate → Fellow ───────────────────────────────────────

export async function getUnprovisionedConfirmedCandidates() {
    try {
        await requireProgramAdmin();

        // Read-only join against candidates — the only place this file
        // touches recruiting data.
        const { data: candidates, error } = await supabaseAdmin
            .from("candidates")
            .select("id, name, email, batch_number")
            .eq("status", "Selected")
            .eq("joining_status", "Confirmed");
        if (error) throw error;

        const { data: fellows, error: fellowErr } = await supabaseAdmin
            .from("fellows")
            .select("source_candidate_id");
        if (fellowErr) throw fellowErr;

        const alreadyProvisioned = new Set((fellows ?? []).map(f => f.source_candidate_id));
        const available = (candidates ?? []).filter(c => !alreadyProvisioned.has(c.id));

        return { success: true, candidates: available };
    } catch (error: any) {
        console.error("getUnprovisionedConfirmedCandidates error:", error);
        return { error: error.message };
    }
}

export async function provisionFellowAccount(candidateId: string, batchId: string) {
    try {
        await requireProgramAdmin();

        const { data: candidate, error: candidateErr } = await supabaseAdmin
            .from("candidates")
            .select("id, name, email, status, joining_status")
            .eq("id", candidateId)
            .single();
        if (candidateErr || !candidate) throw new Error("Candidate not found.");
        if (candidate.status !== "Selected" || candidate.joining_status !== "Confirmed") {
            throw new Error("Candidate must be Selected with Confirmed joining status before provisioning.");
        }

        const { data: batch, error: batchErr } = await supabaseAdmin
            .from("batches")
            .select("batch_number")
            .eq("id", batchId)
            .single();
        if (batchErr || !batch) throw new Error("Batch not found.");

        const tempPassword = generateTempPassword();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: candidate.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: candidate.name },
        });
        if (authError) throw authError;

        const { error: userUpsertErr } = await supabaseAdmin
            .from("users")
            .upsert({ id: authData.user.id, email: candidate.email, full_name: candidate.name });
        if (userUpsertErr) throw userUpsertErr;

        const { data: fellowRole } = await supabaseAdmin.from("roles").select("id").eq("name", "Fellow").single();
        if (fellowRole) {
            await supabaseAdmin.from("user_roles").insert({ user_id: authData.user.id, role_id: fellowRole.id });
        }

        const { data: fellow, error: fellowInsertErr } = await supabaseAdmin
            .from("fellows")
            .insert({ source_candidate_id: candidateId, batch_id: batchId, auth_user_id: authData.user.id })
            .select()
            .single();
        if (fellowInsertErr) throw fellowInsertErr;

        const origin = process.env.NEXT_PUBLIC_APP_URL || "https://cbt-recruitment-portal.vercel.app";
        try {
            await sendFellowCredentialsEmail(candidate.email, candidate.name, tempPassword, `${origin}/login`, batch.batch_number);
        } catch (emailErr) {
            console.error("Fellow credentials email failed (account still created):", emailErr);
        }

        await logAction("FELLOW_PROVISIONED", fellow.id, "fellow", {
            candidate_name: candidate.name,
            batch_number: batch.batch_number,
        });

        revalidatePath(`/program/batches/${batchId}`);
        return { success: true, fellow };
    } catch (error: any) {
        console.error("provisionFellowAccount error:", error);
        return { error: error.message };
    }
}

// ─── Onboarding documents ────────────────────────────────────────────────────

export async function uploadOnboardingDocument(fellowId: string, docType: OnboardingDocType, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) return { error: "You must be signed in." };

        // A Fellow may only upload their own documents; Program Admin/Master may too (support cases).
        const { data: fellow, error: fellowErr } = await supabaseAdmin
            .from("fellows")
            .select("auth_user_id")
            .eq("id", fellowId)
            .single();
        if (fellowErr || !fellow) throw new Error("Fellow not found.");
        const isOwner = fellow.auth_user_id === user.id;
        const isAdmin = user.roles.includes("Program_Admin") || user.roles.includes("Master");
        if (!isOwner && !isAdmin) throw new Error("You can only upload your own documents.");

        const file = formData.get("file") as File;
        if (!file) throw new Error("No file provided.");
        if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5MB.");

        const fileExt = file.name.split(".").pop();
        const finalFileName = `${fellowId}_${docType}_${Date.now()}.${fileExt}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadErr } = await supabaseAdmin.storage
            .from("fellow-documents")
            .upload(finalFileName, buffer, { contentType: file.type, upsert: true });
        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

        const { data: { publicUrl } } = supabaseAdmin.storage.from("fellow-documents").getPublicUrl(finalFileName);

        const { error: upsertErr } = await supabaseAdmin
            .from("onboarding_documents")
            .upsert(
                {
                    fellow_id: fellowId,
                    doc_type: docType,
                    file_url: publicUrl,
                    uploaded_at: new Date().toISOString(),
                    verified_at: null,
                    rejected_reason: null,
                },
                { onConflict: "fellow_id,doc_type" }
            );
        if (upsertErr) throw upsertErr;

        await recomputeFellowOnboardingStatus(fellowId);
        await logAction("ONBOARDING_DOC_UPLOADED", fellowId, "fellow", { doc_type: docType });

        revalidatePath("/program/fellow");
        revalidatePath("/program/batches");
        return { success: true, publicUrl };
    } catch (error: any) {
        console.error("uploadOnboardingDocument error:", error);
        return { error: error.message };
    }
}

// Recomputes the Fellow's overall onboarding_status from their individual
// documents — without this, the field never advances past its default
// 'Pending' no matter how many documents get verified.
async function recomputeFellowOnboardingStatus(fellowId: string) {
    const { data: docs } = await supabaseAdmin
        .from("onboarding_documents")
        .select("doc_type, verified_at, rejected_reason")
        .eq("fellow_id", fellowId);

    const allVerified = ONBOARDING_DOC_TYPES.every(t => docs?.some(d => d.doc_type === t.key && d.verified_at));
    const anyRejected = (docs ?? []).some(d => d.rejected_reason);

    const onboarding_status = allVerified ? "Verified" : anyRejected ? "Rejected" : "Pending";
    await supabaseAdmin.from("fellows").update({ onboarding_status }).eq("id", fellowId);
    return onboarding_status;
}

export async function verifyOnboardingDocument(documentId: string) {
    try {
        await requireProgramAdmin();
        const { data: doc, error: fetchErr } = await supabaseAdmin
            .from("onboarding_documents")
            .update({ verified_at: new Date().toISOString(), rejected_reason: null })
            .eq("id", documentId)
            .select("fellow_id")
            .single();
        if (fetchErr) throw fetchErr;

        await recomputeFellowOnboardingStatus(doc.fellow_id);
        await logAction("ONBOARDING_DOC_VERIFIED", documentId, "onboarding_document", {});
        revalidatePath("/program/batches");
        revalidatePath("/program/fellow");
        return { success: true };
    } catch (error: any) {
        console.error("verifyOnboardingDocument error:", error);
        return { error: error.message };
    }
}

export async function rejectOnboardingDocument(documentId: string, reason: string) {
    try {
        await requireProgramAdmin();
        const { data: doc, error: fetchErr } = await supabaseAdmin
            .from("onboarding_documents")
            .update({ verified_at: null, rejected_reason: reason })
            .eq("id", documentId)
            .select("fellow_id")
            .single();
        if (fetchErr) throw fetchErr;

        await recomputeFellowOnboardingStatus(doc.fellow_id);
        await logAction("ONBOARDING_DOC_REJECTED", documentId, "onboarding_document", { reason });
        revalidatePath("/program/batches");
        revalidatePath("/program/fellow");
        return { success: true };
    } catch (error: any) {
        console.error("rejectOnboardingDocument error:", error);
        return { error: error.message };
    }
}
