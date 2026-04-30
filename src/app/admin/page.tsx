import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-utils";
import RecruitmentPipelineDashboard from "@/components/RecruitmentPipelineDashboard";
import { Candidate } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    const user = await getCurrentUser();

    // Fetch all candidates for dashboard analytics
    const { data: allCandidates } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                    <span className="section-tag">Dashboard</span>
                    <h1
                        className="text-heading font-bold tracking-tight"
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        Executive <span className="italic-accent">Dossier</span>
                    </h1>
                    <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                        System analytics & pipeline management.
                    </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {user?.roles?.map(role => (
                        <span key={role} className="status-badge status-badge-primary">
                            {role}
                        </span>
                    ))}
                </div>
            </div>

            <RecruitmentPipelineDashboard initialCandidates={(allCandidates || []) as Candidate[]} />
        </div>
    );
}
