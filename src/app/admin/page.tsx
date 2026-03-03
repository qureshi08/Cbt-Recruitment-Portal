import { supabase } from "@/lib/supabase";
import {
    Users,
    Calendar,
    CheckCircle,
    Clock,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const user = await getCurrentUser();

    const { count: totalCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

    const { count: pendingApproval } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Applied');

    const { count: scheduledInterviews } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true })
        .is('decision', null);

    const { count: recommendedCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Recommended');

    const { data: recentCandidates } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: upcomingAssessments } = await supabase
        .from('assessment_slots')
        .select(`
            *,
            candidates (name)
        `)
        .eq('is_locked', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

    const stats = [
        { name: 'Total Candidates', value: totalCandidates || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Pending Approval', value: pendingApproval || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { name: 'Active Interviews', value: scheduledInterviews || 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        { name: 'Recommended', value: recommendedCount || 0, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}. Here's what's happening today.</p>
                </div>
                <div className="flex gap-2">
                    {user?.roles?.map(role => (
                        <span key={role} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-full shadow-sm">
                            {role}
                        </span>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Candidates (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Recent Applications</h3>
                        <a href="/admin/applications" className="text-sm font-medium text-primary hover:text-primary-600">View All</a>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentCandidates && recentCandidates.length > 0 ? (
                                recentCandidates.map((candidate: any) => (
                                    <div key={candidate.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">
                                                {candidate.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{candidate.name}</p>
                                                <p className="text-xs text-gray-500">{candidate.email} • {new Date(candidate.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "status-badge",
                                            candidate.status === 'Recommended' ? "status-approved" :
                                                candidate.status === 'Rejected' ? "status-rejected" : "status-pending"
                                        )}>
                                            {candidate.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8 italic">No recent applications found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Assessments (1/3 width) */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Upcoming Assessments</h3>
                        <Shield className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="p-6 flex-1">
                        <div className="space-y-4 h-full">
                            {upcomingAssessments && upcomingAssessments.length > 0 ? (
                                upcomingAssessments.map((slot: any) => (
                                    <div key={slot.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <Calendar className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{slot.candidates?.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(slot.start_time).toLocaleDateString()}
                                                    <br />
                                                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[200px]">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                        <Calendar className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No upcoming assessments</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
