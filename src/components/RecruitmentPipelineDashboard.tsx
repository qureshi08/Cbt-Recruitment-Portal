"use client";

import React, { useMemo, useState } from 'react';
import {
    Users,
    Clock,
    FileText,
    MessageSquare,
    CheckCircle,
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

const MetricBox = ({ label, value, denominator, numerator, description }: any) => (
    <div className="bg-white p-5 rounded-[12px] border border-border shadow-soft relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.16em]">{label}</span>
            <span className="text-[10px] font-semibold text-body bg-surface border border-border px-2 py-0.5 rounded-full">
                {numerator} / {denominator}
            </span>
        </div>
        <div className="flex items-end gap-2">
            <span
                className="text-heading leading-none font-bold"
                style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", letterSpacing: "-0.03em", fontStyle: "italic" }}
            >
                {value}%
            </span>
            <div className="flex items-center text-[10px] font-semibold text-primary mb-1 uppercase tracking-[0.14em] gap-0.5">
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.5} />
                <span>Yield</span>
            </div>
        </div>
        <p className="text-[11.5px] text-muted mt-3 leading-relaxed italic">"{description}"</p>
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

    const stats = useMemo(() => {
        const total = filteredCandidates.length;
        const pending = filteredCandidates.filter(c => c.status === 'Applied').length;
        const testParticipants = filteredCandidates.filter(c =>
            ['Approved', 'Assessment Scheduled', 'Confirmed', 'Rescheduled', 'Assessment Completed'].includes(c.status)
        ).length;
        const activeInterviews = filteredCandidates.filter(c =>
            ['To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required'].includes(c.status)
        ).length;
        const recommended = filteredCandidates.filter(c => c.status === 'Recommended').length;

        return { total, pending, testParticipants, activeInterviews, recommended };
    }, [filteredCandidates]);

    const batches = useMemo(() => {
        const set = new Set(initialCandidates.map(c => c.batch_number).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [initialCandidates]);

    const efficiency = useMemo(() => {
        const totalAfterScreening = stats.testParticipants + stats.activeInterviews + stats.recommended;
        const totalAfterTest = stats.activeInterviews + stats.recommended;

        return {
            testRate: stats.total ? Math.round((totalAfterScreening / stats.total) * 100) : 0,
            testNumerator: totalAfterScreening,
            testDenominator: stats.total,

            interviewRate: totalAfterScreening ? Math.round((totalAfterTest / totalAfterScreening) * 100) : 0,
            interviewNumerator: totalAfterTest,
            interviewDenominator: totalAfterScreening,

            recRate: totalAfterScreening ? Math.round((stats.recommended / totalAfterScreening) * 100) : 0,
            recNumerator: stats.recommended,
            recDenominator: totalAfterScreening
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
                                <option key={b} value={b}>{b === 'All' ? 'Full Registry' : `Batch ${b}`}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Pipeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <PipelineStage title="Applications" count={stats.total} subtitle="Gross intake" icon={Users} color="bg-heading" />
                <PipelineStage title="Pending" count={stats.pending} subtitle="Awaiting screening" icon={Clock} color="bg-muted" />
                <PipelineStage title="Assessment" count={stats.testParticipants} subtitle="In technical testing" icon={FileText} color="bg-primary/80" />
                <PipelineStage title="Interviewing" count={stats.activeInterviews} subtitle="Technical interviews" icon={MessageSquare} color="bg-primary" />
                <PipelineStage title="Recommended" count={stats.recommended} subtitle="Successful candidates" icon={CheckCircle} color="bg-primary-dark" />
            </div>

            {/* Conversion Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <MetricBox
                    label="Screening Yield"
                    value={efficiency.testRate}
                    numerator={efficiency.testNumerator}
                    denominator={efficiency.testDenominator}
                    description="Percentage of applicants who pass the initial resume screening phase."
                    icon={Target}
                />
                <MetricBox
                    label="Assessment Pass Rate"
                    value={efficiency.interviewRate}
                    numerator={efficiency.interviewNumerator}
                    denominator={efficiency.interviewDenominator}
                    description="Percentage of test participants who qualify for the interview round."
                    icon={Activity}
                />
                <div className="relative bg-dark p-5 rounded-[12px] overflow-hidden flex flex-col justify-center border border-heading">
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
                    <div
                        className="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(0,153,77,0.18) 0%, transparent 65%)" }}
                    />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.16em]">Registry Conversion</span>
                        <div className="px-2 py-0.5 bg-white/10 rounded-full text-white text-[10px] font-semibold border border-white/10">
                            {efficiency.recNumerator} / {efficiency.recDenominator}
                        </div>
                    </div>

                    <div className="flex items-end gap-2 relative z-10">
                        <span
                            className="text-white leading-none font-bold"
                            style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", letterSpacing: "-0.03em", fontStyle: "italic" }}
                        >
                            {efficiency.recRate}%
                        </span>
                        <div className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 uppercase tracking-[0.14em]">
                            Final Yield
                        </div>
                    </div>

                    <p className="text-[10.5px] text-white/40 mt-3 leading-relaxed relative z-10 uppercase tracking-[0.14em] font-medium">
                        Total yield from assessment phase
                    </p>
                </div>
            </div>
        </div>
    );
}
