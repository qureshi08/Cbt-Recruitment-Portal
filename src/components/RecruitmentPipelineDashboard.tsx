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
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Label
} from 'recharts';
import { cn } from '@/lib/utils';
import { Candidate, CandidateStatus } from '@/types/database';

interface RecruitmentPipelineDashboardProps {
    initialCandidates: Candidate[];
}

const BRAND_PRIMARY = '#009245';

// --- Sub-components ---

const PipelineStage = ({ title, count, subtitle, icon: Icon, colorClass, isLast }: any) => (
    <div className="flex-1 flex items-center group">
        <div className="flex-1 bg-white p-5 rounded-xl border border-border shadow-sm hover:border-primary/20 transition-all relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 w-1 h-full", colorClass)} />
            <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors")}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">{count}</span>
            </div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">{subtitle}</p>
        </div>
        {!isLast && (
            <div className="hidden lg:flex px-2 text-gray-300">
                <ChevronRight className="w-5 h-5" />
            </div>
        )}
    </div>
);

const MetricBox = ({ label, value, description }: any) => (
    <div className="bg-gray-50/50 p-4 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <div className="p-1 rounded bg-white shadow-sm">
                <Percent className="w-3 h-3 text-primary" />
            </div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}%</div>
        <p className="text-[10px] text-gray-400 font-medium mt-1">{description}</p>
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

    const efficiency = useMemo(() => ({
        testRate: stats.total ? Math.round(((stats.testParticipants + stats.activeInterviews + stats.recommended) / stats.total) * 100) : 0,
        interviewRate: (stats.testParticipants + stats.activeInterviews + stats.recommended) ? Math.round(((stats.activeInterviews + stats.recommended) / (stats.testParticipants + stats.activeInterviews + stats.recommended)) * 100) : 0,
        recRate: (stats.activeInterviews + stats.recommended) ? Math.round((stats.recommended / (stats.activeInterviews + stats.recommended)) * 100) : 0
    }), [stats]);

    const trendData = useMemo(() => {
        const monthlyData: Record<string, { key: string; month: string; apps: number; tests: number; recs: number }> = {};

        filteredCandidates.forEach(c => {
            const date = new Date(c.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthDisplay = date.toLocaleString('default', { month: 'short' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    key: monthKey,
                    month: monthDisplay,
                    apps: 0,
                    tests: 0,
                    recs: 0
                };
            }
            monthlyData[monthKey].apps += 1;

            // For trend tracking, we check if they HAVE EVER reached these stages
            // but since we only have current status, we use these proxies:
            if (c.status === 'Recommended') {
                monthlyData[monthKey].recs += 1;
                monthlyData[monthKey].tests += 1;
            } else if (!['Applied', 'Rejected'].includes(c.status)) {
                monthlyData[monthKey].tests += 1;
            }
        });

        // Sort by key (YYYY-MM) and return
        return Object.values(monthlyData).sort((a, b) => a.key.localeCompare(b.key));
    }, [filteredCandidates]);

    return (
        <div className="space-y-6">
            {/* --- Filter Bar --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none">Recruitment Insights</h2>
                        <p className="text-xs text-gray-400 font-medium mt-1">Operational view of the hiring pipeline</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-border px-3 py-1.5 rounded-lg">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
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

            {/* --- Insight Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Efficiency Stats */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Stage Conversion</h3>
                        <span className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold">Pipeline Health</span>
                    </div>
                    <div className="space-y-4">
                        <MetricBox label="Screening to Test" value={efficiency.testRate} description="Candidates passing initial screening" />
                        <MetricBox label="Test to Interview" value={efficiency.interviewRate} description="Pass rate of the technical assessment" />
                        <MetricBox label="Interview Success" value={efficiency.recRate} description="Final recommendation yield" />
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Recruitment Pipeline Trends</h3>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'medium', fill: '#9ca3af' }}
                                >
                                    <Label value="Month" offset={-10} position="insideBottom" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9ca3af', textTransform: 'uppercase' }} />
                                </XAxis>
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'medium', fill: '#9ca3af' }}
                                >
                                    <Label value="Candidates" angle={-90} position="insideLeft" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#9ca3af', textTransform: 'uppercase' }} />
                                </YAxis>
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-4 rounded-xl shadow-xl border border-border min-w-[160px]">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 border-b border-border pb-2">
                                                    {payload[0].payload.month} {payload[0].payload.key.split('-')[0]}
                                                </p>
                                                <div className="space-y-2.5">
                                                    {payload.map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center gap-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                <span className="text-[11px] font-bold text-gray-600">
                                                                    {p.name === 'apps' ? 'Applied' : p.name === 'tests' ? 'Tested' : 'Passed'}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] font-black text-gray-900">{p.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                            {value === 'apps' ? 'Applied' : value === 'tests' ? 'Tested' : 'Passed'}
                                        </span>
                                    )}
                                />
                                <Line
                                    name="apps"
                                    type="monotone"
                                    dataKey="apps"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                                    label={{ position: 'top', fontSize: 10, fontWeight: 'bold', fill: '#3b82f6', offset: 10 }}
                                />
                                <Line
                                    name="tests"
                                    type="monotone"
                                    dataKey="tests"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                                    label={{ position: 'top', fontSize: 10, fontWeight: 'bold', fill: '#6366f1', offset: 10 }}
                                />
                                <Line
                                    name="recs"
                                    type="monotone"
                                    dataKey="recs"
                                    stroke={BRAND_PRIMARY}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: BRAND_PRIMARY, strokeWidth: 0 }}
                                    label={{ position: 'top', fontSize: 10, fontWeight: 'bold', fill: BRAND_PRIMARY, offset: 10 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
