"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookAssessmentSlot } from "@/app/actions";

interface Slot {
    id: string;
    start_time: string;
    end_time: string;
}

interface SlotBookingClientProps {
    candidateId: string;
    initialSlots: Slot[];
}

export default function SlotBookingClient({ candidateId, initialSlots }: SlotBookingClientProps) {
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleBooking = async () => {
        if (!selectedSlot) return;
        setIsSubmitting(true);

        const result = await bookAssessmentSlot(candidateId, selectedSlot);

        if (result.success) {
            setIsSuccess(true);
        } else {
            alert("Failed to book slot: " + result.error);
        }
        setIsSubmitting(false);
    };

    if (isSuccess) {
        return (
            <div className="card max-w-lg mx-auto p-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto scale-110">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Slot Booked!</h2>
                    <p className="text-gray-600">
                        Your assessment has been scheduled. Check your email for the next steps and preparation material.
                    </p>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="btn-primary"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialSlots.map((slot) => (
                    <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={cn(
                            "card p-6 cursor-pointer border-2 transition-all hover:shadow-md flex flex-col items-center gap-3 text-center",
                            selectedSlot === slot.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                : "border-border hover:border-primary/30"
                        )}
                    >
                        <CalendarIcon className={cn("w-6 h-6", selectedSlot === slot.id ? "text-primary" : "text-gray-400")} />
                        <div>
                            <p className="font-bold text-gray-900">
                                {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-gray-500 flex items-center justify-center gap-1 text-sm mt-1">
                                <Clock className="w-3 h-3" />
                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {" - "}
                                {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {initialSlots.length === 0 && (
                    <div className="col-span-full py-16 text-center card bg-white border-dashed">
                        <p className="text-gray-500 italic">No available slots at the moment. Please check back later.</p>
                    </div>
                )}
            </div>

            {selectedSlot && (
                <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={handleBooking}
                        disabled={isSubmitting}
                        className="btn-primary px-12 py-4 text-lg shadow-2xl flex items-center gap-3"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "Confirm Selection"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
