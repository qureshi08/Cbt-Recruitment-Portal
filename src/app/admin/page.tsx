import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-utils";
import RecruitmentPipelineDashboard from "@/components/RecruitmentPipelineDashboard";
import { Candidate } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const user = await getCurrentUser();

    // Fetch all candidates for the dashboard analytics
    const { data: allCandidates } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recruiter Dashboard</h1>
                    <p className="text-sm text-gray-500 font-medium">Monitoring candidate flow and pipeline health</p>
                </div>
                <div className="flex gap-2">
                    {user?.roles?.map(role => (
                        <span key={role} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            {role}
                        </span>
                    ))}
                </div>
            </div>

            <RecruitmentPipelineDashboard initialCandidates={(allCandidates || []) as Candidate[]} />
        </div>
    );
}
