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
    Briefcase,
    XCircle
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const STAGE_COLORS = {
    'Pending Approval': '#f59e0b',
    'Test Participants': '#10b981',
    'Active Interviews': '#8b5cf6',
    'Recommended Candidates': '#0ea5e9',
};

// --- Helpers ---

const formatValue = (val: number) => new Intl.NumberFormat().format(val);

const KpiCard = ({ title, value, icon: Icon, percentage, color, bg }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group">
        <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-110 transition-transform duration-500", bg)} />
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{formatValue(value)}</h3>
                {percentage !== undefined && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center shadow-sm", bg, color)}>
                            {percentage}%
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">of Total</span>
                    </div>
                )}
            </div>
            <div className={cn("p-2.5 rounded-lg shadow-sm border border-white/50", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
            </div>
        </div>
    </div>
);

const ConversionIndicator = ({ title, value, previousTitle, bg }: any) => (
    <div className="flex-1 min-w-[150px] p-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", bg)} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{value}%</span>
            <span className="text-[10px] text-gray-400 font-bold">Rate</span>
        </div>
        <p className="text-[9px] text-gray-500 font-medium mt-1 truncate">from {previousTitle}</p>
    </div>
);

const FunnelStep = ({ label, count, previousCount, last, color }: any) => {
    const conversion = previousCount ? Math.round((count / previousCount) * 100) : 100;

    return (
        <div className="relative flex flex-col items-center group flex-1">
            <div className="w-full flex flex-col items-center">
                <div
                    className={cn(
                        "w-full h-24 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 border-b-4 border-black/10",
                        color
                    )}
                >
                    <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em] mb-1 relative z-10">{label}</span>
                    <span className="text-white text-3xl font-black tracking-tighter relative z-10 leading-none">{count}</span>
                </div>
            </div>

            {!last && (
                <div className="py-2 flex flex-col items-center relative h-14 w-full">
                    <div className="h-full w-0.5 bg-gray-100 absolute left-1/2 -translate-x-1/2 top-0" />
                    <div className="relative z-10 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-xl flex items-center gap-1">
                        <span className="text-[10px] font-black text-primary">{conversion}%</span>
                        <ChevronDown className="w-3 h-3 text-primary" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default function RecruitmentPipelineDashboard({ initialCandidates }: RecruitmentPipelineDashboardProps) {
    const [filterRole, setFilterRole] = useState('All');
    const [filterPeriod, setFilterPeriod] = useState('All');

    const filteredCandidates = useMemo(() => {
        return initialCandidates.filter(c => {
            const matchesRole = filterRole === 'All' || c.position === filterRole;
            // Additional period logic can be added here
            return matchesRole;
        });
    }, [initialCandidates, filterRole, filterPeriod]);

    const stats = useMemo(() => {
        const total = filteredCandidates.length;
        const pending = filteredCandidates.filter(c => c.status === 'Applied').length;

        // Test participants: Anyone who has taken an assessment
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

    const roles = useMemo(() => {
        const set = new Set(initialCandidates.map(c => c.position).filter(Boolean));
        return ['All', ...Array.from(set)];
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

    const roleDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredCandidates.forEach(c => {
            const role = c.position || 'Other';
            counts[role] = (counts[role] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredCandidates]);

    return (
        <div className="space-y-10">
            {/* Filters Section */}
            <div className="p-8 bg-white/40 backdrop-blur-md rounded-[40px] border border-white/60 shadow-xl shadow-gray-200/50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-1">HR Insights</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Operational Pipeline Management</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Job Role</p>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="bg-white border-2 border-gray-50 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-black text-gray-800 outline-none focus:border-primary/30 appearance-none min-w-[200px] shadow-sm"
                            >
                                {roles.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Period</p>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value)}
                                className="bg-white border-2 border-gray-50 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-black text-gray-800 outline-none focus:border-primary/30 appearance-none min-w-[180px] shadow-sm"
                            >
                                <option value="All">All Time</option>
                                <option value="Month">Last 30 Days</option>
                                <option value="Quarter">Last 90 Days</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <KpiCard title="Total Candidates" value={stats.total} icon={Users} bg="bg-blue-50" color="text-blue-500" />
                <KpiCard title="Pending Approval" value={stats.pendingApproval} icon={Clock} percentage={stats.total ? Math.round((stats.pendingApproval / stats.total) * 100) : 0} bg="bg-amber-50" color="text-amber-500" />
                <KpiCard title="Test Participants" value={stats.testParticipants} icon={FileText} percentage={stats.total ? Math.round((stats.testParticipants / stats.total) * 100) : 0} bg="bg-emerald-50" color="text-emerald-500" />
                <KpiCard title="Active Interviews" value={stats.activeInterviews} icon={MessageSquare} percentage={stats.total ? Math.round((stats.activeInterviews / stats.total) * 100) : 0} bg="bg-purple-50" color="text-purple-500" />
                <KpiCard title="Recommended" value={stats.recommended} icon={CheckCircle} percentage={stats.total ? Math.round((stats.recommended / stats.total) * 100) : 0} bg="bg-sky-50" color="text-sky-500" />
            </div>

            {/* Funnel \u0026 Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recruitment Funnel</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Conversion Through Stages</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-primary opacity-20" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-0 h-full max-w-[900px] mx-auto relative z-10">
                        <FunnelStep label="Applications" count={stats.total} color="bg-blue-500" />
                        <FunnelStep label="Test Takers" count={stats.testParticipants} previousCount={stats.total} color="bg-emerald-500" />
                        <FunnelStep label="Interviews" count={stats.activeInterviews} previousCount={stats.testParticipants} color="bg-purple-500" />
                        <FunnelStep label="Recommended" count={stats.recommended} previousCount={stats.activeInterviews} last color="bg-sky-500" />
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-center space-y-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Performance</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 text-center">Efficiency KPI Rates</p>
                    </div>
                    <ConversionIndicator title="Test Participation" value={stats.total ? Math.round((stats.testParticipants / stats.total) * 100) : 0} previousTitle="Applications" bg="bg-blue-500" />
                    <ConversionIndicator title="Interview Rate" value={stats.testParticipants ? Math.round((stats.activeInterviews / stats.testParticipants) * 100) : 0} previousTitle="Test Pool" bg="bg-emerald-500" />
                    <ConversionIndicator title="Recommendation" value={stats.activeInterviews ? Math.round((stats.recommended / stats.activeInterviews) * 100) : 0} previousTitle="Interviews" bg="bg-purple-500" />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Pipeline Health</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Status Distribution</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusDistributionData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
                                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{payload[0].payload.name}</p>
                                                <p className="text-base font-black text-gray-900">{payload[0].value} <span className="text-[10px]">Candidates</span></p>
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                    {statusDistributionData.map((e, i) => (
                                        <Cell key={i} fill={STAGE_COLORS[e.name as keyof typeof STAGE_COLORS]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Hiring Cycle</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Monthly Recruitment Activity</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} />
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{payload[0].payload.month}</p>
                                                {payload.map((p, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                        <span className="text-[11px] font-bold text-gray-700">{p.name}: {p.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                    return null;
                                }} />
                                <Area type="monotone" dataKey="total" name="Apps" stroke="#3b82f6" strokeWidth={4} fill="url(#trendGradient)" />
                                <Area type="monotone" dataKey="tested" name="Tests" stroke="#10b981" strokeWidth={4} fill="transparent" />
                                <Area type="monotone" dataKey="recommended" name="Rec" stroke="#8b5cf6" strokeWidth={4} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Workload Distribution */}
            <div className="bg-gray-900 p-10 rounded-[48px] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 -mr-32 -mt-32 rounded-full blur-[100px]" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Role Distribution</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Operational Workload by Position</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {roleDistribution.map((role, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{role.name}</span>
                                    <span className="text-xl font-black text-white leading-none">{role.value} <span className="text-[10px] text-gray-500">Candidates</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
