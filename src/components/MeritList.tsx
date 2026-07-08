"use client";

import { useMemo, useState } from "react";
import { Candidate } from "@/types/database";
import { UserRole, sendCandidateSelectionEmail, updateCandidate, updateCandidateJoiningStatus } from "@/app/actions";
import { withLoading } from "@/lib/loading";
import { cn } from "@/lib/utils";
import { Send, CheckCircle2, XCircle, HelpCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { calcAvg, ScoreBar, InterviewFeedbackModal } from "@/components/InterviewScorecard";

type JoiningStatus = 'Confirmed' | 'Declined' | 'No Response';

interface MeritListProps {
    initialCandidates: Candidate[];
    userRoles: UserRole[];
}

// Blended L1/L2 interview average on the same 0-5 scale calcAvg produces.
// Used purely as the DEFAULT sort key before a human sets an explicit rank —
// never blended into a hidden composite with the AI resume score, so what
// HR sees driving the order is always transparent.
function overallInterviewAvg(candidate: Candidate): number {
    const s = candidate.interview_scores;
    if (!s) return 0;
    const l1 = s.l1_feedback_json ? calcAvg(s.l1_feedback_json) : null;
    const l2 = s.l2_feedback_json ? calcAvg(s.l2_feedback_json) : null;
    if (l1 !== null && l2 !== null) return (l1 + l2) / 2;
    return l1 ?? l2 ?? 0;
}

function sortForMerit(a: Candidate, b: Candidate): number {
    const rankA = a.merit_rank ?? Infinity;
    const rankB = b.merit_rank ?? Infinity;
    if (rankA !== rankB) return rankA - rankB;
    return overallInterviewAvg(b) - overallInterviewAvg(a);
}

const JOINING_STATUS_META: Record<JoiningStatus, { label: string; icon: typeof CheckCircle2; activeClass: string }> = {
    Confirmed: { label: "Confirmed", icon: CheckCircle2, activeClass: "bg-emerald-700 text-white border-emerald-800" },
    Declined: { label: "Declined", icon: XCircle, activeClass: "bg-red-600 text-white border-red-700" },
    "No Response": { label: "No Response", icon: HelpCircle, activeClass: "bg-amber-500 text-white border-amber-600" },
};

export default function MeritList({ initialCandidates, userRoles }: MeritListProps) {
    const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
    const [sendingSelectionId, setSendingSelectionId] = useState<string | null>(null);
    const [selectedInterviewScores, setSelectedInterviewScores] = useState<Candidate | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isMaster = userRoles.includes('Master');
    const isHR = userRoles.includes('HR');
    const canEdit = isMaster || isHR;

    const recommended = useMemo(
        () => candidates.filter(c => c.status === 'Recommended').sort(sortForMerit),
        [candidates]
    );
    const selected = useMemo(
        () => candidates.filter(c => c.status === 'Selected').sort(sortForMerit),
        [candidates]
    );

    const nextInLine = recommended[0] ?? null;
    const hasOpenSeat = selected.some(c => c.joining_status === 'Declined' || c.joining_status === 'No Response');

    const handleRankBlur = async (candidate: Candidate, value: string) => {
        const trimmed = value.trim();
        const newRank = trimmed === '' ? null : Number(trimmed);
        if (newRank !== null && (!Number.isFinite(newRank) || newRank < 0)) {
            setError('Rank must be a positive number.');
            return;
        }
        if (newRank === (candidate.merit_rank ?? null)) return;
        const result = await withLoading(() => updateCandidate(candidate.id, { merit_rank: newRank }));
        if (result.error) {
            setError('Failed to save rank: ' + result.error);
            return;
        }
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, merit_rank: newRank } : c));
    };

    const handleRemarksBlur = async (candidate: Candidate, value: string) => {
        const newRemarks = value.trim() || null;
        if (newRemarks === (candidate.remarks ?? null)) return;
        const result = await withLoading(() => updateCandidate(candidate.id, { remarks: newRemarks }));
        if (result.error) {
            setError('Failed to save remarks: ' + result.error);
            return;
        }
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, remarks: newRemarks } : c));
    };

    const handleSelect = async (candidate: Candidate) => {
        if (!window.confirm(
            `Send the final "Welcome to CGAP!" selection email to ${candidate.name}?\n\n` +
            'This will update their status to SELECTED and notify them that they have been chosen for the program.'
        )) return;
        setSendingSelectionId(candidate.id);
        const result = await withLoading(() => sendCandidateSelectionEmail(candidate.id));
        setSendingSelectionId(null);
        if (result.success) {
            setCandidates(prev => prev.map(c => c.id === candidate.id
                ? { ...c, status: 'Selected', last_action_by: result.last_action_by }
                : c
            ));
        } else {
            setError('Failed to send selection email: ' + result.error);
        }
    };

    const handleJoiningStatus = async (candidate: Candidate, status: JoiningStatus | null) => {
        const result = await withLoading(() => updateCandidateJoiningStatus(candidate.id, status));
        if (result.error) {
            setError('Failed to update joining status: ' + result.error);
            return;
        }
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, joining_status: status } : c));
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            {/* ─── Merit List (Recommended) ─────────────────────────────── */}
            <div className="rounded-sm border border-border bg-white shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-heading tracking-tight italic">Merit List</h2>
                        <p className="text-[11px] text-muted mt-0.5">Recommended candidates awaiting final selection · {recommended.length} candidate{recommended.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '900px' }}>
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[8%]">Rank</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[22%]">Candidate</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[10%]">AI Score</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[16%]">Interview Avg</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[28%]">Remarks</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] text-right w-[16%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 bg-white">
                            {recommended.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-muted">
                                        No recommended candidates right now.
                                    </td>
                                </tr>
                            ) : recommended.map(candidate => {
                                const l1 = candidate.interview_scores?.l1_feedback_json;
                                const l2 = candidate.interview_scores?.l2_feedback_json;
                                const avg = overallInterviewAvg(candidate);
                                const hasScores = !!(l1 || l2);
                                const isNextInLine = hasOpenSeat && candidate.id === nextInLine?.id;
                                return (
                                    <tr key={candidate.id} className={cn("hover:bg-primary/[0.02] transition-colors", isNextInLine && "bg-amber-50/60")}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min={0}
                                                defaultValue={candidate.merit_rank ?? ''}
                                                onBlur={e => handleRankBlur(candidate, e.target.value)}
                                                disabled={!canEdit}
                                                placeholder="—"
                                                className="w-16 px-2 py-1.5 text-[12px] font-bold text-center border border-border rounded-sm focus:border-primary outline-none disabled:bg-surface disabled:text-muted"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[12.5px] font-bold text-heading">{candidate.name}</p>
                                            <p className="text-[10.5px] text-muted">{candidate.email}</p>
                                            {isNextInLine && (
                                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
                                                    <AlertTriangle className="w-3 h-3" /> Next in line
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[12px] font-bold text-heading">{candidate.ai_score != null ? candidate.ai_score : '—'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {hasScores ? (
                                                <button
                                                    onClick={() => setSelectedInterviewScores(candidate)}
                                                    className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                                                    title="View full interview scorecard"
                                                >
                                                    <ScoreBar score={Math.round(avg)} />
                                                    <span className="text-[10px] font-black text-heading">{avg.toFixed(1)}</span>
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-muted">No scores yet</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                defaultValue={candidate.remarks ?? ''}
                                                onBlur={e => handleRemarksBlur(candidate, e.target.value)}
                                                disabled={!canEdit}
                                                placeholder="Add a remark…"
                                                className="w-full px-2.5 py-1.5 text-[11.5px] border border-border rounded-sm focus:border-primary outline-none disabled:bg-surface disabled:text-muted"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleSelect(candidate)}
                                                    disabled={sendingSelectionId === candidate.id}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 border border-emerald-800 text-white text-[10.5px] font-bold rounded-sm shadow-soft hover:bg-emerald-800 transition-colors disabled:opacity-60"
                                                    title="Send final selection email and mark as Selected"
                                                >
                                                    {sendingSelectionId === candidate.id ? (
                                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Send className="w-3 h-3" />
                                                    )}
                                                    <span>Select</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Selected — Joining Status ────────────────────────────── */}
            <div className="rounded-sm border border-border bg-white shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-heading tracking-tight italic">Selected — Joining Status</h2>
                        <p className="text-[11px] text-muted mt-0.5">Track who&apos;s actually confirmed · {selected.length} candidate{selected.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {hasOpenSeat && nextInLine && (
                    <div className="mx-5 mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11.5px] text-amber-900 font-semibold leading-relaxed">
                            A seat may be open — next in line on the Merit List is <strong>{nextInLine.name}</strong>
                            {nextInLine.merit_rank != null ? ` (Rank #${nextInLine.merit_rank})` : ''}. Use the Select button above to send them the offer.
                        </p>
                    </div>
                )}

                <div className="overflow-x-auto custom-scrollbar mt-2">
                    <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '900px' }}>
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[8%]">Rank</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[24%]">Candidate</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[36%]">Joining Status</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[32%]">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 bg-white">
                            {selected.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-[12px] text-muted">
                                        No candidates selected yet.
                                    </td>
                                </tr>
                            ) : selected.map(candidate => (
                                <tr key={candidate.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="text-[12px] font-bold text-heading">{candidate.merit_rank ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-[12.5px] font-bold text-heading">{candidate.name}</p>
                                        <p className="text-[10.5px] text-muted">{candidate.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {(Object.keys(JOINING_STATUS_META) as JoiningStatus[]).map(status => {
                                                const meta = JOINING_STATUS_META[status];
                                                const Icon = meta.icon;
                                                const active = candidate.joining_status === status;
                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleJoiningStatus(candidate, active ? null : status)}
                                                        disabled={!canEdit}
                                                        className={cn(
                                                            "inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-sm border transition-colors disabled:opacity-50",
                                                            active ? meta.activeClass : "bg-white text-muted border-border hover:border-heading/30"
                                                        )}
                                                        title={active ? `Clear (currently ${meta.label})` : `Mark as ${meta.label}`}
                                                    >
                                                        <Icon className="w-3 h-3" />
                                                        <span>{meta.label}</span>
                                                    </button>
                                                );
                                            })}
                                            {candidate.joining_status && canEdit && (
                                                <button
                                                    onClick={() => handleJoiningStatus(candidate, null)}
                                                    className="p-1.5 text-muted hover:text-heading transition-colors"
                                                    title="Reset to awaiting contact"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                </button>
                                            )}
                                            {!candidate.joining_status && (
                                                <span className="text-[10px] text-muted italic ml-1">Awaiting contact</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            defaultValue={candidate.remarks ?? ''}
                                            onBlur={e => handleRemarksBlur(candidate, e.target.value)}
                                            disabled={!canEdit}
                                            placeholder="Add a remark…"
                                            className="w-full px-2.5 py-1.5 text-[11.5px] border border-border rounded-sm focus:border-primary outline-none disabled:bg-surface disabled:text-muted"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedInterviewScores && (
                <InterviewFeedbackModal
                    candidate={selectedInterviewScores}
                    onClose={() => setSelectedInterviewScores(null)}
                />
            )}
        </div>
    );
}
