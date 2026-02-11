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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-8 rounded-2xl border border-border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Welcome, {user?.full_name?.split(' ')[0] || 'User'}!
                    </h2>
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        Signed in as <span className="text-primary font-semibold">{user?.email}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {user?.roles?.map(role => (
                        <div key={role} className="px-3 py-1 bg-gray-50 text-gray-600 text-[11px] font-bold uppercase rounded-lg border border-gray-200">
                            {role}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="card group flex items-center justify-between p-6 hover:shadow-md transition-all cursor-default overflow-hidden border-none shadow-sm outline outline-1 outline-border">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.name}</p>
                            <p className="text-3xl font-bold text-gray-900 leading-none">{stat.value}</p>
                        </div>
                        <div className={`p-4 rounded-xl transition-all group-hover:bg-opacity-80 ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card space-y-4 p-6 shadow-sm border-none outline outline-1 outline-border">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900 text-lg">Recent Candidates</h3>
                        <button className="text-xs font-bold text-primary hover:text-primary-600 transition-colors">
                            View all
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {recentCandidates && recentCandidates.length > 0 ? (
                            recentCandidates.map((candidate: any) => (
                                <div key={candidate.id} className="py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {candidate.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{candidate.name}</p>
                                            <p className="text-[11px] text-gray-400 font-medium">{new Date(candidate.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "status-badge text-[10px] font-bold uppercase tracking-wider px-3",
                                        candidate.status === 'Recommended' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                                    )}>
                                        {candidate.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic p-4">No recent applications found.</p>
                        )}
                    </div>
                </div>

                <div className="card space-y-4 p-6 shadow-sm border-none outline outline-1 outline-border">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900 text-lg">Upcoming Assessments</h3>
                        <Shield className="w-5 h-5 text-gray-200" />
                    </div>
                    <div className="divide-y divide-gray-50">
                        {upcomingAssessments && upcomingAssessments.length > 0 ? (
                            upcomingAssessments.map((slot: any) => (
                                <div key={slot.id} className="py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{slot.candidates?.name}</p>
                                            <p className="text-[11px] font-medium text-gray-400">
                                                {new Date(slot.start_time).toLocaleDateString()} at {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center opacity-50">
                                <Calendar className="w-10 h-10 mb-2 text-gray-300" />
                                <p className="text-xs font-semibold text-gray-400">Nothing scheduled for today</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
