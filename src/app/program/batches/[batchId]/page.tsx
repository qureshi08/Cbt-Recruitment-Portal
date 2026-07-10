import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CHECKLIST_ITEMS } from "@/types/academy";
import { getUnprovisionedConfirmedCandidates } from "@/app/program/actions";
import BatchDetail from "@/components/program/BatchDetail";

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
    const { batchId } = await params;

    const [{ data: batch, error: batchError }, { data: checklistRows }, { data: fellowRows }, candidatesResult] = await Promise.all([
        supabase.from("batches").select("*").eq("id", batchId).single(),
        supabase.from("pre_orientation_checklist").select("*").eq("batch_id", batchId),
        supabase.from("fellows").select("*, candidates(name, email)").eq("batch_id", batchId),
        getUnprovisionedConfirmedCandidates(),
    ]);

    if (batchError || !batch) {
        notFound();
    }

    // Ensure all 8 checklist items are represented even if a batch predates a
    // template change — falls back to an unchecked row rather than hiding it.
    const checklist = CHECKLIST_ITEMS.map(item => {
        const existing = (checklistRows ?? []).find(r => r.item_key === item.key);
        return existing ?? { id: item.key, batch_id: batchId, item_key: item.key, done_at: null, done_by: null };
    });

    const fellowIds = (fellowRows ?? []).map((f: any) => f.id);
    const { data: documentRows } = fellowIds.length
        ? await supabase.from("onboarding_documents").select("*").in("fellow_id", fellowIds)
        : { data: [] };
    const documentsByFellow = new Map<string, any[]>();
    for (const d of documentRows ?? []) {
        const list = documentsByFellow.get(d.fellow_id) ?? [];
        list.push(d);
        documentsByFellow.set(d.fellow_id, list);
    }

    const fellows = (fellowRows ?? []).map((f: any) => ({
        ...f,
        name: f.candidates?.name,
        email: f.candidates?.email,
        documents: documentsByFellow.get(f.id) ?? [],
    }));

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">CGAP Academy</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    Batch <span className="italic-accent">#{batch.batch_number}</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Orientation {new Date(batch.orientation_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {batch.status}
                </p>
            </div>

            <BatchDetail
                batchId={batchId}
                initialStatus={batch.status}
                initialChecklist={checklist as any}
                initialFellows={fellows}
                initialAvailableCandidates={candidatesResult.success ? candidatesResult.candidates ?? [] : []}
            />
        </div>
    );
}
