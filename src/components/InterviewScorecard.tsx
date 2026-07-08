"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Candidate, InterviewFeedbackJson } from "@/types/database";

// ─── Interview Score helpers ──────────────────────────────────────────────────
// Extracted from CandidateTable.tsx so the Merit List page can reuse the same
// scoring widgets/modal instead of duplicating ~150 lines.

export const SCORE_CATS: { key: keyof Omit<InterviewFeedbackJson, 'overall_notes'>; label: string }[] = [
    { key: 'technical', label: 'Technical' },
    { key: 'communication', label: 'Communication' },
    { key: 'masters_plans', label: "Master's Plans" },
    { key: 'analytical', label: 'Analytical' },
    { key: 'personality', label: 'Personality' },
];

export function calcAvg(fb: InterviewFeedbackJson): number {
    const scores = SCORE_CATS.map(c => fb[c.key].score).filter(s => s > 0);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

export function ScoreBar({ score }: { score: number }) {
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-primary', 'bg-primary'];
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={cn("h-1 w-3.5 rounded-full", n <= score ? colors[score] : 'bg-surface border border-border/50')} />
            ))}
        </div>
    );
}

export function InterviewFeedbackModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
    const s = candidate.interview_scores;
    if (!s) return null;
    const l1 = s.l1_feedback_json;
    const l2 = s.l2_feedback_json;
    const l1Avg = l1 ? calcAvg(l1) : null;
    const l2Avg = l2 ? calcAvg(l2) : null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={onClose} />
            <div className="bg-white rounded-sm shadow-premium w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-start bg-surface shrink-0">
                    <div>
                        <h3 className="font-bold text-heading text-xl tracking-tight italic">Interview Scorecard</h3>
                        <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-widest">{candidate.name}</p>
                        {s.decision && (
                            <span className={cn(
                                "mt-4 inline-block text-[9px] font-bold px-3 py-1 rounded-sm border uppercase tracking-widest",
                                s.decision === 'Recommended' ? "bg-primary text-white border-primary" :
                                    s.decision === 'Not Recommended' ? "bg-red-600 text-white border-red-600" :
                                        "bg-white text-muted border-border"
                            )}>
                                {s.decision}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white border border-transparent hover:border-border rounded-sm text-muted hover:text-heading transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
                    {/* Summary row */}
                    {(l1Avg !== null || l2Avg !== null) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {l1Avg !== null && (
                                <div className="bg-surface border border-border rounded-sm p-5 text-center">
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Round 01 Average</p>
                                    <p className="text-3xl font-bold text-heading italic">{l1Avg.toFixed(1)}<span className="text-sm text-muted not-italic font-normal"> / 5.0</span></p>
                                </div>
                            )}
                            {l2Avg !== null && (
                                <div className="bg-heading text-white rounded-sm p-5 text-center">
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] mb-2">Round 02 Average</p>
                                    <p className="text-3xl font-bold italic">{l2Avg.toFixed(1)}<span className="text-sm text-muted/50 not-italic font-normal"> / 5.0</span></p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Per-category breakdown */}
                    {[{ label: 'L1 Feedback Insights', fb: l1, type: 'L1' }, { label: 'L2 Feedback Insights', fb: l2, type: 'L2' }].map(({ label, fb, type }) => {
                        if (!fb) return null;
                        const isL2 = type === 'L2';
                        return (
                            <div key={label} className="space-y-4">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1">{label}</label>
                                <div className={cn("rounded-sm border p-5 space-y-6 transition-all", isL2 ? "border-heading bg-white shadow-soft" : "border-primary/10 bg-surface")}>
                                    {SCORE_CATS.map(cat => {
                                        const d = fb[cat.key];
                                        if (!d || d.score === 0) return null;
                                        return (
                                            <div key={cat.key} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-heading uppercase tracking-wide">{cat.label}</span>
                                                    <div className="flex items-center gap-3">
                                                        <ScoreBar score={d.score} />
                                                        <span className={cn("text-xs font-black w-8 text-right italic", isL2 ? "text-heading" : "text-primary")}>{d.score}.0</span>
                                                    </div>
                                                </div>
                                                {d.notes && (
                                                    <div className="pl-4 border-l-2 border-primary/20">
                                                        <p className="text-sm text-body leading-relaxed font-semibold">{d.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {fb.overall_notes && (
                                        <div className="pt-6 border-t border-border mt-4">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Synthesis & Final Notes</p>
                                            <p className="text-sm text-heading leading-relaxed font-bold italic">"{fb.overall_notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-8 bg-surface border-t border-border shrink-0 text-center">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] italic">Official Recruitment Assessment Document</p>
                </div>
            </div>
        </div>
    );
}
