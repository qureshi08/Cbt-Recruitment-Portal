"use client";

import React, { useMemo, useState } from 'react';
import {
    Users,
    Clock,
    FileText,
    MessageSquare,
    CheckCircle,
    Award,
    Layers,
    ChevronRight,
    ArrowUpRight,
    Target,
    Activity
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Candidate } from '@/types/database';

interface RecruitmentPipelineDashboardProps {
    initialCandidates: Candidate[];
}

// --- Sub-components ---

const PipelineStage = ({ title, count, subtitle, icon: Icon, color }: any) => (
    <div className="group relative">
        <div className="bg-white p-4 rounded-[12px] border border-border shadow-soft hover:shadow-premium hover:border-primary/40 transition-all duration-300 h-full flex flex-col relative z-10 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-1.5 rounded-md text-white transition-transform duration-300 group-hover:scale-105", color)}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-end">
                    <span
                        className="text-heading leading-none font-bold"
                        style={{ fontFamily: "var(--font-heading)", fontSize: "1.625rem", letterSpacing: "-0.025em", fontStyle: "italic" }}
                    >
                        {count}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-[0.14em]">
                        <span>Pipeline</span>
                        <ChevronRight className="w-2 h-2" strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <p className="text-[11px] font-semibold text-heading uppercase tracking-[0.12em] mb-0.5">{title}</p>
                <p className="text-[10.5px] text-muted leading-snug">{subtitle}</p>
            </div>
        </div>
    </div>
);

const MetricBox = ({ label, value, denominator, numerator, description, highlight }: any) => (
    <div className={cn(
        "p-5 rounded-[12px] border relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all duration-300 hover:shadow-premium hover:border-primary/30",
        highlight 
            ? "bg-heading text-white border-heading shadow-premium" 
            : "bg-white text-body border-border shadow-soft"
    )}>
        {highlight && (
            <>
                <div className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
                <div
                    className="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(0,153,77,0.15) 0%, transparent 65%)" }}
                />
            </>
        )}
        <div className="relative z-10 flex items-center justify-between mb-4">
            <span className={cn("text-[9px] font-bold uppercase tracking-[0.16em]", highlight ? "text-white/60" : "text-muted")}>{label}</span>
            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", highlight ? "text-white bg-white/10 border-white/15" : "text-body bg-surface border-border")}>
                {numerator} / {denominator}
            </span>
        </div>
        <div className="relative z-10 flex items-end gap-2">
            <span
                className={cn("leading-none font-bold", highlight ? "text-white" : "text-heading")}
                style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", letterSpacing: "-0.03em", fontStyle: "italic" }}
            >
                {value}%
            </span>
            <div className="flex items-center text-[9px] font-bold text-primary mb-1 uppercase tracking-[0.14em] gap-0.5">
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                <span>{highlight ? "Selected" : "Yield"}</span>
            </div>
        </div>
        <p className={cn("text-[11px] mt-3 leading-relaxed italic relative z-10", highlight ? "text-white/50" : "text-muted")}>"{description}"</p>
    </div>
);

