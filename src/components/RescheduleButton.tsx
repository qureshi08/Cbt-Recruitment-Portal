"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface RescheduleButtonProps {
    candidateId: string;
}

export default function RescheduleButton({ candidateId }: RescheduleButtonProps) {
    const [isConfirming, setIsConfirming] = useState(false);

    // Navigate into the slot picker while keeping the current booking held.
    // The slot is only swapped (atomically) once they actually pick a new one.
    // If they close the tab, their original slot stays intact.
    const goToPicker = () => {
        window.location.href = `/book-slot/${candidateId}?reschedule=1`;
    };

    if (!isConfirming) {
        return (
            <button
                onClick={() => setIsConfirming(true)}
                className="text-xs text-gray-500 hover:text-primary transition-colors underline underline-offset-2"
            >
                Need to reschedule?
            </button>
        );
    }

    return (
        <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2 justify-center text-amber-600 text-left max-w-xs mx-auto">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold">
                    Your current slot will stay reserved. It will only change once you pick and confirm a new time.
                </p>
            </div>

            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setIsConfirming(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                    Keep Current
                </button>
                <button
                    onClick={goToPicker}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                    See Other Times
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
