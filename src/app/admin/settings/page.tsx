import { getCurrentUser } from "@/lib/auth-utils";
import { fetchAllUsers, getAllRoles, getAiCriteria, getTeamNotificationRecipients } from "@/app/actions";
import UserManager from "@/components/UserManager";
import AiCriteriaManager from "@/components/AiCriteriaManager";
import TeamEmailManager from "@/components/TeamEmailManager";
import { ShieldAlert } from "lucide-react";

export default async function SettingsPage() {
    const user = await getCurrentUser();

    const isMaster = user?.roles.includes('Master');
    const isApprover = user?.roles.includes('Approver');
    const canAccessSettings = isMaster || isApprover;

    if (!canAccessSettings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
                <div className="p-3 bg-red-50 rounded-full">
                    <ShieldAlert className="w-9 h-9 text-red-600" strokeWidth={1.5} />
                </div>
                <h2
                    className="text-heading font-bold"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", letterSpacing: "-0.02em" }}
                >
                    Access Denied
                </h2>
                <p className="text-muted text-[13px] text-center max-w-md leading-relaxed">
                    You do not have the required permissions to access Settings. Contact the System Administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    const [users, roles, aiCriteria, notificationRecipients] = await Promise.all([
        isMaster ? fetchAllUsers() : Promise.resolve([]),
        isMaster ? getAllRoles() : Promise.resolve([]),
        getAiCriteria(),
        isMaster ? getTeamNotificationRecipients() : Promise.resolve([])
    ]);

    return (
        <div className="space-y-7 animate-in fade-in duration-500">
            <div>
                <span className="section-tag">Controls</span>
                <h1
                    className="text-heading font-bold tracking-tight"
                    style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                    }}
                >
                    System <span className="italic-accent">Settings</span>
                </h1>
                <p className="text-[12px] text-muted mt-1.5 leading-relaxed">
                    Configure core behaviors and manage administrative access.
                </p>
            </div>

            <AiCriteriaManager initialCriteria={aiCriteria} />

            {isMaster && (
                <section className="border-t border-border pt-6">
                    <h3
                        className="text-heading font-bold mb-4"
                        style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", letterSpacing: "-0.02em" }}
                    >
                        Team Notifications
                    </h3>
                    <TeamEmailManager initialRecipients={notificationRecipients} />
                </section>
            )}

            {isMaster && (
                <section className="border-t border-border pt-6">
                    <h3
                        className="text-heading font-bold mb-4"
                        style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", letterSpacing: "-0.02em" }}
                    >
                        User Management
                    </h3>
                    <UserManager initialUsers={users} availableRoles={roles} />
                </section>
            )}
        </div>
    );
}