export default function RecruitmentPipelineDashboard({ initialCandidates }: RecruitmentPipelineDashboardProps) {
    const [filterBatch, setFilterBatch] = useState('All');

    const filteredCandidates = useMemo(() => {
        return initialCandidates.filter(c => {
            const matchesBatch = filterBatch === 'All' || c.batch_number === filterBatch;
            return matchesBatch;
        });
    }, [initialCandidates, filterBatch]);

    // ─────────────────────────────────────────────────────────────────────
    // Every CandidateStatus maps to exactly ONE bucket below, and the
    // buckets are mutually exclusive + exhaustive (they always sum to
    // `total`). That's what makes the funnel numbers trustworthy instead
    // of feeling arbitrary: nobody is silently dropped or double-counted.
    //
    // Buckets are derived from `status` ALONE — no heuristics on fields
    // like assessment_score_url / assessment_slot. Those aren't reliably
    // populated (assessment_slot in particular isn't even fetched on this
    // page's query) and using them as a filter previously caused genuinely
    // tested candidates to be silently excluded whenever HR hadn't
    // uploaded a score screenshot yet — status is the one field every
    // server action in this app actually keeps in sync, so it's the only
    // trustworthy signal.
    //
    // Candidates manually inserted directly into a later status (e.g. a
    // historical batch re-add) are counted at face value based on that
    // status, same as the rest of the app already treats status as the
    // single source of truth for what buttons show, what emails send, etc.
    // ─────────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = filteredCandidates.length;

        const pending = filteredCandidates.filter(c => c.status === 'Applied').length;
        const rejectedScreening = filteredCandidates.filter(c => c.status === 'Rejected').length;

        // Approved / invited / booked — outcome not yet resolved.
        const testParticipants = filteredCandidates.filter(c =>
            ['Approved', 'Invite Sent', 'Assessment Scheduled', 'Confirmed', 'Rescheduled', 'Assessment Completed'].includes(c.status)
        ).length;

        // Booked an assessment slot but did not show up.
        const noShow = filteredCandidates.filter(c => c.status === 'Absent' || c.status === 'Not Coming').length;

        // Appeared, scored below the threshold, rejected before any interview.
        const assessmentFailed = filteredCandidates.filter(c => c.status === 'Assessment Failed').length;

        // Appeared, cleared the assessment, interview decision still pending.
        const activeInterviews = filteredCandidates.filter(c =>
            ['To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required'].includes(c.status)
        ).length;

        // Interview process concluded negatively.
        const notRecommended = filteredCandidates.filter(c => c.status === 'Not Recommended').length;

        // Interview process concluded positively, awaiting the selection email.
        const recommended = filteredCandidates.filter(c => c.status === 'Recommended').length;

        // Final positive outcome — selection email sent, joined the program.
        const selected = filteredCandidates.filter(c => c.status === 'Selected').length;

        // ── Cumulative "reached at least this stage" rollups ──────────
        // These statuses can ONLY be reached after the prior stage
        // actually happened (e.g. 'Assessment Failed' is only set by the
        // one-click low-score reject AFTER appearing; 'To Be Interviewed'
        // is only set when HR clicks "Mark Evaluation Complete"). That's
        // a guarantee from the server actions, not a guess.
        const assessmentAppeared = assessmentFailed + activeInterviews + notRecommended + recommended + selected;
        const assessmentPassed = activeInterviews + notRecommended + recommended + selected;
        const interviewDecided = notRecommended + recommended + selected;
        const recommendedOrBeyond = recommended + selected;

        return {
            total, pending, testParticipants, activeInterviews, recommended, selected,
            notRecommended, rejectedScreening, noShow, assessmentFailed,
            assessmentAppeared, assessmentPassed, interviewDecided, recommendedOrBeyond,
        };
    }, [filteredCandidates]);

    const batches = useMemo(() => {
        const set = new Set(initialCandidates.map(c => c.batch_number).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [initialCandidates]);

    const efficiency = useMemo(() => {
        // Cleared screening = everyone except still-pending (Applied) and
        // screened-out (Rejected). Computed by subtraction from `total` so
        // it's structurally impossible to forget a bucket (the previous
        // version manually summed buckets and silently omitted
        // 'Not Recommended', understating this rate).
        const screeningPassed = stats.total - stats.pending - stats.rejectedScreening;

        return {
            // Screening Yield — of everyone who applied, % who cleared resume screening.
            testRate: stats.total ? Math.round((screeningPassed / stats.total) * 100) : 0,
            testNumerator: screeningPassed,
            testDenominator: stats.total,

            // Assessment Attendance — of candidates whose assessment outcome is
            // resolved (appeared, or marked absent), % who actually appeared.
            // Anyone still just scheduled/awaiting the assessment date is
            // excluded from both sides — their outcome isn't known yet.
            attendanceRate: (stats.assessmentAppeared + stats.noShow) > 0
                ? Math.round((stats.assessmentAppeared / (stats.assessmentAppeared + stats.noShow)) * 100)
                : 0,
            attendanceNumerator: stats.assessmentAppeared,
            attendanceDenominator: stats.assessmentAppeared + stats.noShow,

            // Assessment Pass Rate — of candidates who appeared, % who cleared
            // the score threshold and moved on to interviews.
            interviewRate: stats.assessmentAppeared > 0
                ? Math.round((stats.assessmentPassed / stats.assessmentAppeared) * 100)
                : 0,
            interviewNumerator: stats.assessmentPassed,
            interviewDenominator: stats.assessmentAppeared,

            // Interview Pass Rate — of candidates whose interview process has
            // concluded (Recommended, Selected, or Not Recommended), % who
            // were recommended. Still-in-progress interviews are excluded.
            interviewPassRate: stats.interviewDecided > 0
                ? Math.round((stats.recommendedOrBeyond / stats.interviewDecided) * 100)
                : 0,
            interviewPassNumerator: stats.recommendedOrBeyond,
            interviewPassDenominator: stats.interviewDecided,

            // Selection Rate — of candidates ever recommended, % who were sent
            // the final selection email and joined the program.
            selectionRate: stats.recommendedOrBeyond > 0
                ? Math.round((stats.selected / stats.recommendedOrBeyond) * 100)
                : 0,
            selectionNumerator: stats.selected,
            selectionDenominator: stats.recommendedOrBeyond,
        };
    }, [stats]);

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-white rounded-[12px] border border-border shadow-soft">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-heading text-white flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2
                            className="text-heading"
                            style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.01em" }}
                        >
                            Recruitment <span className="italic-accent">Intelligence</span>
                        </h2>
                        <p className="text-[10px] text-muted font-medium mt-0.5 uppercase tracking-[0.12em]">
                            Real-time pipeline analysis
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-md">
                        <Layers className="w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">Phase:</span>
                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="bg-transparent text-[11.5px] font-semibold text-heading outline-none cursor-pointer"
                        >
                            {batches.map(b => (
                                <option key={b} value={b}>{b === 'All' ? 'Global Talent' : `Batch ${b}`}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <PipelineStage title="Applications" count={stats.total} subtitle="Gross intake" icon={Users} color="bg-heading" />
                <PipelineStage title="Pending" count={stats.pending} subtitle="Awaiting screening" icon={Clock} color="bg-muted" />
                <PipelineStage title="Assessment" count={stats.testParticipants} subtitle="In technical testing" icon={FileText} color="bg-primary/80" />
                <PipelineStage title="Interviewing" count={stats.activeInterviews} subtitle="Technical interviews" icon={MessageSquare} color="bg-primary" />
                <PipelineStage title="Recommended" count={stats.recommended} subtitle="Awaiting offer" icon={CheckCircle} color="bg-primary-dark" />
                <PipelineStage title="Selected" count={stats.selected} subtitle="Joined the program" icon={Award} color="bg-heading" />
            </div>

            {/* Conversion Metrics — grouped into two funnel stages so the
                numbers read top-to-bottom as an actual pipeline instead of
                five disconnected tiles. */}
            <div className="space-y-3">
                <div>
                    <p className="text-[9.5px] font-bold text-muted uppercase tracking-[0.2em] mb-2 px-1">
                        Stage 1 — Screening &amp; Assessment
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <MetricBox
                            label="Screening Yield"
                            value={efficiency.testRate}
                            numerator={efficiency.testNumerator}
                            denominator={efficiency.testDenominator}
                            description="Of everyone who applied, the percentage who cleared initial resume screening (i.e. moved beyond Applied/Rejected)."
                            icon={Target}
                        />
                        <MetricBox
                            label="Assessment Attendance"
                            value={efficiency.attendanceRate}
                            numerator={efficiency.attendanceNumerator}
                            denominator={efficiency.attendanceDenominator}
                            description="Of candidates whose assessment outcome is resolved (appeared or marked absent), the percentage who actually appeared."
                            icon={Activity}
                        />
                        <MetricBox
                            label="Assessment Pass Rate"
                            value={efficiency.interviewRate}
                            numerator={efficiency.interviewNumerator}
                            denominator={efficiency.interviewDenominator}
                            description="Of candidates who appeared for the assessment, the percentage who cleared the threshold and moved to interviews."
                            icon={Activity}
                        />
                    </div>
                </div>

                <div>
                    <p className="text-[9.5px] font-bold text-muted uppercase tracking-[0.2em] mb-2 px-1">
                        Stage 2 — Interview &amp; Offer
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <MetricBox
                            label="Interview Pass Rate"
                            value={efficiency.interviewPassRate}
                            numerator={efficiency.interviewPassNumerator}
                            denominator={efficiency.interviewPassDenominator}
                            description="Of candidates whose interview process has concluded (Recommended, Selected, or Not Recommended), the percentage who were recommended."
                            icon={Target}
                        />
                        <MetricBox
                            label="Selection Rate"
                            value={efficiency.selectionRate}
                            numerator={efficiency.selectionNumerator}
                            denominator={efficiency.selectionDenominator}
                            description="Of candidates ever recommended, the percentage who were sent the final selection email and joined the program."
                            icon={Award}
                            highlight={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
