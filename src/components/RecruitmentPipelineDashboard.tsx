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
    ChevronDown,
    Layers,
    ArrowRight,
    Target
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { Candidate, CandidateStatus } from '@/types/database';

interface RecruitmentPipelineDashboardProps {
    initialCandidates: Candidate[];
}

const BRAND_COLORS = {
    primary: '#009245',
    blue: '#3b82f6',
    amber: '#f59e0b',
    purple: '#8b5cf6',
};

// --- Funnel Step Component ---
const UnifiedFunnelStep = ({ label, count, previousCount, last, color, percentageTotal }: any) => {
    const conversion = previousCount ? Math.round((count / previousCount) * 100) : 100;

    return (
        <div className="relative flex flex-col items-center flex-1">
            <div className="w-full px-2">
                <div className={cn("p-6 rounded-2xl border border-black/5 shadow-sm transition-all hover:shadow-md h-32 flex flex-col items-center justify-center relative overflow-hidden group", color)}>
                    {/* Background decoration */}
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Target className="w-20 h-20 text-white" />
                    </div>

                    <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2 relative z-10">{label}</span>
                    <span className="text-white text-4xl font-extrabold tracking-tighter relative z-10">{count}</span>

                    {percentageTotal !== undefined && (
                        <span className="text-white/50 text-[10px] font-medium mt-1 relative z-10">{percentageTotal}% of total</span>
                    )}
                </div>
            </div>

            {!last && (
                <div className="py-2 flex flex-col items-center h-16 w-full relative">
                    <div className="h-full w-px bg-gray-100 absolute left-1/2 -translate-x-1/2" />
                    <div className="relative z-10 px-3 py-1 bg-white border border-border shadow-sm rounded-full flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-gray-500">{conversion}%</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

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

        // Pending Approval: Waiting for screening or approval (limbo between applied and test)
        const pending = filteredCandidates.filter(c =>
            ['Applied', 'Approved', 'Assessment Scheduled', 'Confirmed', 'Rescheduled'].includes(c.status)
        ).length;

        // Test Participants: Actually took the assessment
        const testParticipants = filteredCandidates.filter(c =>
            !['Applied', 'Rejected', 'Approved', 'Assessment Scheduled', 'Confirmed', 'Rescheduled'].includes(c.status)
        ).length;

        // Active Interviews: In current interview phase
        const activeInterviews = filteredCandidates.filter(c =>
            ['To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required', 'Recommended', 'Not Recommended'].includes(c.status)
        ).length;

        const recommended = filteredCandidates.filter(c => c.status === 'Recommended').length;

        return { total, pending, testParticipants, activeInterviews, recommended };
    }, [filteredCandidates]);

    const batches = useMemo(() => {
        const set = new Set(initialCandidates.map(c => c.batch_number).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [initialCandidates]);

    const trendData = useMemo(() => {
        const monthlyData: Record<string, any> = {};
        filteredCandidates.forEach(c => {
            const date = new Date(c.created_at);
            const month = date.toLocaleString('default', { month: 'short' });
            if (!monthlyData[month]) monthlyData[month] = { month, apps: 0, tests: 0, recs: 0 };
            monthlyData[month].apps += 1;
            if (c.status === 'Recommended') monthlyData[month].recs += 1;
            if (!['Applied', 'Rejected', 'Approved', 'Assessment Scheduled', 'Confirmed', 'Rescheduled'].includes(c.status)) {
                monthlyData[month].tests += 1;
            }
        });
        return Object.values(monthlyData);
    }, [filteredCandidates]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* 1. Header & Filters (Cleaned Up) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white rounded-xl border border-border shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recruitment Pipeline Dashboard</h2>
                    <p className="text-sm text-gray-500">Monitoring candidate flow up to final recommendation</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-border">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Batch:</span>
                        <select
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                        >
                            {batches.map(b => (
                                <option key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-border">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Period:</span>
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                        >
                            <option value="All">All Time</option>
                            <option value="Month">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Unified funnel row (KPIs + Funnel in one) */}
            <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Candidate Journey Conversion</h3>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between w-full">
                    <UnifiedFunnelStep
                        label="Total Candidates"
                        count={stats.total}
                        color="bg-blue-500"
                    />
                    <UnifiedFunnelStep
                        label="Pending Approval"
                        count={stats.pending}
                        previousCount={stats.total}
                        percentageTotal={stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}
                        color="bg-amber-500"
                    />
                    <UnifiedFunnelStep
                        label="Test Participants"
                        count={stats.testParticipants}
                        previousCount={stats.total}
                        percentageTotal={stats.total ? Math.round((stats.testParticipants / stats.total) * 100) : 0}
                        color="bg-indigo-500"
                    />
                    <UnifiedFunnelStep
                        label="Active Interviews"
                        count={stats.activeInterviews}
                        previousCount={stats.testParticipants}
                        percentageTotal={stats.total ? Math.round((stats.activeInterviews / stats.total) * 100) : 0}
                        color="bg-purple-500"
                    />
                    <UnifiedFunnelStep
                        label="Recommended"
                        count={stats.recommended}
                        previousCount={stats.activeInterviews}
                        last
                        percentageTotal={stats.total ? Math.round((stats.recommended / stats.total) * 100) : 0}
                        color="bg-[#009245]"
                    />
                </div>
            </div>

            {/* 3. Efficiency & Activity (Combined for zero redundancy) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Efficiency Pulse</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-xs font-bold text-gray-600">Test Participation</span>
                            <span className="text-xl font-black text-primary">{stats.total ? Math.round((stats.testParticipants / stats.total) * 100) : 0}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-xs font-bold text-gray-600">Interview Yield</span>
                            <span className="text-xl font-black text-primary">{stats.testParticipants ? Math.round((stats.activeInterviews / stats.testParticipants) * 100) : 0}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <span className="text-xs font-bold text-gray-600">Final Recommendation</span>
                            <span className="text-xl font-black text-primary">{stats.activeInterviews ? Math.round((stats.recommended / stats.activeInterviews) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Pipeline Activity Over Time</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-3 rounded-xl shadow-xl border border-border">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{payload[0].payload.month}</p>
                                                {payload.map((p, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px] font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                        <span>{p.name}: {p.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Area type="monotone" dataKey="apps" name="Apps" stroke={BRAND_COLORS.blue} strokeWidth={2} fill="transparent" />
                                <Area type="monotone" dataKey="tests" name="Tests" stroke={BRAND_COLORS.purple} strokeWidth={2} fill="transparent" />
                                <Area type="monotone" dataKey="recs" name="Recommendations" stroke={BRAND_COLORS.primary} strokeWidth={3} fill="url(#trendGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
