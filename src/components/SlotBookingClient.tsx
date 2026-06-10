"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, X, ArrowLeft } from "lucide-react";
import { cn, formatSlotDate, formatSlotTime } from "@/lib/utils";
import { bookAssessmentSlot } from "@/app/actions";

interface Slot {
    id: string;
    start_time: string;
    end_time: string;
}

interface SlotBookingClientProps {
    candidateId: string;
    candidateName: string;
    initialSlots: Slot[];
    currentSlot?: Slot | null;
    isRescheduleMode?: boolean;
}

export default function SlotBookingClient({
    candidateId,
    candidateName,
    initialSlots,
    currentSlot = null,
    isRescheduleMode = false,
}: SlotBookingClientProps) {
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBooking = async () => {
        if (!selectedSlot) return;
        setIsSubmitting(true);
        setError(null);

        const result = await bookAssessmentSlot(candidateId, selectedSlot);

        if (result.success) {
            setIsSuccess(true);
        } else {
            setError(result.error || "An unexpected error occurred.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="card max-w-lg mx-auto p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary text-white rounded-sm flex items-center justify-center mx-auto shadow-premium">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-heading font-heading italic leading-tight">
                        {isRescheduleMode ? "Slot Updated" : "Assessment Scheduled"}
                    </h2>
                    <p className="text-muted font-bold text-[11px] uppercase tracking-widest leading-relaxed opacity-80">
                        {isRescheduleMode
                            ? "Your assessment has been moved to the new time. A fresh confirmation email is on its way."
                            : "Your assessment has been officially scheduled. Please monitor your secure channel for further instructions."}
                    </p>
                </div>
                <button
                    onClick={() => {
                        window.location.href = `/book-slot/${candidateId}`;
                    }}
                    className="btn-primary w-full py-4 text-xs tracking-[0.2em]"
                >
                    View Booking Details
                </button>
            </div>
        );
    }

    // In reschedule mode the current slot must remain available to revisit,
    // so we don't filter it from the list — we render it as a non-clickable
    // "CURRENT" card at the top instead.
    const visibleSlots = initialSlots.filter(
        slot => new Date(slot.start_time) > new Date() && slot.id !== currentSlot?.id
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.5em]">
                    {isRescheduleMode ? "Change Your Time" : "Official Sequence"}
                </span>
                <h1 className="text-3xl font-bold text-heading tracking-tight font-heading italic">
                    {isRescheduleMode ? "Pick a Different Time" : "Assessment Scheduling"}
                </h1>
                <p className="text-muted font-bold text-[11px] uppercase tracking-[0.2em] opacity-60">
                    Welcome, <span className="text-heading">{candidateName}</span> — 120-minute evaluation window
                </p>
            </div>

            {isRescheduleMode && currentSlot && (
                <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">You are currently booked for</p>
                            <p className="text-heading font-bold text-sm italic">
                                {formatSlotDate(currentSlot.start_time)}
                            </p>
                            <p className="text-amber-700 flex items-center gap-1.5 text-[11px] font-bold">
                                <Clock className="w-3 h-3" />
                                {formatSlotTime(currentSlot.start_time)}
                                {" — "}
                                {formatSlotTime(currentSlot.end_time)}
                                <span className="opacity-70">PKT</span>
                            </p>
                        </div>
                        <a
                            href={`/book-slot/${candidateId}`}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 hover:text-heading uppercase tracking-widest border border-gray-300 rounded-sm px-3 py-2 hover:bg-white transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Keep Current
                        </a>
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium">
                        Your current booking <strong>stays reserved</strong>. It will only change after you pick a new time and confirm it below.
                        If you close this page without picking, nothing happens.
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <div className="flex-1">
                        <p className="font-bold text-[10px] uppercase tracking-widest">Access Restriction</p>
                        <p className="text-xs">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {visibleSlots.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                    No other slots are currently available.
                    {isRescheduleMode && (
                        <p className="mt-3 text-xs">Your existing booking remains in place. You can close this page.</p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleSlots.map((slot) => (
                        <div
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={cn(
                                "bg-white border rounded-sm p-6 cursor-pointer transition-all flex flex-col items-center gap-4 text-center group",
                                selectedSlot === slot.id
                                    ? "border-primary bg-surface shadow-premium ring-1 ring-primary/20"
                                    : "border-border hover:border-primary shadow-soft"
                            )}
                        >
                            <CalendarIcon className={cn("w-5 h-5", selectedSlot === slot.id ? "text-primary" : "text-muted group-hover:text-primary transition-colors")} />
                            <div>
                                <p className="font-bold text-heading text-sm italic">
                                    {formatSlotDate(slot.start_time)}
                                </p>
                                <p className="text-muted flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    <Clock className="w-3 h-3" />
                                    {formatSlotTime(slot.start_time)}
                                    {" — "}
                                    {formatSlotTime(slot.end_time)}
                                    <span className="text-primary/70">PKT</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedSlot && (
                <div className="fixed bottom-12 left-0 right-0 px-6 flex justify-center animate-in slide-in-from-bottom-4 duration-300 pointer-events-none">
                    <button
                        onClick={handleBooking}
                        disabled={isSubmitting}
                        className="btn-primary-v2 w-full max-w-xs py-4 text-xs tracking-[0.2em] shadow-premium pointer-events-auto"
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isRescheduleMode ? "Swap to This Time" : "Confirm Booking"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
