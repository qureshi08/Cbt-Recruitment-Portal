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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Recruiter Dashboard</h1>
                    <p className="admin-page-subtitle">Monitoring candidate flow and pipeline health.</p>
                </div>
                <div className="flex gap-2">
                    {user?.roles?.map(role => (
                        <span key={role} className="px-3 py-1 bg-white border border-gray-200 text-[var(--muted)] text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            {role}
                        </span>
                    ))}
                </div>
            </div>

            <RecruitmentPipelineDashboard initialCandidates={(allCandidates || []) as Candidate[]} />
        </div>
    );
}
