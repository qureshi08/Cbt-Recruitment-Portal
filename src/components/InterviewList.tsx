"use client";

import { useState } from "react";
import { Clock, CheckCircle, XCircle, MessageSquare, X, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCandidateStatus, UserRole, requestL2Interview, submitFinalInterviewFeedback } from "@/app/actions";
import { supabase } from "@/lib/supabase";

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
        { key: 'technical', label: 'Technical Skills', description: 'Problem-solving ability, programming knowledge, CS fundamentals' },
        { key: 'communication', label: 'Communication', description: 'Clarity of expression, listening skills, ability to explain complex ideas' },
        { key: 'masters_plans', label: "Master's Plans", description: 'Future academic goals, ambitions, long-term career vision' },
        { key: 'analytical', label: 'Analytical Thinking', description: 'Logical reasoning, data interpretation, critical thinking skills' },
        { key: 'personality', label: 'Personality & Culture Fit', description: 'Attitude, adaptability, team fit, enthusiasm and drive' },
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
                <div key={n} className={cn("h-1.5 w-5 rounded-full", n <= score ? colors[score] : 'bg-gray-200')} />
            ))}
        </div>
    );
}

function FeedbackPanel({ label, fb, color }: { label: string; fb: StructuredFeedback; color: 'blue' | 'purple' }) {
    const avg = calcAvg(fb);
    const palette = {
        blue: { header: 'text-blue-700 bg-blue-50 border-blue-100', bar: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', label: 'text-blue-600' },
        purple: { header: 'text-purple-700 bg-purple-50 border-purple-100', bar: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', label: 'text-purple-600' },
    }[color];

    return (
        <div className={cn("rounded-xl border p-4 space-y-3", palette.header)}>
            <div className="flex items-center justify-between">
                <p className={cn("text-[11px] font-black uppercase tracking-widest", palette.label)}>{label}</p>
                {avg > 0 && (
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", palette.badge)}>
                        Avg {avg.toFixed(1)}/5
                    </span>
                )}
            </div>
            {SCORE_CATEGORIES.map(cat => {
                const d = fb[cat.key];
                if (!d || d.score === 0) return null;
                return (
                    <div key={cat.key} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-gray-700">{cat.label}</span>
                            <div className="flex items-center gap-2">
                                <ScoreBar score={d.score} />
                                <span className="text-[10px] font-bold text-gray-500">{d.score}/5</span>
                            </div>
                        </div>
                        {d.notes && (
                            <p className={cn("text-xs text-gray-500 leading-relaxed pl-2 border-l-2", palette.bar)}>{d.notes}</p>
                        )}
                    </div>
                );
            })}
            {fb.overall_notes && (
                <div className="pt-2 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Overall Notes</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{fb.overall_notes}</p>
                </div>
            )}
        </div>
    );
}

function FeedbackViewer({ interview }: { interview: Interview }) {
    const [open, setOpen] = useState(false);
    const hasL1 = !!interview.l1_feedback_json;
    const hasL2 = !!interview.l2_feedback_json;
    const hasLegacy = !!interview.feedback && !hasL1 && !hasL2;

    if (!hasL1 && !hasL2 && !hasLegacy) return null;

    const l1Avg = hasL1 ? calcAvg(interview.l1_feedback_json!) : null;
    const l2Avg = hasL2 ? calcAvg(interview.l2_feedback_json!) : null;

    return (
        <div className="mt-1">
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-primary/80 hover:text-primary transition-colors"
            >
                <Eye className="w-3 h-3" />
                View Report
                {l1Avg !== null && (
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black tracking-tight">L1 {l1Avg.toFixed(1)}</span>
                )}
                {l2Avg !== null && (
                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black tracking-tight">L2 {l2Avg.toFixed(1)}</span>
                )}
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-5 border-b flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-gray-900 text-lg">Interview Report</h3>
                                <p className="text-sm text-gray-500">{interview.candidates?.name}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5 space-y-4 flex-1">
                            {hasL1 && <FeedbackPanel label="L1 Interview Feedback" fb={interview.l1_feedback_json!} color="blue" />}
                            {hasL2 && <FeedbackPanel label="L2 Interview Feedback" fb={interview.l2_feedback_json!} color="purple" />}
                            {hasLegacy && (
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Legacy Feedback</p>
                                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{interview.feedback}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-border flex justify-end bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setOpen(false)}
                                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-black rounded-xl hover:bg-gray-100 transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Scorecard Input ──────────────────────────────────────────────────────────

function ScorecardForm({
    feedback,
    onScoreChange,
    onNotesChange,
    onOverallChange,
}: {
    feedback: StructuredFeedback;
    onScoreChange: (cat: keyof Omit<StructuredFeedback, 'overall_notes'>, score: number) => void;
    onNotesChange: (cat: keyof Omit<StructuredFeedback, 'overall_notes'>, notes: string) => void;
    onOverallChange: (notes: string) => void;
}) {
    return (
        <div className="space-y-4">
            {SCORE_CATEGORIES.map(cat => (
                <div key={cat.key} className="space-y-2 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-black text-gray-800">{cat.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => onScoreChange(cat.key, n)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-sm font-black border-2 transition-all",
                                        feedback[cat.key].score === n
                                            ? "bg-primary text-white border-primary shadow-md shadow-primary/30 scale-110"
                                            : "bg-white text-gray-400 border-gray-200 hover:border-primary/40 hover:text-primary"
                                    )}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={2}
                        placeholder={`Notes on ${cat.label.toLowerCase()}...`}
                        value={feedback[cat.key].notes}
                        onChange={e => onNotesChange(cat.key, e.target.value)}
                    />
                </div>
            ))}

            <div className="space-y-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider">Overall Notes / Final Summary</label>
                <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={3}
                    placeholder="Any additional observations, red flags, or strong positives..."
                    value={feedback.overall_notes}
                    onChange={e => onOverallChange(e.target.value)}
                />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewList({ initialInterviews, userRoles }: InterviewListProps) {
    const [interviews, setInterviews] = useState(initialInterviews);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<StructuredFeedback>(emptyFeedback());

    // Derived: is the open modal an L2 round?
    const isL2Round = !!selectedInterview?.decision && selectedInterview.decision === 'L2 Interview Required';

    const openModal = (interview: Interview) => {
        setFeedback(emptyFeedback());
        setSelectedInterview(interview);
    };

    const setScore = (cat: keyof Omit<StructuredFeedback, 'overall_notes'>, score: number) =>
        setFeedback(prev => ({ ...prev, [cat]: { ...prev[cat], score } }));

    const setNotes = (cat: keyof Omit<StructuredFeedback, 'overall_notes'>, notes: string) =>
        setFeedback(prev => ({ ...prev, [cat]: { ...prev[cat], notes } }));

    const handleDecision = async (decision: 'Recommended' | 'Not Recommended' | 'L2 Interview Required') => {
        if (!selectedInterview) return;

        // Confirmation for actions that trigger emails
        if (decision === 'Recommended' || decision === 'Not Recommended') {
            const confirmMsg = decision === 'Recommended'
                ? "Are you sure you want to RECOMMEND this candidate? This will send an automated acceptance/onboarding email."
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
                // L1 sends to L2 → save L1 scorecard separately
                const result = await requestL2Interview(
                    selectedInterview.id,
                    selectedInterview.candidate_id,
                    legacyText,
                    feedback as unknown as object
                );
                if (result.error) throw new Error(result.error);

                setInterviews(prev => prev.map(i =>
                    i.id === selectedInterview.id
                        ? { ...i, decision: 'L2 Interview Required', feedback: `L1: ${legacyText}`, l1_feedback_json: feedback }
                        : i
                ));
            } else {
                // Final decision (L1 direct or L2 final)
                const round = isL2Round ? 'L2' : 'L1';
                const finalFeedbackText = isL2Round
                    ? (selectedInterview.feedback ? `${selectedInterview.feedback}\nL2: ${legacyText}` : `L2: ${legacyText}`)
                    : legacyText;

                const result = await submitFinalInterviewFeedback(
                    selectedInterview.id,
                    selectedInterview.candidate_id,
                    decision,
                    finalFeedbackText,
                    feedback as unknown as object,
                    round
                );

                if (result.error) throw new Error(result.error);

                setInterviews(prev => prev.map(i =>
                    i.id === selectedInterview.id
                        ? {
                            ...i,
                            decision,
                            [round === 'L1' ? 'l1_feedback_json' : 'l2_feedback_json']: feedback
                        }
                        : i
                ));
            }

            setSelectedInterview(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-border">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Interview</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision & Feedback</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {interviews.map((interview) => {
                        const isAwaitingL2 = interview.decision === 'L2 Interview Required';
                        const isFinal = interview.decision === 'Recommended' || interview.decision === 'Not Recommended';
                        const canAct = !isFinal && (userRoles.includes('L1_Interviewer') || userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));
                        const canActL2 = isAwaitingL2 && (userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));

                        return (
                            <tr key={interview.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">
                                            {new Date(interview.scheduled_at).toLocaleString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 mb-1">{interview.candidates?.name}</span>
                                        <span className="text-xs text-gray-500 mb-2">{interview.candidates?.position}</span>
                                        <div className="flex items-center gap-3">
                                            {interview.candidates?.resume_url && (
                                                <a href={interview.candidates.resume_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-1 rounded">
                                                    Resume
                                                </a>
                                            )}
                                            {interview.candidates?.assessment_score_url && (
                                                <a href={interview.candidates.assessment_score_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                    Score Sheet
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-[320px]">
                                    {interview.decision ? (
                                        <div className="flex flex-col gap-1">
                                            <span className={cn(
                                                "status-badge w-fit",
                                                interview.decision === 'Recommended' ? "bg-green-100 text-green-800" :
                                                    interview.decision === 'L2 Interview Required' ? "bg-blue-100 text-blue-800" :
                                                        "bg-red-100 text-red-800"
                                            )}>
                                                {interview.decision}
                                            </span>
                                            <FeedbackViewer interview={interview} />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Pending Feedback</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!interview.decision && canAct && (
                                        <button onClick={() => openModal(interview)}
                                            className="btn-secondary !py-1 !px-3 text-xs flex items-center justify-center gap-1 ml-auto">
                                            <MessageSquare className="w-3 h-3" />
                                            Submit L1 Feedback
                                        </button>
                                    )}
                                    {isAwaitingL2 && canActL2 && (
                                        <button onClick={() => openModal(interview)}
                                            className="btn-secondary !py-1 !px-3 text-xs flex items-center justify-center gap-1 ml-auto border-purple-300 text-purple-700 hover:bg-purple-50">
                                            <MessageSquare className="w-3 h-3" />
                                            Submit L2 Final
                                        </button>
                                    )}
                                    {!interview.decision && !canAct && (
                                        <span className="text-xs text-gray-400 font-medium">View Only</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {interviews.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                No interviews scheduled.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Feedback Submission Modal */}
            {selectedInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedInterview(null)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className={cn(
                            "p-5 border-b flex justify-between items-center shrink-0",
                            isL2Round ? "bg-purple-50 border-purple-100" : "bg-gray-50 border-border"
                        )}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-gray-900 text-lg">
                                        {isL2Round ? 'L2 Interview Scorecard' : 'L1 Interview Scorecard'}
                                    </h3>
                                    <span className={cn(
                                        "text-[10px] font-black px-2 py-0.5 rounded-full",
                                        isL2Round ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {isL2Round ? 'Final Decision Round' : 'First Round'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{selectedInterview.candidates?.name}</p>
                            </div>
                            <button onClick={() => setSelectedInterview(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* L1 read-only summary shown in modal for L2 */}
                        {isL2Round && selectedInterview.l1_feedback_json && (
                            <div className="px-5 pt-4 pb-3 bg-blue-50/70 border-b border-blue-100 shrink-0">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">L1 Feedback Summary (Read-only)</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {SCORE_CATEGORIES.map(cat => {
                                        const d = selectedInterview.l1_feedback_json![cat.key];
                                        if (!d || d.score === 0) return null;
                                        return (
                                            <div key={cat.key} className="flex items-center justify-between">
                                                <span className="text-[11px] text-blue-700 font-bold">{cat.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <ScoreBar score={d.score} />
                                                    <span className="text-[10px] text-blue-500 font-black">{d.score}/5</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="mt-1 flex items-center justify-between border-t border-blue-200 pt-1.5">
                                        <span className="text-[11px] text-blue-800 font-black">L1 Average</span>
                                        <span className="text-[11px] text-blue-800 font-black bg-blue-100 px-2 py-0.5 rounded">
                                            {calcAvg(selectedInterview.l1_feedback_json!).toFixed(1)} / 5
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scorecard body */}
                        <div className="overflow-y-auto p-5 flex-1">
                            <ScorecardForm
                                feedback={feedback}
                                onScoreChange={setScore}
                                onNotesChange={setNotes}
                                onOverallChange={notes => setFeedback(prev => ({ ...prev, overall_notes: notes }))}
                            />
                        </div>

                        {/* Actions */}
                        <div className="p-5 border-t border-border flex flex-wrap gap-2 shrink-0 bg-gray-50">
                            <button
                                onClick={() => handleDecision('Not Recommended')}
                                disabled={isSubmitting}
                                className="flex-1 min-w-[120px] bg-red-50 text-red-700 border border-red-200 py-2.5 rounded-xl font-black text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Not Recommended
                            </button>

                            {/* L1 can escalate to L2 */}
                            {!isL2Round && (userRoles.includes('Master') || userRoles.includes('L1_Interviewer')) && (
                                <button
                                    onClick={() => handleDecision('L2 Interview Required')}
                                    disabled={isSubmitting}
                                    className="flex-1 min-w-[120px] bg-blue-50 text-blue-700 border border-blue-200 py-2.5 rounded-xl font-black text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Escalate to L2
                                </button>
                            )}

                            <button
                                onClick={() => handleDecision('Recommended')}
                                disabled={isSubmitting}
                                className={cn(
                                    "flex-1 min-w-[120px] py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2",
                                    isL2Round
                                        ? "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                        : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                )}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {isL2Round ? 'Final: Recommend' : 'Recommend'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
