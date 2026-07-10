import { getCurrentUser } from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { ONBOARDING_DOC_TYPES } from "@/types/academy";
import FellowOnboarding from "@/components/program/FellowOnboarding";

export default async function FellowHomePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const { data: fellow, error } = await supabase
        .from("fellows")
        .select("*, candidates(name, email), batches(batch_number)")
        .eq("auth_user_id", user.id)
        .single();

    if (error || !fellow) {
        return (
            <div className="bg-white border border-border rounded-[12px] shadow-soft p-10 text-center text-[12px] text-muted">
                No Fellow record found for this account. Contact the recruitment team.
            </div>
        );
    }

    const { data: documents } = await supabase
        .from("onboarding_documents")
        .select("*")
        .eq("fellow_id", fellow.id);

    return (
        <div className="space-y-5 animate-in fade-in duration-500 max-w-2xl">
            <div>
                <span className="section-tag">CGAP Academy · Batch #{fellow.batches?.batch_number}</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    Welcome, <span className="italic-accent">{fellow.candidates?.name?.split(" ")[0]}</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Complete all {ONBOARDING_DOC_TYPES.length} documents to finish enrolment.
                </p>
            </div>

            <FellowOnboarding fellowId={fellow.id} initialDocuments={documents ?? []} />
        </div>
    );
}
