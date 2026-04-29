"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, X, Eye, Calendar, User, FileBarChart, Star, Activity, Plus, Minus, Send, AlertCircle, Shield } from "lucide-react";
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
        { key: 'technical', label: 'Technical Proficiency', description: 'Systems architecture & logical foundation' },
        { key: 'communication', label: 'Linguistic Clarity', description: 'Persuasion, articulation & structure' },
        { key: 'masters_plans', label: "Strategic Intent", description: 'Academic trajectory & career alignment' },
        { key: 'analytical', label: 'Cognitive Agility', description: 'First-principles thinking & reasoning' },
        { key: 'personality', label: 'Professional Ethos', description: 'Cultural resonance & resilience' },
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
    const colors = ['', 'bg-rose-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500', 'bg-primary'];
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={cn("h-1.5 w-5 rounded-full transition-all", n <= score ? colors[score] : 'bg-gray-100')} />
            ))}
        </div>
    );
}

function FeedbackPanel({ label, fb, color }: { label: string; fb: StructuredFeedback; color: 'blue' | 'purple' }) {
    const avg = calcAvg(fb);
    const isPurple = color === 'purple';

    return (
        <div className={cn(
            "rounded-3xl border-2 p-6 space-y-5 transition-all hover:shadow-lg",
            isPurple ? "border-purple-100 bg-purple-50/20" : "border-blue-100 bg-blue-50/20"
        )}>
            <div className="flex items-center justify-between pb-4 border-b border-white/60">
                <p className={cn("text-[10px] font-black uppercase tracking-[0.25em]", isPurple ? "text-purple-600" : "text-blue-600")}>{label}</p>
                {avg > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Composite Score</span>
                        <div className={cn("px-4 py-1 rounded-full text-white font-black italic shadow-sm", isPurple ? "bg-purple-600" : "bg-blue-600")}>
                            {avg.toFixed(1)}
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {SCORE_CATEGORIES.map(cat => {
                    const d = fb[cat.key];
                    if (!d || d.score === 0) return null;
                    return (
                        <div key={cat.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-heading uppercase tracking-tight">{cat.label}</span>
                                <div className="flex items-center gap-3">
                                    <ScoreBar score={d.score} />
                                    <span className="text-[12px] font-black italic text-gray-900 w-6 text-right">
                                        {d.score}.0
                                    </span>
                                </div>
                            </div>
                            {d.notes && (
                                <p className="text-xs text-body leading-relaxed pl-4 border-l-2 border-gray-200 font-medium italic">"{d.notes}"</p>
                            )}
                        </div>
                    );
                })}
            </div>
            {fb.overall_notes && (
                <div className="pt-5 border-t border-white/60">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Final Executive Summary</p>
                    <p className="text-sm text-heading leading-relaxed font-bold italic bg-white/40 p-4 rounded-2xl border border-white/60">"{fb.overall_notes}"</p>
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
                className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-primary-hover transition-all bg-primary/[0.03] px-3 py-1.5 rounded-xl border border-primary/10 uppercase tracking-widest shadow-sm hover:shadow-md"
            >
                <FileBarChart className="w-3.5 h-3.5" />
                Dossier Analysis
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={() => setOpen(false)} />
                    <div className="bg-white rounded-[2.5rem] shadow-[0_32px_128px_rgba(0,0,0,0.15)] w-full max-w-3xl relative z-10 animate-in fade-in zoom-in duration-500 flex flex-col max-h-[90vh] overflow-hidden">

                        <div className="p-10 border-b flex justify-between items-start bg-surface-alt shrink-0">
                            <div className="space-y-1">
                                <h3 className="font-black text-heading text-3xl tracking-tighter italic uppercase underline decoration-primary/20 decoration-8 underline-offset-4">Candidate Scorecard</h3>
                                <div className="flex items-center gap-3">
                                    <p className="text-[10px] font-black text-muted mt-2 uppercase tracking-[0.3em]">{interview.candidates?.name}</p>
                                    <div className="h-px w-8 bg-gray-200 self-end mb-1" />
                                    <p className="text-[10px] font-black text-primary mt-2 uppercase tracking-[0.3em]">{interview.candidates?.position}</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-4 bg-white rounded-2xl text-muted hover:text-heading shadow-sm transition-all hover:rotate-90 border border-border/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-10 space-y-8 flex-1 scrollbar-hide">
                            {hasL1 && <FeedbackPanel label="Phase 01 Assessment — Initial Evaluation" fb={interview.l1_feedback_json!} color="blue" />}
                            {hasL2 && <FeedbackPanel label="Phase 02 Assessment — Advanced Scrutiny" fb={interview.l2_feedback_json!} color="purple" />}
                        </div>

                        <div className="p-8 bg-surface-alt border-t flex items-center justify-center gap-6 shrink-0 opacity-40 grayscale">
                            <div className="h-0.5 w-12 bg-gray-300" />
                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.4em] italic leading-none">Confidential Recruitment Protocol</p>
                            <div className="h-0.5 w-12 bg-gray-300" />
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
                ? "EXECUTIVE AUTHORIZATION: Confirm RECOMMENDATION for this candidate? This will trigger a formal acceptance package."
                : "EXECUTIVE AUTHORIZATION: Confirm REJECTION? This will transmit an automated termination of application.";

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
        <div className="rounded-[2.5rem] border border-border/60 bg-white shadow-premium overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '950px' }}>
                    <thead>
                        <tr className="bg-surface-alt border-b border-border/50">
                            <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.25em] w-[20%]">Timestamp</th>
                            <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.25em] w-[28%]">Profile Identity</th>
                            <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.25em] w-[32%]">Assessement Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-muted uppercase tracking-[0.25em] text-right w-[20%]">Executive Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-white">
                        {interviews.map((interview) => {
                            const isAwaitingL2 = interview.decision === 'L2 Interview Required';
                            const isFinal = interview.decision === 'Recommended' || interview.decision === 'Not Recommended';
                            const canAct = !isFinal && (userRoles.includes('L1_Interviewer') || userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));
                            const canActL2 = isAwaitingL2 && (userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));

                            return (
                                <tr key={interview.id} className="hover:bg-primary/[0.01] transition-all group">
                                    <td className="px-8 py-6 overflow-hidden">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm border border-border/20">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-heading italic">
                                                    {new Date(interview.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted mt-1 uppercase tracking-tighter">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(interview.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 overflow-hidden">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-black text-heading truncate uppercase tracking-tight italic">{interview.candidates?.name}</span>
                                            <span className="text-[10px] text-muted font-bold mt-1.5 truncate uppercase tracking-widest">{interview.candidates?.position}</span>
                                            <div className="flex items-center gap-4 mt-3">
                                                {interview.candidates?.resume_url && (
                                                    <a href={interview.candidates.resume_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-primary hover:scale-105 transition-transform flex items-center gap-1.5 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                                                        CV ACCESS
                                                    </a>
                                                )}
                                                {interview.candidates?.assessment_score_url && (
                                                    <a href={interview.candidates.assessment_score_url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[9px] font-black text-blue-600 hover:scale-105 transition-transform flex items-center gap-1.5 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">
                                                        SCORE CARD
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 overflow-hidden">
                                        {interview.decision ? (
                                            <div className="flex flex-col gap-3">
                                                <div className={cn(
                                                    "inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm w-fit",
                                                    interview.decision === 'Recommended' ? "bg-emerald-500 text-white border border-emerald-600" :
                                                        interview.decision === 'L2 Interview Required' ? "bg-indigo-600 text-white border border-indigo-700" :
                                                            "bg-rose-600 text-white border border-rose-700"
                                                )}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse" />
                                                    {interview.decision}
                                                </div>
                                                <FeedbackViewer interview={interview} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-muted">
                                                <Activity className="w-4 h-4 opacity-30 animate-pulse text-primary" />
                                                <span className="text-[11px] font-black uppercase tracking-[0.25em] italic opacity-60">Pending Evaluation</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {!interview.decision && canAct && (
                                            <button onClick={() => openModal(interview)}
                                                className="btn-primary !px-5 !py-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
                                                INITIALIZE SCORECARD
                                            </button>
                                        )}
                                        {isAwaitingL2 && canActL2 && (
                                            <button onClick={() => openModal(interview)}
                                                className="btn-primary !px-5 !py-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                                                FINALIZE L2 PROTOCOL
                                            </button>
                                        )}
                                        {(!interview.decision && !canAct) && (
                                            <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-muted uppercase tracking-[0.2em] bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                <Shield className="w-3 h-3" />
                                                Restricted
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Scorecard Input Modal */}
            {selectedInterview && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={() => setSelectedInterview(null)} />
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl relative z-10 animate-in fade-in zoom-in duration-500 flex flex-col max-h-[95vh] overflow-hidden">

                        <div className="p-10 border-b flex justify-between items-start bg-surface-alt shrink-0">
                            <div>
                                <h3 className="font-black text-heading text-3xl tracking-tighter italic uppercase underline decoration-primary/20 decoration-8 underline-offset-4">Evaluation Terminal</h3>
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="bg-white px-4 py-1.5 rounded-2xl border border-border/50 shadow-sm flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-black text-heading uppercase tracking-tight">{selectedInterview.candidates?.name}</span>
                                    </div>
                                    <div className="h-px w-6 bg-gray-200" />
                                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.25em]">Interactive Assessment Portal</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInterview(null)} className="p-4 bg-white rounded-2xl text-muted hover:text-heading shadow-sm transition-all hover:rotate-90 border border-border/50">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-10 flex-1 space-y-10 scrollbar-hide">
                            <div className="grid grid-cols-1 gap-10">
                                {SCORE_CATEGORIES.map((cat) => (
                                    <div key={cat.key} className="group p-8 rounded-[2rem] border-2 border-gray-50 bg-gray-50/30 hover:border-primary/20 hover:bg-white transition-all space-y-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="space-y-1.5 flex-1">
                                                <h4 className="text-lg font-black text-heading uppercase tracking-tight flex items-center gap-3">
                                                    {cat.label}
                                                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-widest">{cat.key.toUpperCase()}</span>
                                                </h4>
                                                <p className="text-xs text-muted font-medium">{cat.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Calibration (1-5)</p>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => updateScore(cat.key, n)}
                                                            className={cn(
                                                                "w-12 h-12 rounded-2xl font-black text-lg transition-all border-2",
                                                                feedback[cat.key].score === n
                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110"
                                                                    : "bg-white text-gray-400 border-gray-100 hover:border-primary/50 hover:text-primary"
                                                            )}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label icon={MessageSquare}>Observed Nuances & Insights</Label>
                                            <textarea
                                                className="input-field min-h-[100px] !py-4 !rounded-2xl shadow-sm text-sm font-medium"
                                                placeholder={`Document technical depth or communication quirks for ${cat.label}...`}
                                                value={feedback[cat.key].notes}
                                                onChange={(e) => updateNotes(cat.key, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 rounded-[2rem] bg-heading text-white space-y-4">
                                <Label icon={Star} className="text-white/60">Executive Synthesis</Label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-base font-medium placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                                    placeholder="Synthesize the candidate's holistic potential and institutional resonance..."
                                    value={feedback.overall_notes}
                                    onChange={(e) => setFeedback(prev => ({ ...prev, overall_notes: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="p-10 border-t bg-surface-alt flex flex-wrap gap-4 items-center justify-between shrink-0">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Aggregate Evaluation</span>
                                    <span className="text-3xl font-black italic text-heading tracking-tighter">{calcAvg(feedback).toFixed(1)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isL2Round ? (
                                    <button
                                        onClick={() => handleDecision('Recommended')}
                                        disabled={isSubmitting || calcAvg(feedback) === 0}
                                        className="btn-primary !px-8 !py-4 !rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 group disabled:grayscale"
                                    >
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span className="text-sm font-black uppercase tracking-widest italic">Submit Final Dossier</span>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleDecision('Not Recommended')}
                                            disabled={isSubmitting || calcAvg(feedback) === 0}
                                            className="px-6 py-4 rounded-2xl border-2 border-rose-100 text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm"
                                        >
                                            Reject Profile
                                        </button>
                                        <button
                                            onClick={() => handleDecision('L2 Interview Required')}
                                            disabled={isSubmitting || calcAvg(feedback) === 0}
                                            className="px-6 py-4 rounded-2xl border-2 border-blue-100 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
                                        >
                                            Escalate to L2
                                        </button>
                                        <button
                                            onClick={() => handleDecision('Recommended')}
                                            disabled={isSubmitting || calcAvg(feedback) === 0}
                                            className="btn-primary !px-8 !py-4 !rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 group disabled:grayscale"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="text-sm font-black uppercase tracking-widest italic">Authorize Approval</span>
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

function Label({ children, icon: Icon, className }: { children: React.ReactNode, icon?: any, className?: string }) {
    return (
        <div className={cn("flex items-center gap-2 mb-2 ml-1", className)}>
            {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
            <label className="text-[10px] font-black uppercase tracking-[0.2em]">
                {children}
            </label>
        </div>
    );
}
