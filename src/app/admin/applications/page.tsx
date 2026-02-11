import { supabase } from "@/lib/supabase";
import { Candidate } from "@/types/database";
import CandidateTable from "@/components/CandidateTable";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function ApplicationsPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    // Fetch candidates from Supabase
    const { data: candidates, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return <div>Error loading applications: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Applications</h2>
                    <p className="text-sm text-gray-500">Manage all recruitment applications in one place.</p>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden">
                <CandidateTable initialCandidates={candidates || []} userRoles={roles} />
            </div>
        </div>
    );
}
