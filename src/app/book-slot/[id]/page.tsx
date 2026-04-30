import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import Image from "next/image";
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
                <div className="min-h-screen flex items-center justify-center p-5 bg-surface grid-bg">
                    <div className="bg-white border border-border rounded-[12px] max-w-md w-full text-center space-y-5 p-8" style={{ boxShadow: "var(--shadow-premium)" }}>
                        <div className="w-12 h-12 bg-primary text-white rounded-[10px] flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h2
                                className="text-heading font-bold"
                                style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", letterSpacing: "-0.02em" }}
                            >
                                Slot <span className="italic-accent">Confirmed</span>
                            </h2>
                            <p className="text-muted text-[10px] font-semibold uppercase tracking-[0.14em]">
                                Assessment successfully scheduled
                            </p>
                        </div>

                        {currentSlot && (
                            <div className="bg-surface border border-border p-4 rounded-md space-y-1.5">
                                <p className="text-[9.5px] font-semibold text-muted uppercase tracking-[0.16em]">Scheduled Entry</p>
                                <p
                                    className="text-heading font-bold"
                                    style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontStyle: "italic" }}
                                >
                                    {new Date(currentSlot.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-[13px] font-semibold text-primary font-mono">
                                    {new Date(currentSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {" — "}
                                    {new Date(currentSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}

                        <div className="pt-3 border-t border-border">
                            <RescheduleButton candidateId={id} />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-5 bg-surface">
                <div className="card max-w-md w-full text-center space-y-3">
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                        <Logo withText={false} className="w-6 h-6" />
                    </div>
                    <h2
                        className="text-heading font-bold"
                        style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", letterSpacing: "-0.02em" }}
                    >
                        Invalid Status
                    </h2>
                    <p className="text-body text-[13px] leading-relaxed">
                        This booking link is only valid for approved candidates.
                        Current status: <span className="font-semibold text-heading">{candidate.status}</span>
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
            <header className="bg-white border-b border-border px-5 md:px-8 flex justify-between items-center h-14">
                <Logo />
                <div className="relative h-7 w-24 opacity-90">
                    <Image
                        src="/cgap-logo.png"
                        alt="CGAP Logo"
                        fill
                        className="object-contain object-right"
                        priority
                    />
                </div>
            </header>

            <main className="max-w-3xl mx-auto py-8 px-5 md:px-8">
                <SlotBookingClient candidateId={id} candidateName={candidate.name} initialSlots={slots || []} />
            </main>
        </div>
    );
}
