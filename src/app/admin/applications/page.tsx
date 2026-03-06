import { supabase } from "@/lib/supabase";
import { Candidate } from "@/types/database";
import CandidateTable from "@/components/CandidateTable";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function ApplicationsPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    // Fetch candidates + their latest interview scores in parallel
    const [{ data: candidates, error }, { data: interviews }] = await Promise.all([
        supabase.from("candidates").select("*").order("created_at", { ascending: false }),
        supabase.from("interviews").select("candidate_id, decision, l1_feedback_json, l2_feedback_json, l1_interviewer_name, l2_interviewer_name"),
    ]);

    if (error) {
        return <div>Error loading applications: {error.message}</div>;
    }

    // Build a lookup Map of interview scores per candidate
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

    // Merge interview scores into candidate objects
    const enrichedCandidates: Candidate[] = (candidates || []).map((c: any) => ({
        ...c,
        interview_scores: scoreMap.get(c.id) ?? undefined,
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Applications</h2>
                    <p className="text-sm text-gray-500">Manage all recruitment applications in one place.</p>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden">
                <CandidateTable initialCandidates={enrichedCandidates} userRoles={roles} />
            </div>
        </div>
    );
}
