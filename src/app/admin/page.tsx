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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-xl font-bold text-heading italic tracking-tight">Executive Dossier</h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1 opacity-60">System Analytics & Pipeline Management</p>
                </div>
                <div className="flex gap-2">
                    {user?.roles?.map(role => (
                        <span key={role} className="px-3 py-1 bg-surface-alt border border-border text-primary text-[8px] font-bold uppercase tracking-[0.2em] rounded-sm shadow-soft">
                            {role}
                        </span>
                    ))}
                </div>
            </div>

            <RecruitmentPipelineDashboard initialCandidates={(allCandidates || []) as Candidate[]} />
        </div>
    );
}
