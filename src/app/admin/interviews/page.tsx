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
                <InterviewList initialInterviews={interviews || []} userRoles={roles} />
            </div>
        </div>
    );
}
