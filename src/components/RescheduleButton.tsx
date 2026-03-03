"use client";

import { useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { rescheduleAssessment } from "@/app/actions";

interface RescheduleButtonProps {
    candidateId: string;
}

export default function RescheduleButton({ candidateId }: RescheduleButtonProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReschedule = async () => {
        setIsLoading(true);
        setError(null);

        const result = await rescheduleAssessment(candidateId);

        if (result.success) {
            // Reload the page — server will now show the slot selection UI
            window.location.reload();
        } else {
            setError(result.error || "Failed to reschedule. Please try again.");
            setIsLoading(false);
        }
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
            <div className="flex items-center gap-2 justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-xs font-semibold">This will cancel your current booking.</p>
            </div>

            {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setIsConfirming(false)}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                    Keep Current
                </button>
                <button
                    onClick={handleReschedule}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3 h-3" />
                    )}
                    {isLoading ? "Rescheduling..." : "Yes, Reschedule"}
                </button>
            </div>
        </div>
    );
}
