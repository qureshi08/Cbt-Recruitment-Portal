import { supabase } from "@/lib/supabase";
import ActivityLog from "@/components/program/ActivityLog";

const ACADEMY_ENTITY_TYPES = ["batch", "fellow", "mentor_assignment", "onboarding_document"];

export default async function ActivityLogPage() {
    const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .in("entity_type", ACADEMY_ENTITY_TYPES)
        .order("created_at", { ascending: false })
        .limit(300);

    if (error) {
        return <div>Error loading activity log: {error.message}</div>;
    }

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
                    Activity <span className="italic-accent">Log</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Every batch, mentor, and fellow event — reuses the same audit trail as recruiting.
                </p>
            </div>

            <ActivityLog initialLogs={logs ?? []} />
        </div>
    );
}
