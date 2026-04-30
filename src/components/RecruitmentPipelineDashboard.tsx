"use client";

import React, { useMemo, useState } from 'react';
import {
    Users,
    Clock,
    FileText,
    MessageSquare,
    CheckCircle,
    TrendingUp,
    Calendar,
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
        <div className="bg-white p-6 rounded-md border border-border shadow-soft hover:shadow-premium transition-all duration-300 h-full flex flex-col relative z-10 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-sm text-white shadow-soft transition-transform duration-300 group-hover:rotate-6", color)}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-heading tracking-tight font-heading italic leading-none">{count}</span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                        <span>PIPELINE</span>
                        <ChevronRight className="w-2 h-2" />
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <p className="text-[11px] font-bold text-heading uppercase tracking-[0.2em] mb-1">{title}</p>
                <p className="text-[10px] text-muted font-bold leading-tight opacity-70 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
    </div>
);

const MetricBox = ({ label, value, denominator, numerator, description, icon: Icon }: any) => (
    <div className="bg-white p-6 rounded-md border border-border shadow-soft relative overflow-hidden group">
        <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.25em]">{label}</span>
            <span className="text-[10px] font-bold text-heading bg-surface border border-border px-2.5 py-1 rounded-sm uppercase tracking-tight">{numerator} / {denominator}</span>
        </div>
        <div className="flex items-end gap-2.5">
            <span className="text-3xl font-bold text-heading leading-none font-heading italic tracking-tighter">{value}%</span>
            <div className="flex items-center text-[10px] font-bold text-primary mb-1 uppercase tracking-widest">
                <ArrowUpRight className="w-4 h-4" />
                <span>YIELD</span>
            </div>
        </div>
        <p className="text-[11px] text-muted font-medium mt-5 leading-relaxed opacity-80 italic">"{description}"</p>
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
            {/* --- Filter Bar --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-6 bg-white rounded-md border border-border shadow-soft">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-sm bg-heading text-white flex items-center justify-center shadow-premium">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-bold text-heading leading-tight uppercase tracking-[0.1em] font-heading italic">Recruitment Intelligence</h2>
                        <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-widest opacity-60">Real-time pipeline analysis dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-surface border border-border px-4 py-2 rounded-sm">
                        <Layers className="w-4 h-4 text-muted" />
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Phase:</span>
                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="bg-transparent text-[12px] font-bold text-heading outline-none cursor-pointer uppercase tracking-tight"
                        >
                            {batches.map(b => (
                                <option key={b} value={b}>{b === 'All' ? 'Full Registry' : `Batch ${b}`}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- Main Pipeline View --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <PipelineStage
                    title="Applications"
                    count={stats.total}
                    subtitle="Gross volume of incoming talent"
                    icon={Users}
                    color="bg-heading"
                />
                <PipelineStage
                    title="Pending"
                    count={stats.pending}
                    subtitle="Awaiting initial resume screening"
                    icon={Clock}
                    color="bg-muted"
                />
                <PipelineStage
                    title="Assessment"
                    count={stats.testParticipants}
                    subtitle="Active in technical testing"
                    icon={FileText}
                    color="bg-primary/80"
                />
                <PipelineStage
                    title="Interviewing"
                    count={stats.activeInterviews}
                    subtitle="Qualified for technical interviews"
                    icon={MessageSquare}
                    color="bg-primary"
                />
                <PipelineStage
                    title="Recommended"
                    count={stats.recommended}
                    subtitle="Successful candidates found"
                    icon={CheckCircle}
                    color="bg-heading shadow-premium"
                />
            </div>

            {/* --- Conversion Metrics --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MetricBox
                    label="Screening Yield"
                    value={efficiency.testRate}
                    numerator={efficiency.testNumerator}
                    denominator={efficiency.testDenominator}
                    description="The percentage of applicants who pass the initial resume screening phase."
                    icon={Target}
                />
                <MetricBox
                    label="Assessment Pass Rate"
                    value={efficiency.interviewRate}
                    numerator={efficiency.interviewNumerator}
                    denominator={efficiency.interviewDenominator}
                    description="The percentage of test participants who qualify for the interview round."
                    icon={Activity}
                />
                <div className="bg-heading p-8 rounded-md shadow-premium relative overflow-hidden group flex flex-col justify-center border border-heading">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] opacity-60">Registry conversion</span>
                        <div className="px-3 py-1 bg-white/10 rounded-sm text-white text-[10px] font-bold uppercase tracking-widest border border-white/5">
                            {efficiency.recNumerator} / {efficiency.recDenominator}
                        </div>
                    </div>

                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-4xl font-bold text-white leading-none tracking-tight font-heading italic">{efficiency.recRate}%</span>
                        <div className="bg-primary text-white px-2 py-0.5 rounded-sm text-[10px] font-bold mb-1 uppercase tracking-widest border border-primary-dark">
                            FINAL YIELD
                        </div>
                    </div>

                    <p className="text-[10px] text-muted font-bold mt-5 leading-relaxed relative z-10 uppercase tracking-widest opacity-40">
                        Total Yield from Assessment Phase
                    </p>
                </div>
            </div>
        </div>
    );
}
