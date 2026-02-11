import { supabase } from "@/lib/supabase";
import {
    Users,
    Calendar,
    CheckCircle,
    Clock,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminDashboard() {
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
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome back, Farooq Sahab</h2>
                <p className="text-sm text-gray-500">Here's what's happening in the recruitment portal today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="card flex items-center justify-between p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-semibold text-gray-800 text-lg">Recent Applications</h3>
                        <button className="text-sm text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="divide-y divide-border">
                        {recentCandidates && recentCandidates.length > 0 ? (
                            recentCandidates.map((candidate: any) => (
                                <div key={candidate.id} className="py-3 px-2 flex justify-between items-center hover:bg-gray-50 transition-colors rounded">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(candidate.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={cn(
                                        "status-badge text-[10px]",
                                        candidate.status === 'Recommended' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
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

                <div className="card space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-semibold text-gray-800 text-lg">Upcoming Assessments</h3>
                        <button className="text-sm text-primary hover:underline flex items-center gap-1">
                            Manage slots <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="divide-y divide-border">
                        {upcomingAssessments && upcomingAssessments.length > 0 ? (
                            upcomingAssessments.map((slot: any) => (
                                <div key={slot.id} className="py-3 px-2 flex justify-between items-center hover:bg-gray-50 transition-colors rounded">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{slot.candidates?.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(slot.start_time).toLocaleDateString()} at {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <Calendar className="w-4 h-4 text-gray-300" />
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic p-4">No scheduled assessments today.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
