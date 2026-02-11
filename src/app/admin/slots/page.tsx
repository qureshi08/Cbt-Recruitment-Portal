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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Assessment Slots</h2>
                <p className="text-sm text-gray-500">Manage time slots for candidate assessments.</p>
            </div>

            <div className="card">
                <SlotManager initialSlots={slots || []} />
            </div>
        </div>
    );
}
