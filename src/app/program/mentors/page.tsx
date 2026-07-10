import { supabase } from "@/lib/supabase";
import { getAvailableMentors } from "@/app/program/actions";
import MentorAssignment from "@/components/program/MentorAssignment";

export default async function MentorsPage() {
    const [mentorsResult, { data: batches }] = await Promise.all([
        getAvailableMentors(),
        supabase.from("batches").select("id, batch_number").order("batch_number"),
    ]);

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">CGAP Academy</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    <span className="italic-accent">Mentors</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Roster, load, and batch assignment.
                </p>
            </div>

            <MentorAssignment
                initialMentors={mentorsResult.success ? mentorsResult.mentors ?? [] : []}
                loadError={mentorsResult.success ? null : mentorsResult.error ?? null}
                batches={batches ?? []}
            />
        </div>
    );
}
