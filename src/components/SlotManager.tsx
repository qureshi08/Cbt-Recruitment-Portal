"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar as CalendarIcon, Clock, Lock, Unlock, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createAssessmentSlot, completeAssessment } from "@/app/actions";
import { supabase } from "@/lib/supabase";

interface Slot {
    id: string;
    candidate_id?: string | null;
    start_time: string;
    end_time: string;
    is_locked: boolean;
    candidates?: { id: string, name: string, status: string } | null;
}

interface SlotManagerProps {
    initialSlots: Slot[];
}

export default function SlotManager({ initialSlots }: SlotManagerProps) {
    const [slots, setSlots] = useState<Slot[]>(initialSlots);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateSlot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const date = formData.get("date") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;

        const startDateTime = new Date(`${date}T${startTime}`).toISOString();
        const endDateTime = new Date(`${date}T${endTime}`).toISOString();

        const result = await createAssessmentSlot(startDateTime, endDateTime);

        if (result.success) {
            setSlots((prev) => [...prev, result.data as Slot].sort((a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            ));
            setIsModalOpen(false);
            (e.target as HTMLFormElement).reset();
        } else {
            setError(result.error || "Failed to create slot");
        }
        setIsSubmitting(false);
    };

    const markCompleted = async (slotId: string, candidateId: string) => {
        if (!window.confirm("Mark this assessment as completed? Candidate will move to 'To Be Interviewed'.")) return;

        setIsSubmitting(true);
        try {
            const result = await completeAssessment(candidateId);
            if (result.success) {
                alert("Assessment marked as completed!");
                window.location.reload();
            } else {
                alert(result.error);
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">All Slots</h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create New Slot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => (
                    <div
                        key={slot.id}
                        className={cn(
                            "border rounded-lg p-4 flex flex-col justify-between space-y-4 transition-all",
                            slot.is_locked ? "bg-gray-50 border-border" : "bg-white border-primary/20 hover:border-primary/50"
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-primary">
                                <CalendarIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {new Date(slot.start_time).toLocaleDateString()}
                                </span>
                            </div>
                            {slot.is_locked ? (
                                <Lock className="w-4 h-4 text-gray-400" />
                            ) : (
                                <Unlock className="w-4 h-4 text-primary opacity-50" />
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {" - "}
                                {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <div className="pt-2 border-t border-border flex flex-col gap-3">
                            {slot.candidates ? (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Booked by</span>
                                        <span className="text-sm font-medium text-gray-800">{slot.candidates.name}</span>
                                        <span className="text-[10px] text-primary font-bold uppercase">{slot.candidates.status}</span>
                                    </div>
                                    {slot.candidates.status === "Assessment Scheduled" && (
                                        <button
                                            onClick={() => markCompleted(slot.id, slot.candidates!.id)}
                                            disabled={isSubmitting}
                                            className="btn-primary !py-1.5 text-xs flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Complete Assessment
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="text-sm text-gray-400 italic">Available</span>
                            )}
                        </div>
                    </div>
                ))}

                {slots.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 card bg-gray-50/50 border-dashed">
                        No assessment slots created yet.
                    </div>
                )}
            </div>

            {/* Create Slot Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Create New Slot</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Date</label>
                                <input type="date" name="date" required className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                                    <input type="time" name="startTime" required className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">End Time</label>
                                    <input type="time" name="endTime" required className="input-field" />
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 italic">
                                    {error}
                                </p>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Create Slot"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
