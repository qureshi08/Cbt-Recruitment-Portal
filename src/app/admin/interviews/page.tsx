import { supabase } from "@/lib/supabase";
import InterviewList from "@/components/InterviewList";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function InterviewsPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    const { data: interviews, error } = await supabase
        .from("interviews")
        .select(`
      *,
      candidates (
        name,
        position,
        resume_url,
        assessment_score_url
      )
    `)
        .order("scheduled_at", { ascending: true });

    if (error) {
        return <div>Error loading interviews: {error.message}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between mb-2">
                <div>
                    <h1 className="text-xl font-bold text-heading italic tracking-tight">Evaluation Center</h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1 opacity-60">Scheduled Assessments & Interview Dossiers</p>
                </div>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-soft overflow-hidden">
                <InterviewList initialInterviews={interviews || []} userRoles={roles} />
            </div>
        </div>
    );
}
