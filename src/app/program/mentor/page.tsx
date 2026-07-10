import { getCurrentUser } from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function MentorHomePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const { data: assignments } = await supabase
        .from("mentor_assignments")
        .select("batch_id, batches(batch_number, status)")
        .eq("mentor_user_id", user.id);

    const batchIds = (assignments ?? []).map(a => a.batch_id);

    const { data: fellowRows } = batchIds.length
        ? await supabase.from("fellows").select("*, candidates(name, email)").in("batch_id", batchIds)
        : { data: [] };

    const fellowsByBatch = new Map<string, any[]>();
    for (const f of fellowRows ?? []) {
        const list = fellowsByBatch.get(f.batch_id) ?? [];
        list.push(f);
        fellowsByBatch.set(f.batch_id, list);
    }

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
                    My <span className="italic-accent">Batches</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    {(assignments ?? []).length === 0 ? "No batch assigned yet." : "Your fellows, at a glance."}
                </p>
            </div>

            {(assignments ?? []).map((a: any) => {
                const fellows = fellowsByBatch.get(a.batch_id) ?? [];
                return (
                    <div key={a.batch_id} className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
                        <div className="px-5 py-4 border-b border-border bg-surface">
                            <h2 className="text-sm font-bold text-heading tracking-tight italic">Batch #{a.batches?.batch_number}</h2>
                            <p className="text-[11px] text-muted mt-0.5">{fellows.length} fellow{fellows.length !== 1 ? "s" : ""} · {a.batches?.status}</p>
                        </div>
                        {fellows.length === 0 ? (
                            <div className="p-6 text-center text-[12px] text-muted">No fellows provisioned into this batch yet.</div>
                        ) : (
                            <div className="divide-y divide-border">
                                {fellows.map(f => (
                                    <div key={f.id} className="flex items-center justify-between px-5 py-3">
                                        <div>
                                            <p className="text-[12.5px] font-bold text-heading">{f.candidates?.name}</p>
                                            <p className="text-[10.5px] text-muted">{f.candidates?.email}</p>
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border bg-surface text-muted border-border">
                                            {f.onboarding_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
