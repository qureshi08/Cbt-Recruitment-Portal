"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, X, Eye, Calendar, User, FileText, Star, Activity, Send, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole, requestL2Interview, submitFinalInterviewFeedback } from "@/app/actions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoreCategory {
    score: number; // 1-5
    notes: string;
}

interface StructuredFeedback {
    technical: ScoreCategory;
    communication: ScoreCategory;
    masters_plans: ScoreCategory;
    analytical: ScoreCategory;
    personality: ScoreCategory;
    overall_notes: string;
}

interface Interview {
    id: string;
    candidate_id: string;
    scheduled_at: string;
    decision?: string | null;
    feedback?: string | null;
    l1_feedback_json?: StructuredFeedback | null;
    l2_feedback_json?: StructuredFeedback | null;
    candidates?: {
        name: string;
        position: string;
        resume_url?: string;
        assessment_score_url?: string;
    } | null;
}

interface InterviewListProps {
    initialInterviews: Interview[];
    userRoles: UserRole[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORE_CATEGORIES: {
    key: keyof Omit<StructuredFeedback, 'overall_notes'>;
    label: string;
    description: string;
}[] = [
        { key: 'technical', label: 'Technical Depth', description: 'Subject matter expertise & problem-solving' },
        { key: 'communication', label: 'Communication', description: 'Clarity, articulation & structural thinking' },
        { key: 'masters_plans', label: "Graduate Ambition", description: 'Academic goals & professional trajectory' },
        { key: 'analytical', label: 'Analytical Reasoning', description: 'Data-driven mindset & logical deduction' },
        { key: 'personality', label: 'Culture Alignment', description: 'Attitude, adaptability & institutional fit' },
    ];

const emptyFeedback = (): StructuredFeedback => ({
    technical: { score: 0, notes: '' },
    communication: { score: 0, notes: '' },
    masters_plans: { score: 0, notes: '' },
    analytical: { score: 0, notes: '' },
    personality: { score: 0, notes: '' },
    overall_notes: '',
});

function calcAvg(fb: StructuredFeedback): number {
    const scores = SCORE_CATEGORIES.map(c => fb[c.key].score).filter(s => s > 0);
    if (!scores.length) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreDots({ score }: { score: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <div
                    key={n}
                    className={cn(
                        "h-1.5 w-4 rounded-full transition-all duration-300",
                        n <= score ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                    )}
                />
            ))}
        </div>
    );
}

function FeedbackSection({ label, fb, type }: { label: string; fb: StructuredFeedback; type: 'first' | 'second' }) {
    const avg = calcAvg(fb);
    const isSecond = type === 'second';

    return (
        <div className={cn(
            "rounded-sm border p-5 space-y-4 bg-white shadow-soft",
            isSecond ? "border-indigo-100" : "border-border"
        )}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--surface)]">
                <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">{label}</p>
                {avg > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Average Score</span>
                        <span className="text-lg font-bold text-[var(--heading)]">{avg.toFixed(1)}</span>
                    </div>
                )}
            </div>
            <div className="space-y-4">
                {SCORE_CATEGORIES.map(cat => {
                    const d = fb[cat.key];
                    if (!d || d.score === 0) return null;
                    return (
                        <div key={cat.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--heading)]">{cat.label}</span>
                                <div className="flex items-center gap-3">
                                    <ScoreDots score={d.score} />
                                    <span className="text-xs font-bold text-[var(--heading)]">{d.score}</span>
                                </div>
                            </div>
                            {d.notes && (
                                <p className="text-xs text-[var(--body)] border-l-2 border-[var(--border)] pl-3 ml-0.5 py-0.5">{d.notes}</p>
                            )}
                        </div>
                    );
                })}
            </div>
            {fb.overall_notes && (
                <div className="pt-3 border-t border-[var(--surface)]">
                    <p className="text-[10px] font-bold text-[var(--muted)] uppercase mb-1">Interviewer Synthesis</p>
                    <p className="text-sm text-[var(--heading)] italic leading-relaxed">"{fb.overall_notes}"</p>
                </div>
            )}
        </div>
    );
}

