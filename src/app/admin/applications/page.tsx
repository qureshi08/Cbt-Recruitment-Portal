import { supabase } from "@/lib/supabase";
import { Candidate } from "@/types/database";
import CandidateTable from "@/components/CandidateTable";

export default async function ApplicationsPage() {
    // Fetch candidates from Supabase
    // In a real app, we'd handle pagination and filtering
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
                <CandidateTable initialCandidates={candidates || []} />
            </div>
        </div>
    );
}
