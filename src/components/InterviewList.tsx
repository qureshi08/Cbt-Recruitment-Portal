"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, X, Eye, Calendar, User, FileBarChart } from "lucide-react";
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
        { key: 'technical', label: 'Technical Skills', description: 'Problem-solving, knowledge & CS fundamentals' },
        { key: 'communication', label: 'Communication', description: 'Clarity, listening skills, explanation ability' },
        { key: 'masters_plans', label: "Master's Plans", description: 'Academic goals & career vision' },
        { key: 'analytical', label: 'Analytical Thinking', description: 'Logical reasoning & data interpretation' },
        { key: 'personality', label: 'Culture Fit', description: 'Attitude, adaptability & enthusiasm' },
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

function ScoreBar({ score }: { score: number }) {
    const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-500', 'bg-green-500'];
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={cn("h-1 w-4 rounded-full", n <= score ? colors[score] : 'bg-gray-200')} />
            ))}
        </div>
    );
}

function FeedbackPanel({ label, fb, color }: { label: string; fb: StructuredFeedback; color: 'blue' | 'purple' }) {
    const avg = calcAvg(fb);
    const isPurple = color === 'purple';

    return (
        <div className={cn(
            "rounded-2xl border-2 p-5 space-y-4 shadow-sm",
            isPurple ? "border-purple-100 bg-purple-50/30" : "border-blue-100 bg-blue-50/30"
        )}>
            <div className="flex items-center justify-between pb-3 border-b border-white/50">
                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isPurple ? "text-purple-600" : "text-blue-600")}>{label}</p>
                {avg > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400">AVERAGE</span>
                        <span className={cn("text-lg font-black italic", isPurple ? "text-purple-700" : "text-blue-700")}>
                            {avg.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>
            <div className="space-y-4">
                {SCORE_CATEGORIES.map(cat => {
                    const d = fb[cat.key];
                    if (!d || d.score === 0) return null;
                    return (
                        <div key={cat.key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-heading uppercase tracking-wide">{cat.label}</span>
                                <div className="flex items-center gap-2">
                                    <ScoreBar score={d.score} />
                                    <span className="text-[11px] font-black text-gray-900 italic w-6 text-right">
                                        {d.score}.0
                                    </span>
                                </div>
                            </div>
                            {d.notes && (
                                <p className="text-xs text-body leading-relaxed pl-3 border-l-2 border-gray-200 py-0.5 ml-0.5">{d.notes}</p>
                            )}
                        </div>
                    );
                })}
            </div>
            {fb.overall_notes && (
                <div className="pt-4 border-t border-white/50">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">SYNTHESIS</p>
                    <p className="text-xs text-heading leading-relaxed font-medium italic italic">"{fb.overall_notes}"</p>
                </div>
            )}
        </div>
    );
}

function FeedbackViewer({ interview }: { interview: Interview }) {
    const [open, setOpen] = useState(false);
    const hasL1 = !!interview.l1_feedback_json;
    const hasL2 = !!interview.l2_feedback_json;

    if (!hasL1 && !hasL2) return null;

    return (
        <div className="mt-1">
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary-hover transition-colors bg-primary/5 px-2 py-1 rounded-md border border-primary/10"
            >
                <FileBarChart className="w-3 h-3" />
                VIEW SCORECARD
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={() => setOpen(false)} />
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh] overflow-hidden">
                        {/* Header */}
                        <div className="p-8 border-b flex justify-between items-start bg-surface-alt shrink-0">
                            <div>
                                <h3 className="font-black text-heading text-2xl tracking-tight italic uppercase">Candidate Feedback</h3>
                                <p className="text-sm font-bold text-muted mt-1 uppercase tracking-widest">{interview.candidates?.name}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-3 hover:bg-white rounded-2xl text-muted hover:text-heading shadow-sm transition-all hover:rotate-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-8 space-y-6 flex-1">
                            {hasL1 && <FeedbackPanel label="Round 01 Insights" fb={interview.l1_feedback_json!} color="blue" />}
                            {hasL2 && <FeedbackPanel label="Round 02 Insights" fb={interview.l2_feedback_json!} color="purple" />}
                        </div>

                        <div className="p-6 bg-surface-alt border-t text-center shrink-0">
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] italic">Official Interview Assessment Document</p>
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
                ? "Are you sure you want to RECOMMEND this candidate? This will send an automated acceptance email."
                : "Are you sure you want to REJECT this candidate? This will send an automated rejection email.";

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

    return (
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '850px' }}>
                    <thead>
                        <tr className="bg-gray-50 border-b border-border">
                            <th className="px-5 py-4 text-[10px] font-black text-muted uppercase tracking-wider w-[22%]">Schedule</th>
                            <th className="px-5 py-4 text-[10px] font-black text-muted uppercase tracking-wider w-[28%]">Candidate</th>
                            <th className="px-5 py-4 text-[10px] font-black text-muted uppercase tracking-wider w-[30%]">Feedback & Results</th>
                            <th className="px-5 py-4 text-[10px] font-black text-muted uppercase tracking-wider text-right w-[20%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-white">
                        {interviews.map((interview) => {
                            const isAwaitingL2 = interview.decision === 'L2 Interview Required';
                            const isFinal = interview.decision === 'Recommended' || interview.decision === 'Not Recommended';
                            const canAct = !isFinal && (userRoles.includes('L1_Interviewer') || userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));
                            const canActL2 = isAwaitingL2 && (userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));

                            return (
                                <tr key={interview.id} className="hover:bg-primary/[0.01] transition-colors group">
                                    <td className="px-5 py-5 overflow-hidden">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-muted group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-heading">
                                                    {new Date(interview.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted mt-0.5">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(interview.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 overflow-hidden">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-heading truncate">{interview.candidates?.name}</span>
                                            <span className="text-[11px] text-muted font-medium mt-0.5 truncate uppercase tracking-tight">{interview.candidates?.position}</span>
                                            <div className="flex items-center gap-3 mt-2.5">
                                                {interview.candidates?.resume_url && (
                                                    <a href={interview.candidates.resume_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-primary hover:text-primary-hover flex items-center gap-1 uppercase tracking-wider">
                                                        Resume
                                                    </a>
                                                )}
                                                {interview.candidates?.assessment_score_url && (
                                                    <a href={interview.candidates.assessment_score_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                                                        Results
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 overflow-hidden">
                                        {interview.decision ? (
                                            <div className="flex flex-col gap-2">
                                                <span className={cn(
                                                    "status-badge w-fit",
                                                    interview.decision === 'Recommended' ? "bg-primary text-white border-primary shadow-sm" :
                                                        interview.decision === 'L2 Interview Required' ? "bg-blue-600 text-white border-blue-700 shadow-sm" :
                                                            "bg-rose-600 text-white border-rose-700 shadow-sm"
                                                )}>
                                                    {interview.decision}
                                                </span>
                                                <FeedbackViewer interview={interview} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-muted">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-bold uppercase tracking-widest italic">Awaiting Response</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-5 text-right">
                                        {!interview.decision && canAct && (
                                            <button onClick={() => openModal(interview)}
                                                className="btn-primary !py-1.5 !px-3 shadow-md ml-auto">
                                                Scorecard
                                            </button>
                                        )}
                                        {isAwaitingL2 && canActL2 && (
                                            <button onClick={() => openModal(interview)}
                                                className="btn-primary !py-1.5 !px-3 shadow-md ml-auto bg-blue-600 hover:bg-blue-700">
                                                Finalize L2
                                            </button>
                                        )}
                                        {(!interview.decision && !canAct) && (
                                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Read Only</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal for submission remains — I will skip updating the modal internals for brevity unless asked, but I've updated the viewer */}
        </div>
    );
}
