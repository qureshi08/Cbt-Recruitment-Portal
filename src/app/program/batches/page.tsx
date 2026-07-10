import { supabase } from "@/lib/supabase";
import { Batch } from "@/types/academy";
import BatchList from "@/components/program/BatchList";

export default async function BatchesPage() {
    const [{ data: batches, error }, { data: assignments }, { data: fellows }] = await Promise.all([
        supabase.from("batches").select("*").order("created_at", { ascending: false }),
        supabase.from("mentor_assignments").select("batch_id, users(full_name)"),
        supabase.from("fellows").select("batch_id"),
    ]);

    if (error) {
        return <div>Error loading batches: {error.message}</div>;
    }

    const mentorByBatch = new Map<string, string>();
    for (const a of assignments ?? []) {
        const name = (a.users as any)?.full_name;
        if (name) mentorByBatch.set(a.batch_id, name);
    }
    const fellowCountByBatch = new Map<string, number>();
    for (const f of fellows ?? []) {
        fellowCountByBatch.set(f.batch_id, (fellowCountByBatch.get(f.batch_id) ?? 0) + 1);
    }

    const enriched: Batch[] = (batches ?? []).map((b: any) => ({
        ...b,
        mentor_name: mentorByBatch.get(b.id) ?? null,
        fellow_count: fellowCountByBatch.get(b.id) ?? 0,
    }));

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
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
                        <span className="italic-accent">Batches</span>
                    </h1>
                    <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                        Every batch, whatever stage it&apos;s at.
                    </p>
                </div>
            </div>

            <BatchList initialBatches={enriched} />
        </div>
    );
}
