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
        <div className="space-y-5">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Assessment Slots</h1>
                    <p className="admin-page-subtitle">Manage time slots for candidate assessments.</p>
                </div>
            </div>

            <div className="card">
                <SlotManager initialSlots={slots || []} />
            </div>
        </div>
    );
}
