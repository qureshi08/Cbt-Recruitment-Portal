"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
}

export default function SlotBookingClient({ candidateId, candidateName, initialSlots }: SlotBookingClientProps) {
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
            // Scroll to error
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
                    <h2 className="text-2xl font-bold text-heading font-heading italic leading-tight">Registry Entry Successful</h2>
                    <p className="text-muted font-bold text-[11px] uppercase tracking-widest leading-relaxed opacity-80">
                        Your assessment has been officially scheduled. Please monitor your secure channel for further instructions.
                    </p>
                </div>
                <button
                    onClick={() => {
                        window.location.reload();
                    }}
                    className="btn-primary w-full py-4 text-xs tracking-[0.2em]"
                >
                    View Registry Details
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.5em]">Official Sequence</span>
                <h1 className="text-3xl font-bold text-heading tracking-tight font-heading italic">Registry Scheduling</h1>
                <p className="text-muted font-bold text-[11px] uppercase tracking-[0.2em] opacity-60">
                    Welcome, <span className="text-heading">{candidateName}</span> — Identify your 120-minute evaluation window
                </p>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialSlots.map((slot) => (
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
                                {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-muted flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {" — "}
                                {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

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
                            "Confirm Registry Entry"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
