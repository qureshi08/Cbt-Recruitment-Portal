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
    ArrowRight,
    Search,
    ChevronRight,
    Percent
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Candidate, CandidateStatus } from '@/types/database';

interface RecruitmentPipelineDashboardProps {
    initialCandidates: Candidate[];
}

const BRAND_PRIMARY = '#009245';

// --- Sub-components ---

const PipelineStage = ({ title, count, subtitle, icon: Icon, colorClass, isLast }: any) => (
    <div className="flex-1 flex items-center group">
        <div className="flex-1 bg-white p-4 rounded-2xl border border-border/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 w-1 h-full", colorClass)} />
            <div className="flex items-center justify-between mb-2">
                <div className={cn("p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors")}>
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-2xl font-semibold text-gray-900">{count}</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">{title}</p>
            <p className="text-[9px] text-gray-400 font-medium mt-0.5 opacity-80">{subtitle}</p>
        </div>
        {!isLast && (
            <div className="hidden xl:flex px-1.5 text-gray-200">
                <ChevronRight className="w-4 h-4" />
            </div>
        )}
    </div>
);

const MetricBox = ({ label, value, denominator, numerator, description }: any) => (
    <div className="bg-gray-50/30 p-4 rounded-2xl border border-border/40">
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
            <div className="flex items-center gap-1.5 font-bold">
                <span className="text-[10px] text-gray-400">{numerator}/{denominator}</span>
            </div>
        </div>
        <div className="text-2xl font-semibold text-gray-900">{value}%</div>
        <p className="text-[10px] text-gray-400 font-medium mt-0.5 italic">{description}</p>
    </div>
);

export default function RecruitmentPipelineDashboard({ initialCandidates }: RecruitmentPipelineDashboardProps) {
    const [filterBatch, setFilterBatch] = useState('All');
    const [filterPeriod, setFilterPeriod] = useState('All');

    const filteredCandidates = useMemo(() => {
        return initialCandidates.filter(c => {
            const matchesBatch = filterBatch === 'All' || c.batch_number === filterBatch;
            return matchesBatch;
        });
    }, [initialCandidates, filterBatch]);

    const stats = useMemo(() => {
        const total = filteredCandidates.length;

        // 1. Pending Screening: Candidate applied but HR hasn't taken any action.
        const pending = filteredCandidates.filter(c => c.status === 'Applied').length;

        // 2. Test Participants: Passed initial screening (Approved) OR already in testing phase.
        const testParticipants = filteredCandidates.filter(c =>
            ['Approved', 'Assessment Scheduled', 'Confirmed', 'Rescheduled', 'Assessment Completed'].includes(c.status)
        ).length;

        // 3. Active Interviews: Cleared assessment phase and moved to interviews.
        const activeInterviews = filteredCandidates.filter(c =>
            ['To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required'].includes(c.status)
        ).length;

        // 4. Recommendation: Final positive decision.
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
            recDenominator: totalAfterScreening // Overall Pass Rate = Recommended / Total Tested (Total after screening)
        };
    }, [stats]);



    return (
        <div className="space-y-4">
            {/* --- Filter Bar --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3.5 bg-white/50 backdrop-blur-sm rounded-2xl border border-border/40 min-h-[64px]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-semibold text-gray-900 leading-none">Recruitment Insights</h2>
                        <p className="text-[12px] text-gray-500 mt-1">Operational view of the hiring pipeline</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-2.5 py-1 rounded-lg">
                        <Layers className="w-3 h-3 text-gray-400" />
                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer"
                        >
                            {batches.map(b => (
                                <option key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-border px-3 py-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="bg-transparent text-[11px] font-bold text-gray-700 outline-none cursor-pointer"
                        >
                            <option value="All">All Time</option>
                            <option value="Month">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- Main Pipeline View (Combined KPI & Flow) --- */}
            <div className="flex flex-col lg:flex-row gap-2">
                <PipelineStage
                    title="Total Applications"
                    count={stats.total}
                    subtitle="Gross application volume"
                    icon={Users}
                    colorClass="bg-blue-500"
                />
                <PipelineStage
                    title="Pending Approval"
                    count={stats.pending}
                    subtitle="Awaiting HR screening"
                    icon={Clock}
                    colorClass="bg-amber-500"
                />
                <PipelineStage
                    title="Test Phase"
                    count={stats.testParticipants}
                    subtitle="Assessment participation"
                    icon={FileText}
                    colorClass="bg-indigo-500"
                />
                <PipelineStage
                    title="Active Interviews"
                    count={stats.activeInterviews}
                    subtitle="Qualified interview pool"
                    icon={MessageSquare}
                    colorClass="bg-purple-500"
                />
                <PipelineStage
                    title="Recommended"
                    count={stats.recommended}
                    subtitle="Successful candidacies"
                    icon={CheckCircle}
                    colorClass="bg-primary"
                    isLast
                />
            </div>

            {/* --- Insight Section (Horizontal) --- */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Stage Conversion</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Pipeline health and yield analysis</p>
                    </div>
                    <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold">Performance Metrics</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricBox
                        label="Screening to Test"
                        value={efficiency.testRate}
                        numerator={efficiency.testNumerator}
                        denominator={efficiency.testDenominator}
                        description="Candidates passing initial screening"
                    />
                    <MetricBox
                        label="Test to Interview"
                        value={efficiency.interviewRate}
                        numerator={efficiency.interviewNumerator}
                        denominator={efficiency.interviewDenominator}
                        description="Pass rate of the technical assessment"
                    />
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Overall Pass Rate</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-primary/60">{efficiency.recNumerator}/{efficiency.recDenominator}</span>
                            </div>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">{efficiency.recRate}%</div>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">Recommended / Total Tested</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
