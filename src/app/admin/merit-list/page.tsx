import { supabase } from "@/lib/supabase";
import { Candidate } from "@/types/database";
import MeritList from "@/components/MeritList";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function MeritListPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    // Only the late-funnel statuses this feature cares about — a much smaller
    // slice than the full Candidate Pipeline query.
    const [{ data: candidates, error }, { data: interviews }] = await Promise.all([
        supabase
            .from("candidates")
            .select("*")
            .in("status", ["Recommended", "Selected"])
            .order("created_at", { ascending: false }),
        supabase.from("interviews").select("candidate_id, decision, l1_feedback_json, l2_feedback_json, l1_interviewer_name, l2_interviewer_name"),
    ]);

    if (error) {
        return <div>Error loading merit list: {error.message}</div>;
    }

    // Build a lookup Map of interview scores per candidate (same pattern as
    // /admin/applications).
    const scoreMap = new Map<string, { decision?: string | null; l1_feedback_json?: any; l2_feedback_json?: any; l1_interviewer_name?: string; l2_interviewer_name?: string }>();
    for (const iv of interviews || []) {
        scoreMap.set(iv.candidate_id, {
            decision: iv.decision,
            l1_feedback_json: iv.l1_feedback_json,
            l2_feedback_json: iv.l2_feedback_json,
            l1_interviewer_name: iv.l1_interviewer_name,
            l2_interviewer_name: iv.l2_interviewer_name,
        });
    }

    const enrichedCandidates: Candidate[] = (candidates || []).map((c: any) => ({
        ...c,
        interview_scores: scoreMap.get(c.id) ?? undefined,
    }));

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
                <div>
                    <span className="section-tag">Final Selection</span>
                    <h1
                        className="text-heading font-bold tracking-tight"
                        style={{
                            fontFamily: "var(--font-heading)",
                            fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}
                    >
                        Merit <span className="italic-accent">List</span>
                    </h1>
                    <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                        Rank recommended candidates, select the cohort, and track who&apos;s actually joining.
                    </p>
                </div>
            </div>

            <MeritList initialCandidates={enrichedCandidates} userRoles={roles} />
        </div>
    );
}
