import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import SlotBookingClient from "@/components/SlotBookingClient";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

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
        // If already scheduled, show their current slot instead of a booking form
        if (candidate.status === "Assessment Scheduled") {
            const { data: currentSlot } = await supabase
                .from("assessment_slots")
                .select("*")
                .eq("candidate_id", id)
                .single();

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                    <div className="card max-w-lg w-full text-center space-y-6 p-12">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto scale-110">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-extrabold text-gray-900">Already Scheduled!</h2>
                            <p className="text-gray-600">
                                You have already booked an assessment slot.
                            </p>
                        </div>

                        {currentSlot && (
                            <div className="bg-gray-50 border border-border p-4 rounded-xl space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scheduled For</p>
                                <p className="text-lg font-bold text-primary">
                                    {new Date(currentSlot.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                    {new Date(currentSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {" - "}
                                    {new Date(currentSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 italic text-[10px] text-gray-400">
                            If you need to reschedule, please contact the recruitment team at recruitment@cbt.com.
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
        <div className="min-h-screen bg-gray-50/50">
            <header className="bg-white border-b border-border py-4 px-6 flex justify-between items-center">
                <Logo />
            </header>

            <main className="max-w-4xl mx-auto py-12 px-6">
                <div className="space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">Select Your Assessment Slot</h1>
                        <p className="text-gray-600 text-lg">
                            Welcome, <span className="text-primary font-bold">{candidate.name}</span>!
                            Please pick a time for your digital assessment.
                        </p>
                    </div>

                    <SlotBookingClient candidateId={id} initialSlots={slots || []} />
                </div>
            </main>
        </div>
    );
}
