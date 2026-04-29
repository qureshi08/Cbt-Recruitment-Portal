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

const PipelineStage = ({ title, count, subtitle, icon: Icon, gradient, color }: any) => (
    <div className="group relative">
        <div className="bg-white p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col relative z-10 overflow-hidden">
            {/* Background Accent */}
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150", color)} />

            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110", gradient)}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-heading tracking-tight leading-none">{count}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <p className="text-[11px] font-black text-muted uppercase tracking-wider mb-1">{title}</p>
                <p className="text-[10px] text-gray-400 font-medium leading-tight">{subtitle}</p>
            </div>
        </div>
    </div>
);

const MetricBox = ({ label, value, denominator, numerator, description, icon: Icon }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-border/40 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-10 transition-opacity">
            <Icon className="w-12 h-12" />
        </div>
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-muted uppercase tracking-[0.1em]">{label}</span>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{numerator} / {denominator}</span>
        </div>
        <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-heading leading-none">{value}%</span>
            <div className="flex items-center text-[10px] font-bold text-primary mb-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>Rate</span>
            </div>
        </div>
        <p className="text-[10px] text-gray-400 font-medium mt-3 leading-relaxed">{description}</p>
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
        <div className="space-y-6">
            {/* --- Filter Bar --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-white rounded-2xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-bold text-heading leading-tight">Recruitment Analytics</h2>
                        <p className="text-[12px] text-muted font-medium mt-0.5">Real-time health of your hiring pipeline</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 border border-border px-3 py-1.5 rounded-xl">
                        <Layers className="w-3.5 h-3.5 text-muted" />
                        <span className="text-[11px] font-black text-muted uppercase tracking-wider">Batch:</span>
                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="bg-transparent text-[12px] font-bold text-heading outline-none cursor-pointer"
                        >
                            {batches.map(b => (
                                <option key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</option>
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
                    gradient="bg-blue-600"
                    color="bg-blue-600"
                />
                <PipelineStage
                    title="Pending"
                    count={stats.pending}
                    subtitle="Awaiting initial resume screening"
                    icon={Clock}
                    gradient="bg-amber-500"
                    color="bg-amber-500"
                />
                <PipelineStage
                    title="Assessment"
                    count={stats.testParticipants}
                    subtitle="Active in technical testing"
                    icon={FileText}
                    gradient="bg-indigo-600"
                    color="bg-indigo-600"
                />
                <PipelineStage
                    title="Interviewing"
                    count={stats.activeInterviews}
                    subtitle="Qualified for technical interviews"
                    icon={MessageSquare}
                    gradient="bg-purple-600"
                    color="bg-purple-600"
                />
                <PipelineStage
                    title="Recommended"
                    count={stats.recommended}
                    subtitle="Successful candidates found"
                    icon={CheckCircle}
                    gradient="bg-primary"
                    color="bg-primary"
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
                <div className="bg-primary p-6 rounded-2xl shadow-xl shadow-primary/20 relative overflow-hidden group flex flex-col justify-center">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-10 -mt-10 rounded-full blur-2xl" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-[.2em]">Overall Efficiency</span>
                        <div className="px-2.5 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold">
                            {efficiency.recNumerator} / {efficiency.recDenominator}
                        </div>
                    </div>

                    <div className="flex items-end gap-3 relative z-10">
                        <span className="text-4xl font-black text-white leading-none tracking-tight">{efficiency.recRate}%</span>
                        <div className="bg-white text-primary px-2 py-0.5 rounded-md text-[10px] font-black mb-1">
                            HIRE RATIO
                        </div>
                    </div>

                    <p className="text-[11px] text-white/80 font-medium mt-4 leading-relaxed relative z-10">
                        Calculated as recommended candidates vs total participants who reached the testing phase.
                    </p>
                </div>
            </div>
        </div>
    );
}
