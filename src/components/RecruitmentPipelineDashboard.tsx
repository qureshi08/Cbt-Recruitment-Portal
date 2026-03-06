"use client";

import React, { useMemo, useState } from 'react';
import {
    Users,
    Clock,
    FileText,
    MessageSquare,
    CheckCircle,
    TrendingUp,
    BarChart3,
    Calendar,
    ChevronDown,
    Layers,
    ArrowUpRight
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

const COLORS = ['#009245', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6366f1'];

const STAGE_COLORS = {
    'Pending Approval': '#f59e0b',
    'Test Participants': '#6366f1',
    'Active Interviews': '#8b5cf6',
    'Recommended Candidates': '#009245',
};

// --- Helpers ---

const formatValue = (val: number) => new Intl.NumberFormat().format(val);

const KpiCard = ({ title, value, icon: Icon, percentage, color, bg }: any) => (
    <div className="bg-white p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{formatValue(value)}</h3>
                    {percentage !== undefined && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5", bg, color)}>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            {percentage}%
                        </span>
                    )}
                </div>
            </div>
            <div className={cn("p-2 rounded-lg shadow-sm", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
            </div>
        </div>
        {percentage !== undefined && (
            <p className="text-[9px] text-gray-400 font-medium mt-3">Distribution vs Total Applications</p>
        )}
    </div>
);

const ConversionIndicator = ({ title, value, previousTitle, barColor }: any) => (
    <div className="flex-1 min-w-[140px] p-4 bg-gray-50/50 rounded-xl border border-border shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: barColor }} />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-gray-900">{value}%</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase">Success</span>
        </div>
        <p className="text-[9px] text-gray-500 font-medium mt-1 truncate">from {previousTitle}</p>
    </div>
);

const FunnelStep = ({ label, count, previousCount, last, color }: any) => {
    const conversion = previousCount ? Math.round((count / previousCount) * 100) : 100;

    return (
        <div className="relative flex flex-col items-center group flex-1">
            <div className="w-full px-2">
                <div
                    className={cn(
                        "w-full h-20 rounded-xl flex flex-col items-center justify-center relative shadow-sm border border-black/5 transition-transform group-hover:-translate-y-1",
                        color
                    )}
                >
                    <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider mb-0.5">{label}</span>
                    <span className="text-white text-2xl font-bold tracking-tighter">{count}</span>
                </div>
            </div>

            {!last && (
                <div className="py-2 flex flex-col items-center relative h-12 w-full">
                    <div className="h-full w-px bg-gray-200 absolute left-1/2 -translate-x-1/2 top-0" />
                    <div className="relative z-10 px-2 py-1 bg-white border border-border shadow-sm rounded-lg flex items-center gap-1">
                        <span className="text-[9px] font-bold text-gray-600">{conversion}%</span>
                        <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
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
        const pending = filteredCandidates.filter(c => c.status === 'Applied').length;

        const testParticipants = filteredCandidates.filter(c => {
            const advancedStatuses: CandidateStatus[] = [
                'Assessment Completed', 'To Be Interviewed',
                'Interview Scheduled', 'L2 Interview Required',
                'Recommended', 'Not Recommended'
            ];
            return advancedStatuses.includes(c.status);
        }).length;

        const activeInterviews = filteredCandidates.filter(c => {
            const interviewStatuses: CandidateStatus[] = [
                'To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required'
            ];
            return interviewStatuses.includes(c.status);
        }).length;

        const recommended = filteredCandidates.filter(c => c.status === 'Recommended').length;

        return {
            total,
            pendingApproval: pending,
            testParticipants,
            activeInterviews,
            recommended
        };
    }, [filteredCandidates]);

    const batches = useMemo(() => {
        const set = new Set(initialCandidates.map(c => c.batch_number).filter(Boolean));
        return ['All', ...Array.from(set).sort()];
    }, [initialCandidates]);

    const statusDistributionData = useMemo(() => {
        const counts: Record<string, number> = {
            'Pending Approval': stats.pendingApproval,
            'Test Participants': stats.testParticipants,
            'Active Interviews': stats.activeInterviews,
            'Recommended Candidates': stats.recommended,
        };
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [stats]);

    const trendData = useMemo(() => {
        const monthlyData: Record<string, any> = {};

        filteredCandidates.forEach(c => {
            const date = new Date(c.created_at);
            const month = date.toLocaleString('default', { month: 'short' });

            if (!monthlyData[month]) {
                monthlyData[month] = { month, total: 0, recommended: 0, tested: 0 };
            }

            monthlyData[month].total += 1;
            if (c.status === 'Recommended') monthlyData[month].recommended += 1;
            if (['Assessment Completed', 'To Be Interviewed', 'Interview Scheduled', 'L2 Interview Required', 'Recommended', 'Not Recommended'].includes(c.status)) {
                monthlyData[month].tested += 1;
            }
        });

        return Object.values(monthlyData);
    }, [filteredCandidates]);

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <div className="p-6 bg-white rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recruitment Analytics</h2>
                    <p className="text-xs text-gray-500 font-medium">Pipeline visibility and candidate flow</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Batch:</label>
                        <div className="relative">
                            <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={filterBatch}
                                onChange={(e) => setFilterBatch(e.target.value)}
                                className="bg-white border border-border rounded-lg pl-8 pr-8 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none min-w-[140px] transition-all"
                            >
                                {batches.map(b => (
                                    <option key={b} value={b}>{b === 'All' ? 'All Batches' : `Batch ${b}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Period:</label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value)}
                                className="bg-white border border-border rounded-lg pl-8 pr-8 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none min-w-[140px] transition-all"
                            >
                                <option value="All">All Time</option>
                                <option value="Month">Last 30 Days</option>
                                <option value="Quarter">Last 90 Days</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard title="Total Candidates" value={stats.total} icon={Users} bg="bg-blue-50" color="text-blue-600" />
                <KpiCard title="Pending Screening" value={stats.pendingApproval} icon={Clock} percentage={stats.total ? Math.round((stats.pendingApproval / stats.total) * 100) : 0} bg="bg-amber-50" color="text-amber-600" />
                <KpiCard title="Test Participants" value={stats.testParticipants} icon={FileText} percentage={stats.total ? Math.round((stats.testParticipants / stats.total) * 100) : 0} bg="bg-indigo-50" color="text-indigo-600" />
                <KpiCard title="Active Interviews" value={stats.activeInterviews} icon={MessageSquare} percentage={stats.total ? Math.round((stats.activeInterviews / stats.total) * 100) : 0} bg="bg-purple-50" color="text-purple-600" />
                <KpiCard title="Recommended" value={stats.recommended} icon={CheckCircle} percentage={stats.total ? Math.round((stats.recommended / stats.total) * 100) : 0} bg="bg-primary/10" color="text-primary" />
            </div>

            {/* Main Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Recruitment Funnel</h3>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Candidate Conversion</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 py-4">
                        <FunnelStep label="Applications" count={stats.total} color="bg-blue-500" />
                        <FunnelStep label="Test Takers" count={stats.testParticipants} previousCount={stats.total} color="bg-indigo-500" />
                        <FunnelStep label="Interviews" count={stats.activeInterviews} previousCount={stats.testParticipants} color="bg-purple-500" />
                        <FunnelStep label="Recommended" count={stats.recommended} previousCount={stats.activeInterviews} last color="bg-primary" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Stage Efficiency</h3>
                    <ConversionIndicator title="Test Turnout" value={stats.total ? Math.round((stats.testParticipants / stats.total) * 100) : 0} previousTitle="Total Applications" barColor="#3b82f6" />
                    <ConversionIndicator title="Interview Rate" value={stats.testParticipants ? Math.round((stats.activeInterviews / stats.testParticipants) * 100) : 0} previousTitle="Test Pool" barColor="#6366f1" />
                    <ConversionIndicator title="Rec. Success" value={stats.activeInterviews ? Math.round((stats.recommended / stats.activeInterviews) * 100) : 0} previousTitle="Interview Pool" barColor="#009245" />
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Current Allocation</h3>
                        </div>
                    </div>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusDistributionData} layout="vertical" margin={{ left: -30, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9ca3af' }} width={120} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-2.5 rounded-lg shadow-xl border border-border">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{payload[0].payload.name}</p>
                                                <p className="text-sm font-bold text-gray-900">{payload[0].value} Candidates</p>
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                                    {statusDistributionData.map((e, i) => (
                                        <Cell key={i} fill={STAGE_COLORS[e.name as keyof typeof STAGE_COLORS]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Monthly Activity</h3>
                        </div>
                    </div>
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#009245" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#009245" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-2.5 rounded-lg shadow-xl border border-border space-y-1.5">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{payload[0].payload.month}</p>
                                                {payload.map((p, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px]">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                        <span className="font-bold text-gray-700">{p.name}: {p.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Area type="monotone" dataKey="total" name="Applications" stroke="#3b82f6" strokeWidth={2} fill="transparent" />
                                <Area type="monotone" dataKey="tested" name="Test Takers" stroke="#6366f1" strokeWidth={2} fill="transparent" />
                                <Area type="monotone" dataKey="recommended" name="Recommended" stroke="#009245" strokeWidth={3} fill="url(#trendGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
