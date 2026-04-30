"use client";

import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, Lock, Unlock, X, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { createAssessmentSlot, completeAssessment } from "@/app/actions";

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

        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

        const result = await createAssessmentSlot(
            startDateTime.toISOString(),
            endDateTime.toISOString()
        );

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
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-md border border-border shadow-soft">
                <div>
                    <h3 className="text-lg font-bold text-heading font-heading italic">Availability Management</h3>
                    <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-widest">Global assessment slot inventory</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2 px-6 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    CREATE SLOT
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {slots.map((slot) => {
                    const isLocked = slot.is_locked || !!slot.candidate_id;
                    return (
                        <div
                            key={slot.id}
                            className={cn(
                                "group relative bg-white border rounded-md p-6 flex flex-col transition-all duration-300 hover:shadow-premium",
                                isLocked ? "border-gray-100 opacity-95" : "border-border hover:border-primary shadow-soft"
                            )}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "p-2.5 rounded-sm shadow-sm",
                                    isLocked ? "bg-surface text-muted" : "bg-primary/10 text-primary group-hover:scale-110 transition-transform"
                                )}>
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                {isLocked ? (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-sm border border-rose-100">
                                        <Lock className="w-3 h-3" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Locked</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100">
                                        <Unlock className="w-3 h-3" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Open</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 flex-grow">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Schedule</p>
                                    <p className="text-base font-black text-heading leading-tight">
                                        {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-muted">
                                        <Clock className="w-3.5 h-3.5 opacity-60" />
                                        <span>
                                            {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {" — "}
                                            {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                    {slot.candidates ? (
                                        <div className="space-y-3">
                                            <div className="bg-surface p-4 rounded-sm border border-border">
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Booked By</p>
                                                <p className="text-[13px] font-bold text-heading truncate">{slot.candidates.name}</p>
                                                <span className="text-[10px] font-bold text-primary mt-1 block tracking-tight uppercase tracking-widest">{slot.candidates.status}</span>
                                            </div>
                                            {slot.candidates.status === "Assessment Scheduled" && (
                                                <button
                                                    onClick={() => markCompleted(slot.id, slot.candidates!.id)}
                                                    disabled={isSubmitting}
                                                    className="w-full btn-primary !py-2 text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Mark Evaluation Complete
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-2 flex items-center gap-2 text-gray-400 italic text-[11px] font-medium">
                                            <Info className="w-3.5 h-3.5" />
                                            Active Inventory — Unassigned
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {slots.length === 0 && (
                    <div className="col-span-full py-20 text-center text-muted bg-surface border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-sm shadow-sm flex items-center justify-center text-border">
                            <CalendarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-heading font-heading italic">No Assessment Inventory</p>
                            <p className="text-[11px] mt-1 font-bold uppercase tracking-widest">Create manual slots for candidate booking</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Slot Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-md shadow-premium w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-border flex justify-between items-start bg-surface">
                            <div>
                                <h3 className="font-bold text-heading text-2xl font-heading italic">Create Inventory</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1">Define New Assessment Period</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-white text-muted rounded-sm shadow-sm hover:rotate-90 transition-all hover:text-heading border border-border"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSlot} className="p-10 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">Target Date</label>
                                <input type="date" name="date" required className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">Start Time</label>
                                <input type="time" name="startTime" required className="input-field" />
                                <div className="flex items-start gap-3 bg-surface p-4 rounded-sm border border-border mt-3">
                                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-body font-bold leading-relaxed uppercase tracking-tight">
                                        System Protocol: Assessment windows are strictly 120 minutes in duration.
                                        Ending time will be automatically calculated.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <p className="text-[11px] text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 font-bold italic">
                                    SYSTEM ERROR: {error}
                                </p>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary w-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2 py-3 text-sm"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "GENERATE SLOT"
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
