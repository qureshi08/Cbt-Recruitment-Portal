"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, MessageSquare, X, Eye, Calendar, User, FileText, Star, Activity, Send, Shield, ChevronRight, Search, ArrowDown, ArrowUp } from "lucide-react";
import { cn, formatSlotDate, formatSlotTime } from "@/lib/utils";
import { withLoading } from "@/lib/loading";
import { UserRole, requestL2Interview, submitFinalInterviewFeedback, lockInterviewMeeting, generateAndLockInterview, getInterviewerAvailability } from "@/app/actions";

type StatusFilter = 'All' | 'Awaiting' | 'Recommended' | 'Not Recommended' | 'L2 Required';
type TimeFilter = 'All' | 'Today' | 'Upcoming' | 'Past';
type SortDirection = 'desc' | 'asc';

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
    meeting_link?: string | null;
    is_locked?: boolean | null;
    l1_feedback_json?: StructuredFeedback | null;
    l2_feedback_json?: StructuredFeedback | null;
    l1_interviewer_name?: string | null;
    l2_interviewer_name?: string | null;
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

function FeedbackSection({ label, fb, type, interviewerName }: { label: string; fb: StructuredFeedback; type: 'first' | 'second'; interviewerName?: string | null }) {
    const avg = calcAvg(fb);
    const isSecond = type === 'second';

    return (
        <div className={cn(
            "rounded-sm border p-5 space-y-4 bg-white shadow-soft",
            isSecond ? "border-indigo-100" : "border-border"
        )}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--surface)]">
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest">{label}</p>
                    {interviewerName && (
                        <p className="text-[10px] font-semibold text-[var(--heading)]">
                            by <span className="italic">{interviewerName}</span>
                        </p>
                    )}
                </div>
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
                                <h3 className="font-bold text-lg text-heading italic">Evaluation Summary</h3>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">{interview.candidates?.name} — {interview.candidates?.position}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 border border-transparent hover:border-border hover:bg-white rounded-sm text-muted hover:text-heading transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-white">
                            {hasL1 && <FeedbackSection label="First Evaluation Pass" fb={interview.l1_feedback_json!} type="first" interviewerName={interview.l1_interviewer_name} />}
                            {hasL2 && <FeedbackSection label="Final Round Insights" fb={interview.l2_feedback_json!} type="second" interviewerName={interview.l2_interviewer_name} />}
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

