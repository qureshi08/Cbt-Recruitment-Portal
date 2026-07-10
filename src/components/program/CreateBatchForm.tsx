"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/app/program/actions";
import { withLoading } from "@/lib/loading";

export default function CreateBatchForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const batchNumber = (formData.get("batchNumber") as string || "").trim();
        const orientationDate = formData.get("orientationDate") as string;
        const expectedCountRaw = formData.get("expectedCount") as string;
        const notes = formData.get("notes") as string;

        const result = await withLoading(() => createBatch({
            batchNumber,
            orientationDate,
            expectedCount: expectedCountRaw ? Number(expectedCountRaw) : null,
            notes: notes || null,
        }));

        setIsSubmitting(false);
        if (result.success && result.batch) {
            router.push(`/program/batches/${result.batch.id}`);
        } else {
            setError(result.error || "Failed to create batch.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">Batch Number</label>
                <input name="batchNumber" required placeholder="e.g. 33" className="input-field" />
            </div>
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">Orientation Date</label>
                <input name="orientationDate" type="date" required className="input-field" />
            </div>
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">Expected Fellow Count</label>
                <input name="expectedCount" type="number" min="0" placeholder="Optional" className="input-field" />
            </div>
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">Notes</label>
                <textarea name="notes" rows={3} placeholder="Optional" className="input-field" />
            </div>

            {error && (
                <p className="text-[11px] text-rose-600 bg-rose-50 p-3 rounded-sm border border-rose-100 font-bold">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-40"
            >
                {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    "Create Batch →"
                )}
            </button>
        </form>
    );
}
