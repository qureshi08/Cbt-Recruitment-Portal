import { supabase } from "@/lib/supabase";
import InterviewList from "@/components/InterviewList";
import { getCurrentUser } from "@/lib/auth-utils";
import { getAssignableInterviewers } from "@/app/actions";

export default async function InterviewsPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    // Default to newest-first so today's interviews and the most recently
    // added ones appear at the top of the table without having to scroll.
    // The portal user list (for the Interviewer column) is independent, so
    // fetch it in parallel.
    const [{ data: interviews, error }, interviewers] = await Promise.all([
        supabase
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
            .order("scheduled_at", { ascending: false }),
        getAssignableInterviewers(),
    ]);

    if (error) {
        return <div>Error loading interviews: {error.message}</div>;
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
                <div>
                    <span className="section-tag">Evaluation</span>
                    <h1
                        className="text-heading font-bold tracking-tight"
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        Evaluation <span className="italic-accent">Center</span>
                    </h1>
                    <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                        Scheduled assessments & interview dossiers.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
                <InterviewList initialInterviews={interviews || []} userRoles={roles} interviewers={interviewers} />
            </div>
        </div>
    );
}