function MeetingScheduler({ interview, onConfirm, onCancel, isSubmitting, candidateId }: {
    interview: Interview;
    onConfirm: (availabilityId: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    candidateId: string;
}) {
    const [availabilities, setAvailabilities] = useState<any[]>([]);
    const [selectedAvail, setSelectedAvail] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAvail() {
            setLoading(true);
            try {
                const res = await getInterviewerAvailability(candidateId);
                if (res.success) {
                    setAvailabilities(res.data || []);
                    if (res.data && res.data.length > 0) {
                        setSelectedAvail(res.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Fetch availability error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAvail();
    }, [candidateId]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-heading/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="bg-white rounded-sm shadow-premium w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-heading italic">Automated Slot Booking</h3>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">For {interview.candidates?.name}</p>
                    </div>
                    <button onClick={onCancel} className="p-2 text-muted hover:text-heading"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Interviewer Availability</label>
                        {loading ? (
                            <div className="flex items-center gap-2 text-xs text-muted py-2"><Activity className="w-3 h-3 animate-spin" /> Loading availability...</div>
                        ) : availabilities.length > 0 ? (
                            <div className="space-y-3">
                                <select
                                    value={selectedAvail}
                                    onChange={(e) => setSelectedAvail(e.target.value)}
                                    className="w-full bg-white border border-border rounded-sm p-3 text-sm font-medium focus:border-primary outline-none appearance-none"
                                >
                                    {availabilities.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.interviewer_name} — {new Date(a.preferred_time).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-tight">
                                    {availabilities.length} positive responses found
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-sm text-[11px] text-amber-700 leading-relaxed">
                                <p className="font-bold mb-1">No availability found.</p>
                                Currently, there are no "Yes" responses recorded for this candidate. Please ensure interviewers have submitted their availability first.
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] text-muted italic font-medium leading-relaxed">
                        * Clicking 'Generate & Send' will automatically create a Teams meeting invitation on your behalf and notify all participants via email.
                    </p>
                </div>
                <div className="p-4 border-t bg-surface flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">Cancel</button>
                    <button
                        onClick={() => {
                            if (!selectedAvail && availabilities.length > 0) {
                                onConfirm(availabilities[0].id);
                            } else {
                                onConfirm(selectedAvail);
                            }
                        }}
                        disabled={isSubmitting || (availabilities.length === 0)}
                        className="bg-primary text-white px-6 py-2 rounded-[6px] text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dark disabled:opacity-30 transition-all shadow-sm"
                    >
                        {isSubmitting ? "Generating..." : "Generate & Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewList({ initialInterviews, userRoles }: InterviewListProps) {
    const router = useRouter();
    const [interviews, setInterviews] = useState(initialInterviews);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [meetingModalInterview, setMeetingModalInterview] = useState<Interview | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<StructuredFeedback>(emptyFeedback());

    // Filter / sort state — purely client-side, the full list is fetched once.
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
    const [search, setSearch] = useState('');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');

    const visibleInterviews = useMemo(() => {
        const now = Date.now();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

        const matches = interviews.filter(i => {
            // Status
            if (statusFilter === 'Awaiting' && i.decision) return false;
            if (statusFilter === 'Recommended' && i.decision !== 'Recommended') return false;
            if (statusFilter === 'Not Recommended' && i.decision !== 'Not Recommended') return false;
            if (statusFilter === 'L2 Required' && i.decision !== 'L2 Interview Required') return false;

            // Time scope (based on scheduled_at)
            const ts = new Date(i.scheduled_at).getTime();
            if (timeFilter === 'Today' && (ts < startOfToday.getTime() || ts >= startOfTomorrow.getTime())) return false;
            if (timeFilter === 'Upcoming' && ts < now) return false;
            if (timeFilter === 'Past' && ts >= now) return false;

            // Search by candidate name (case-insensitive)
            if (search.trim()) {
                const needle = search.trim().toLowerCase();
                const name = i.candidates?.name?.toLowerCase() ?? '';
                if (!name.includes(needle)) return false;
            }

            return true;
        });

        const sorted = [...matches].sort((a, b) => {
            const at = new Date(a.scheduled_at).getTime();
            const bt = new Date(b.scheduled_at).getTime();
            return sortDir === 'desc' ? bt - at : at - bt;
        });

        return sorted;
    }, [interviews, statusFilter, timeFilter, search, sortDir]);

    // Counts for the status pills (over ALL interviews, not the filtered set,
    // so the counts don't shift as the user toggles filters).
    const statusCounts = useMemo(() => ({
        All: interviews.length,
        Awaiting: interviews.filter(i => !i.decision).length,
        Recommended: interviews.filter(i => i.decision === 'Recommended').length,
        'Not Recommended': interviews.filter(i => i.decision === 'Not Recommended').length,
        'L2 Required': interviews.filter(i => i.decision === 'L2 Interview Required').length,
    }), [interviews]);

    const resetFilters = () => {
        setStatusFilter('All');
        setTimeFilter('All');
        setSearch('');
    };
    const hasActiveFilters = statusFilter !== 'All' || timeFilter !== 'All' || search.trim() !== '';

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
            await withLoading(async () => {
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
            });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMeetingLock = async (availabilityId: string) => {
        if (!meetingModalInterview) return;
        setIsSubmitting(true);
        try {
            const result = await withLoading(() =>
                generateAndLockInterview(meetingModalInterview.id, meetingModalInterview.candidate_id, availabilityId)
            );
            if (result.error) throw new Error(result.error);
            alert("Meeting generated successfully!");
            router.refresh();
            setMeetingModalInterview(null);
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

    const statusOptions: { value: StatusFilter; label: string }[] = [
        { value: 'All', label: `All (${statusCounts.All})` },
        { value: 'Awaiting', label: `Awaiting (${statusCounts.Awaiting})` },
        { value: 'Recommended', label: `Recommended (${statusCounts.Recommended})` },
        { value: 'L2 Required', label: `L2 Required (${statusCounts['L2 Required']})` },
        { value: 'Not Recommended', label: `Not Recommended (${statusCounts['Not Recommended']})` },
    ];
    const timeOptions: { value: TimeFilter; label: string }[] = [
        { value: 'All', label: 'All Time' },
        { value: 'Upcoming', label: 'Upcoming' },
        { value: 'Today', label: 'Today' },
        { value: 'Past', label: 'Past' },
    ];

    return (
        <div className="bg-white border border-border rounded-sm shadow-soft overflow-hidden">
            {/* Single-row filter strip */}
            <div className="px-4 py-3 border-b border-border bg-surface flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by candidate name…"
                        className="w-full pl-9 pr-3 py-2 text-[12px] bg-white border border-border rounded-sm focus:border-primary outline-none"
                    />
                </div>

                {/* Status dropdown */}
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className={cn(
                            "appearance-none pl-3 pr-8 py-2 text-[11px] font-semibold bg-white border rounded-sm cursor-pointer focus:outline-none transition-colors",
                            statusFilter !== 'All'
                                ? "border-primary text-primary"
                                : "border-border text-heading hover:border-primary/50"
                        )}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted rotate-90 pointer-events-none" strokeWidth={1.5} />
                </div>

                {/* Time scope dropdown */}
                <div className="relative">
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                        className={cn(
                            "appearance-none pl-3 pr-8 py-2 text-[11px] font-semibold bg-white border rounded-sm cursor-pointer focus:outline-none transition-colors",
                            timeFilter !== 'All'
                                ? "border-heading text-heading"
                                : "border-border text-heading hover:border-heading/50"
                        )}
                    >
                        {timeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted rotate-90 pointer-events-none" strokeWidth={1.5} />
                </div>

                {/* Sort toggle */}
                <button
                    type="button"
                    onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-heading bg-white border border-border rounded-sm hover:border-primary/50 transition-colors"
                    title={sortDir === 'desc' ? 'Latest first — click to flip' : 'Oldest first — click to flip'}
                >
                    {sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.5} />}
                    <span>{sortDir === 'desc' ? 'Latest' : 'Oldest'}</span>
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="flex items-center gap-1 px-2.5 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
                    >
                        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Clear
                    </button>
                )}

                {/* Counter — pushed right */}
                <span className="ml-auto text-[11px] font-semibold text-muted">
                    Showing <span className="text-heading">{visibleInterviews.length}</span> of {interviews.length}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '900px' }}>
                    <thead>
                        <tr className="bg-surface border-b border-border">
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[18%]">Scheduled</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[22%]">Candidate</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[20%]">Interview Status</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] w-[25%]">Meeting</th>
                            <th className="px-6 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] text-right w-[15%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/50">
                        {visibleInterviews.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted text-[12px] font-medium">
                                    {hasActiveFilters
                                        ? 'No interviews match your filters. Try clearing them.'
                                        : 'No interviews yet.'}
                                </td>
                            </tr>
                        )}
                        {visibleInterviews.map((interview) => {
                            const isAwaitingL2 = interview.decision === 'L2 Interview Required';
                            const isFinal = interview.decision === 'Recommended' || interview.decision === 'Not Recommended';
                            const canAct = !isFinal && (userRoles.includes('L1_Interviewer') || userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));
                            const canActL2 = isAwaitingL2 && (userRoles.includes('L2_Interviewer') || userRoles.includes('Master'));

                            return (
                                <tr key={interview.id} className="hover:bg-[var(--surface)] transition-colors group">
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[var(--heading)]">
                                                {formatSlotDate(interview.scheduled_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[11px] text-[var(--muted)] font-medium mt-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {formatSlotTime(interview.scheduled_at)} <span className="text-[var(--muted)]/60">PKT</span>
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
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Interview Response</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        {interview.is_locked ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                                                    <Shield className="w-3 h-3" />
                                                    Locked By HR
                                                </div>
                                                <a href={interview.meeting_link || '#'} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-[10px] font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-sm hover:bg-indigo-700 transition-all w-fit">
                                                    <MessageSquare className="w-3 h-3" />
                                                    Join Meeting
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
                                                    <Activity className="w-3 h-3" />
                                                    Link Pending
                                                </div>
                                                {(userRoles.includes('HR') || userRoles.includes('Master')) && (
                                                    <button onClick={() => setMeetingModalInterview(interview)}
                                                        className="inline-flex items-center gap-2 text-[10px] font-bold text-primary border border-primary px-3 py-1.5 rounded-sm hover:bg-primary/5 transition-all w-fit uppercase">
                                                        <Calendar className="w-3 h-3" />
                                                        Lock Meeting Link
                                                    </button>
                                                )}
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
                                                Evaluation Finalized
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

                            <div className={cn(
                                "p-5 rounded-sm border shadow-soft space-y-3 transition-colors",
                                feedback.overall_notes.trim().length === 0
                                    ? "bg-amber-50/40 border-amber-200"
                                    : "bg-surface border-border"
                            )}>
                                <h4 className="text-[11px] font-bold text-heading flex items-center gap-2 uppercase tracking-widest">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    Final Recommendation Synthesis
                                    <span className="text-red-600 normal-case tracking-normal text-[10px] font-bold">* Required</span>
                                </h4>
                                <textarea
                                    className="w-full bg-white border border-border rounded-sm p-4 text-xs font-medium placeholder:text-muted focus:border-primary outline-none transition-colors"
                                    rows={3}
                                    placeholder="Provide a holistic summary of your assessment of the candidate. This is required before submitting a decision."
                                    value={feedback.overall_notes}
                                    onChange={(e) => setFeedback(prev => ({ ...prev, overall_notes: e.target.value }))}
                                    required
                                />
                                {feedback.overall_notes.trim().length === 0 && (
                                    <p className="text-[10px] text-amber-700 font-semibold">
                                        Comments are mandatory — please summarise your evaluation before submitting a decision.
                                    </p>
                                )}
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
                                {(() => {
                                    const notesMissing = feedback.overall_notes.trim().length === 0;
                                    const scoresMissing = calcAvg(feedback) === 0;
                                    const blocked = isSubmitting || scoresMissing || notesMissing;
                                    const blockReason = scoresMissing
                                        ? 'Score every category before submitting'
                                        : notesMissing
                                            ? 'Comments are required before submitting'
                                            : '';

                                    // L2 round: Reject / Recommend only (no Request L2 — already on L2).
                                    // L1 round: Reject / Request L2 / Recommend.
                                    return (
                                        <>
                                            <button
                                                onClick={() => handleDecision('Not Recommended')}
                                                disabled={blocked}
                                                title={blockReason}
                                                className="px-5 py-3 rounded-sm border border-border bg-white text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-40"
                                            >
                                                Reject
                                            </button>
                                            {!isL2Round && (
                                                <button
                                                    onClick={() => handleDecision('L2 Interview Required')}
                                                    disabled={blocked}
                                                    title={blockReason}
                                                    className="px-5 py-3 rounded-sm border border-border bg-white text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-40"
                                                >
                                                    Request L2
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDecision('Recommended')}
                                                disabled={blocked}
                                                title={blockReason}
                                                className="bg-primary text-white border border-primary-hover px-5 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-md hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
                                            >
                                                Recommend
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Meeting Scheduler Modal */}
            {meetingModalInterview && (
                <MeetingScheduler
                    interview={meetingModalInterview}
                    candidateId={meetingModalInterview.candidate_id}
                    onCancel={() => setMeetingModalInterview(null)}
                    onConfirm={handleMeetingLock}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
