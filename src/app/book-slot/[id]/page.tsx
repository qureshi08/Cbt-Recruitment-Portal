import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import SlotBookingClient from "@/components/SlotBookingClient";
import RescheduleButton from "@/components/RescheduleButton";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookSlotPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;

    // 1. Verify candidate exists and is 'Approved'
    const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .select("name, status")
        .eq("id", id)
        .single();

    if (candidateError || !candidate) {
        return notFound();
    }

    if (candidate.status !== "Approved") {
        // If already scheduled, show their current slot + reschedule option
        if (candidate.status === "Assessment Scheduled") {
            const { data: currentSlot } = await supabase
                .from("assessment_slots")
                .select("*")
                .eq("candidate_id", id)
                .single();

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-white">
                    <div className="bg-white border border-border rounded-sm shadow-premium max-w-lg w-full text-center space-y-6 p-10">
                        <div className="w-16 h-16 bg-primary text-white rounded-sm flex items-center justify-center mx-auto shadow-premium">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-heading italic">Slot Confirmed</h2>
                            <p className="text-muted font-bold text-[10px] uppercase tracking-widest">
                                Assessment Successfully Scheduled
                            </p>
                        </div>

                        {currentSlot && (
                            <div className="bg-surface-alt border border-border p-5 rounded-sm space-y-2">
                                <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">Scheduled Registry Entry</p>
                                <p className="text-base font-bold text-heading italic">
                                    {new Date(currentSlot.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm font-bold text-primary font-mono tracking-tighter">
                                    {new Date(currentSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {" — "}
                                    {new Date(currentSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-border">
                            <RescheduleButton candidateId={id} />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                <div className="card max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                        <Logo withText={false} className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Invalid Status</h2>
                    <p className="text-gray-600">
                        This booking link is only valid for approved candidates.
                        Current status: <span className="font-bold">{candidate.status}</span>
                    </p>
                </div>
            </div>
        );
    }

    // 2. Fetch available slots
    const { data: slots } = await supabase
        .from("assessment_slots")
        .select("*")
        .eq("is_locked", false)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-white border-b border-border py-3 px-6 flex justify-between items-center h-14">
                <Logo />
            </header>

            <main className="max-w-4xl mx-auto py-10 px-6">
                <SlotBookingClient candidateId={id} candidateName={candidate.name} initialSlots={slots || []} />
            </main>
        </div>
    );
}
