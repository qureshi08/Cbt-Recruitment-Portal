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
        <div className="space-y-5">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Interviews</h1>
                    <p className="admin-page-subtitle">Scheduled interviews and candidate feedback.</p>
                </div>
            </div>

            <div className="card !p-0">
                <InterviewList initialInterviews={interviews || []} userRoles={roles} />
            </div>
        </div>
    );
}
