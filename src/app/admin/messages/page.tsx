import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import MessageComposer from "@/components/MessageComposer";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const roles = user.roles ?? [];
    const allowed = roles.includes('Master') || roles.includes('HR');

    if (!allowed) {
        return (
            <div className="bg-white border border-border rounded-[12px] shadow-soft p-10 max-w-xl mx-auto text-center space-y-3">
                <h2 className="text-heading font-bold text-xl italic">Access restricted</h2>
                <p className="text-[12.5px] text-muted leading-relaxed">
                    Only HR and Master roles can use the custom email composer. If you need to send a broadcast, please ask the recruitment team.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Compose</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    Custom <span className="italic-accent">Broadcast</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Pick candidates from the database, write a subject and a body, send. Use this for announcements, postponements, schedule changes, or any other one-off update that doesn't have a built-in template.
                </p>
            </div>

            <MessageComposer senderName={user.full_name} />
        </div>
    );
}