function ScorecardViewer({ interview }: { interview: Interview }) {
    const [open, setOpen] = useState(false);
    const hasL1 = !!interview.l1_feedback_json;
    const hasL2 = !!interview.l2_feedback_json;

    if (!hasL1 && !hasL2) return null;

    return (
        <div className="mt-1">
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 text-[10px] font-bold text-primary hover:text-primary-hover transition-all bg-surface px-3 py-1 rounded-sm border border-border uppercase tracking-widest"
            >
                <FileText className="w-3 h-3" />
                Registry Scorecard
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-heading/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="bg-white rounded-sm shadow-premium w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] overflow-hidden">

                        <div className="p-5 border-b border-border flex justify-between items-center shrink-0 bg-surface">
                            <div>
                                <h3 className="font-bold text-lg text-heading italic">Evaluation Dossier</h3>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">{interview.candidates?.name} — {interview.candidates?.position}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 border border-transparent hover:border-border hover:bg-white rounded-sm text-muted hover:text-heading transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-white">
                            {hasL1 && <FeedbackSection label="First Evaluation Pass" fb={interview.l1_feedback_json!} type="first" />}
                            {hasL2 && <FeedbackSection label="Final Round Insights" fb={interview.l2_feedback_json!} type="second" />}
                        </div>

                        <div className="p-4 border-t bg-white text-center shrink-0">
                            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Confidential Recruitment Record</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewList({ initialInterviews, userRoles }: InterviewListProps) {
    const [interviews, setInterviews] = useState(initialInterviews);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<StructuredFeedback>(emptyFeedback());

    const isL2Round = !!selectedInterview?.decision && selectedInterview.decision === 'L2 Interview Required';

    const openModal = (interview: Interview) => {
        setFeedback(emptyFeedback());
        setSelectedInterview(interview);
    };

    const handleDecision = async (decision: 'Recommended' | 'Not Recommended' | 'L2 Interview Required') => {
        if (!selectedInterview) return;

        if (decision === 'Recommended' || decision === 'Not Recommended') {
            const confirmMsg = decision === 'Recommended'
                ? "Are you sure you want to RECOMMEND this candidate? This will trigger the final acceptance process."
                : "Are you sure you want to mark this candidate as NOT RECOMMENDED? This will conclude their application process.";

            if (!window.confirm(confirmMsg)) return;
        }

        setIsSubmitting(true);
        try {
            const legacyText = SCORE_CATEGORIES.map(cat => {
                const d = feedback[cat.key];
                return `${cat.label}: ${d.score}/5${d.notes ? ` — ${d.notes}` : ''}`;
            }).join('\n') + (feedback.overall_notes ? `\nOverall: ${feedback.overall_notes}` : '');

            if (decision === 'L2 Interview Required') {
                const result = await requestL2Interview(selectedInterview.id, selectedInterview.candidate_id, legacyText, feedback as any);
                if (result.error) throw new Error(result.error);
                setInterviews(prev => prev.map(i => i.id === selectedInterview.id ? { ...i, decision: 'L2 Interview Required', l1_feedback_json: feedback } : i));
            } else {
                const round = isL2Round ? 'L2' : 'L1';
                const finalFeedbackText = isL2Round ? (selectedInterview.feedback ? `${selectedInterview.feedback}\nL2: ${legacyText}` : `L2: ${legacyText}`) : legacyText;
                const result = await submitFinalInterviewFeedback(selectedInterview.id, selectedInterview.candidate_id, decision, finalFeedbackText, feedback as any, round);
                if (result.error) throw new Error(result.error);
                setInterviews(prev => prev.map(i => i.id === selectedInterview.id ? { ...i, decision, [round === 'L1' ? 'l1_feedback_json' : 'l2_feedback_json']: feedback } : i));
            }
            setSelectedInterview(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateScore = (key: keyof Omit<StructuredFeedback, 'overall_notes'>, val: number) => {
        setFeedback(prev => ({
            ...prev,
            [key]: { ...prev[key], score: val }
        }));
    };

    const updateNotes = (key: keyof Omit<StructuredFeedback, 'overall_notes'>, val: string) => {
        setFeedback(prev => ({
            ...prev,
            [key]: { ...prev[key], notes: val }
        }));
    };

    return (
        <div className="bg-white border border-border rounded-sm shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '900px' }}>
                    <thead>
                        <tr className="bg-surface border-b border-border">
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[22%]">Scheduled</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[28%]">Candidate</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[30%]">Interview Status</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] text-right w-[20%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/50">
                        {interviews.map((interview) => {
                            const isAwaitingL2 = interview.decision === 'L2 Interview Required';
                            const isFinal = interview.decision === 'Recommended' || interview.decision === 'Not Recommended';
                            const canAct = !isFinal && (userRoles.includes('L1_Interviewer') || userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));
                            const canActL2 = isAwaitingL2 && (userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));

                            return (
                                <tr key={interview.id} className="hover:bg-[var(--surface)] transition-colors group">
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[var(--heading)]">
                                                {new Date(interview.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[11px] text-[var(--muted)] font-medium mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(interview.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-[var(--heading)] truncate">{interview.candidates?.name}</span>
                                            <span className="text-xs text-[var(--muted)] mt-0.5 truncate">{interview.candidates?.position}</span>
                                            <div className="flex items-center gap-4 mt-2">
                                                {interview.candidates?.resume_url && (
                                                    <a href={interview.candidates.resume_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1.5 uppercase tracking-wide">
                                                        Resume
                                                    </a>
                                                )}
                                                {interview.candidates?.assessment_score_url && (
                                                    <a href={interview.candidates.assessment_score_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1.5 uppercase tracking-wide">
                                                        Results
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        {interview.decision ? (
                                            <div className="flex flex-col gap-2">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest w-fit border",
                                                    interview.decision === 'Recommended' ? "bg-primary text-white border-primary" :
                                                        interview.decision === 'L2 Interview Required' ? "bg-indigo-600 text-white border-indigo-700" :
                                                            "bg-red-600 text-white border-red-700"
                                                )}>
                                                    {interview.decision}
                                                </span>
                                                <ScorecardViewer interview={interview} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-muted bg-surface px-3 py-1.5 rounded-sm w-fit border border-border">
                                                <Activity className="w-3 h-3 animate-pulse text-primary" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Registry Response</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right align-top">
                                        {!interview.decision && canAct && (
                                            <button onClick={() => openModal(interview)}
                                                className="bg-primary text-white px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-primary-hover transition-all w-full md:w-auto shadow-sm">
                                                Add Evaluation
                                            </button>
                                        )}
                                        {isAwaitingL2 && canActL2 && (
                                            <button onClick={() => openModal(interview)}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all w-full md:w-auto shadow-sm">
                                                Finalize L2
                                            </button>
                                        )}
                                        {(!interview.decision && !canAct) && (
                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-muted uppercase tracking-[0.2em] italic">
                                                Registry Lock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Assessment Modal */}
            {selectedInterview && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-[var(--heading)]/60 backdrop-blur-sm" onClick={() => setSelectedInterview(null)} />
                    <div className="bg-white rounded-sm shadow-premium w-full max-w-4xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] overflow-hidden">

                        <div className="p-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
                            <div>
                                <h2 className="font-bold text-xl text-heading italic">Candidate Evaluation</h2>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">{selectedInterview.candidates?.name} — {selectedInterview.candidates?.position}</p>
                            </div>
                            <button onClick={() => setSelectedInterview(null)} className="p-2 border border-transparent hover:border-border hover:bg-white rounded-sm text-muted hover:text-heading transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 flex-1 space-y-6 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SCORE_CATEGORIES.map((cat) => (
                                    <div key={cat.key} className="bg-surface p-5 rounded-sm border border-border shadow-soft space-y-4">
                                        <div className="flex flex-col gap-0.5">
                                            <h4 className="text-[11px] font-bold text-heading uppercase tracking-widest">{cat.label}</h4>
                                            <p className="text-[9px] text-muted font-medium">{cat.description}</p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => updateScore(cat.key, n)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-sm font-bold text-xs transition-all border",
                                                        feedback[cat.key].score === n
                                                            ? "bg-primary text-white border-primary"
                                                            : "bg-white text-muted border-border hover:border-primary"
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            className="w-full bg-white border border-border rounded-sm p-3 text-xs font-medium placeholder:text-muted resize-none focus:border-primary outline-none transition-colors"
                                            rows={2}
                                            placeholder={`Notes for ${cat.label.toLowerCase()}...`}
                                            value={feedback[cat.key].notes}
                                            onChange={(e) => updateNotes(cat.key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-surface p-5 rounded-sm border border-border shadow-soft space-y-3">
                                <h4 className="text-[11px] font-bold text-heading flex items-center gap-2 uppercase tracking-widest">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    Final Recommendation Synthesis
                                </h4>
                                <textarea
                                    className="w-full bg-white border border-border rounded-sm p-4 text-xs font-medium placeholder:text-muted focus:border-primary outline-none transition-colors"
                                    rows={3}
                                    placeholder="Provide holistic summary..."
                                    value={feedback.overall_notes}
                                    onChange={(e) => setFeedback(prev => ({ ...prev, overall_notes: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-surface flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-sm border border-border shadow-soft">
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] block mb-1">Average Performance</span>
                                    <span className="text-xl font-bold text-heading italic leading-none">{calcAvg(feedback).toFixed(1)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isL2Round ? (
                                    <button
                                        onClick={() => handleDecision('Recommended')}
                                        disabled={isSubmitting || calcAvg(feedback) === 0}
                                        className="bg-primary text-white border border-primary-hover px-6 py-3 rounded-sm text-[11px] font-bold uppercase tracking-widest shadow-md hover:scale-105 transition-all"
                                    >
                                        Finalize Selection
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleDecision('Not Recommended')}
                                            disabled={isSubmitting || calcAvg(feedback) === 0}
                                            className="px-5 py-3 rounded-sm border border-border bg-white text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleDecision('L2 Interview Required')}
                                            disabled={isSubmitting || calcAvg(feedback) === 0}
                                            className="px-5 py-3 rounded-sm border border-border bg-white text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all"
                                        >
                                            Request L2
                                        </button>
                                        <button
                                            onClick={() => handleDecision('Recommended')}
                                            disabled={isSubmitting || calcAvg(feedback) === 0}
                                            className="bg-primary text-white border border-primary-hover px-5 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-105 transition-all"
                                        >
                                            Recommend
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
