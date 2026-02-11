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
        position
      )
    `)
        .order("scheduled_at", { ascending: true });

    if (error) {
        return <div>Error loading interviews: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Interviews</h2>
                <p className="text-sm text-gray-500">Scheduled interviews and candidate feedback.</p>
            </div>

            <div className="card !p-0">
                <InterviewList initialInterviews={interviews || []} userRoles={roles} />
            </div>
        </div>
    );
}
