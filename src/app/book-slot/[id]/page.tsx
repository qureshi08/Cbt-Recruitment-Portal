import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import Image from "next/image";
import SlotBookingClient from "@/components/SlotBookingClient";
import RescheduleButton from "@/components/RescheduleButton";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { formatSlotDate, formatSlotTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookSlotPage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ reschedule?: string }>;
}) {
    const { id } = await props.params;
    const { reschedule } = await props.searchParams;
    const inRescheduleMode = reschedule === "1";

    // 1. Verify candidate exists
    const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .select("name, status")
        .eq("id", id)
        .single();

    if (candidateError || !candidate) {
        return notFound();
    }

    // Already-scheduled candidate visiting WITHOUT ?reschedule=1: show their
    // confirmation card. They can click "Need to reschedule?" to re-enter the
    // picker (which sets ?reschedule=1).
    if (candidate.status === "Assessment Scheduled" && !inRescheduleMode) {
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
                                {formatSlotDate(currentSlot.start_time)}
                            </p>
                            <p className="text-[13px] font-semibold text-primary font-mono">
                                {formatSlotTime(currentSlot.start_time)}
                                {" — "}
                                {formatSlotTime(currentSlot.end_time)}
                                <span className="text-primary/60 ml-1.5">PKT</span>
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

    // Non-bookable states (e.g. Assessment Completed, Recommended, etc.) —
    // candidate shouldn't be here.
    if (
        candidate.status !== "Approved" &&
        candidate.status !== "Invite Sent" &&
        candidate.status !== "Absent" &&
        candidate.status !== "Assessment Scheduled" // allowed in reschedule mode (handled below)
    ) {
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

    // Either:
    //  - status in (Approved | Invite Sent | Absent) — fresh booking, OR
    //  - status === Assessment Scheduled AND inRescheduleMode — pick a swap
    // In both cases we render the picker. If we're in reschedule mode, we also
    // fetch the candidate's current slot to show alongside (so they know what
    // they're swapping out of).
    let currentSlot = null;
    if (candidate.status === "Assessment Scheduled" && inRescheduleMode) {
        const { data } = await supabase
            .from("assessment_slots")
            .select("*")
            .eq("candidate_id", id)
            .single();
        currentSlot = data;
    }

    // Fetch available slots (unlocked, in the future)
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
                <SlotBookingClient
                    candidateId={id}
                    candidateName={candidate.name}
                    initialSlots={slots || []}
                    currentSlot={currentSlot}
                    isRescheduleMode={inRescheduleMode}
                />
            </main>
        </div>
    );
}
