"use client";

import { useState } from "react";
import { assignMentorToBatch } from "@/app/program/actions";
import { withLoading } from "@/lib/loading";

const CAPACITY = 2;

interface Mentor {
    id: string;
    full_name: string;
    email: string;
    batches: string[];
}

interface MentorAssignmentProps {
    initialMentors: Mentor[];
    loadError: string | null;
    batches: { id: string; batch_number: string }[];
}

export default function MentorAssignment({ initialMentors, loadError, batches }: MentorAssignmentProps) {
    const [mentors, setMentors] = useState(initialMentors);
    const [selectedBatch, setSelectedBatch] = useState<Record<string, string>>({});
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(loadError);

    const handleAssign = async (mentor: Mentor) => {
        const batchId = selectedBatch[mentor.id];
        if (!batchId) return;
        const batch = batches.find(b => b.id === batchId);

        setAssigningId(mentor.id);
        const result = await withLoading(() => assignMentorToBatch(mentor.id, batchId));
        setAssigningId(null);

        if (result.error) {
            setError(result.error);
            return;
        }
        setMentors(prev => prev.map(m => m.id === mentor.id
            ? { ...m, batches: [...m.batches, batch?.batch_number ?? batchId] }
            : m
        ));
    };

    return (
        <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 border-b border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}
            <div className="divide-y divide-border">
                {mentors.length === 0 ? (
                    <div className="p-10 text-center text-[12px] text-muted">
                        No Mentor accounts yet — create one from Portal Settings → User Management with the &quot;Mentor&quot; role, then assign them to a batch here.
                    </div>
                ) : mentors.map(mentor => {
                    const atCapacity = mentor.batches.length >= CAPACITY;
                    // Capacity is enforced server-side too (assignMentorToBatch)
                    // — this just keeps the dropdown from offering something
                    // the server would reject anyway.
                    const assignableBatches = atCapacity ? [] : batches.filter(b => !mentor.batches.includes(b.batch_number));
                    return (
                        <div key={mentor.id} className="flex items-center justify-between gap-4 px-5 py-3.5 flex-wrap">
                            <div>
                                <p className="text-[12.5px] font-bold text-heading">{mentor.full_name}</p>
                                <p className="text-[10.5px] text-muted">{mentor.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={atCapacity
                                    ? "text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200"
                                    : "text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border bg-primary/5 text-primary border-primary/20"
                                }>
                                    {mentor.batches.length} batch{mentor.batches.length === 1 ? "" : "es"}{atCapacity ? " · at capacity" : ""}
                                </span>
                                {mentor.batches.length > 0 && (
                                    <span className="text-[10px] text-muted">({mentor.batches.map(b => `#${b}`).join(", ")})</span>
                                )}
                            </div>
                            {assignableBatches.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <select
                                        className="border border-border bg-surface rounded-sm px-2 py-1.5 text-[10.5px] font-bold cursor-pointer outline-none text-heading"
                                        value={selectedBatch[mentor.id] ?? ""}
                                        onChange={e => setSelectedBatch(prev => ({ ...prev, [mentor.id]: e.target.value }))}
                                    >
                                        <option value="">Assign to batch…</option>
                                        {assignableBatches.map(b => (
                                            <option key={b.id} value={b.id}>Batch #{b.batch_number}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleAssign(mentor)}
                                        disabled={!selectedBatch[mentor.id] || assigningId === mentor.id}
                                        className="px-3.5 py-1.5 bg-primary text-white text-[10.5px] font-bold rounded-sm shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-40"
                                    >
                                        {assigningId === mentor.id ? "…" : "Assign"}
                                    </button>
                                </div>
                            )}
                            {assignableBatches.length === 0 && atCapacity && (
                                <span className="text-[10px] text-muted italic">At capacity — unassign a batch to free up a slot</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
