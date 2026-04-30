import { supabase } from "@/lib/supabase";
import SlotManager from "@/components/SlotManager";

export default async function SlotsPage() {
    const { data: slots, error } = await supabase
        .from("assessment_slots")
        .select(`
      *,
      candidates (
        id,
        name,
        status
      )
    `)
        .order("start_time", { ascending: true });

    if (error) {
        return <div>Error loading slots: {error.message}</div>;
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Scheduling</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    Assessment <span className="italic-accent">Slots</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Manage time slots for candidate assessments.
                </p>
            </div>

            <div className="card">
                <SlotManager initialSlots={slots || []} />
            </div>
        </div>
    );
}
