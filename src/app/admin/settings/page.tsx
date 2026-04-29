import { getCurrentUser } from "@/lib/auth-utils";
import { fetchAllUsers, getAllRoles, getAiCriteria, getTeamNotificationRecipients } from "@/app/actions";
import UserManager from "@/components/UserManager";
import AiCriteriaManager from "@/components/AiCriteriaManager";
import TeamEmailManager from "@/components/TeamEmailManager";
import { ShieldAlert } from "lucide-react";

export default async function SettingsPage() {
    const user = await getCurrentUser();

    // Permissions check
    const isMaster = user?.roles.includes('Master');
    const isApprover = user?.roles.includes('Approver');
    const canAccessSettings = isMaster || isApprover;

    if (!canAccessSettings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-50 rounded-full">
                    <ShieldAlert className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-center max-w-md">
                    You do not have the required permissions to access Settings.
                    Please contact the System Administrator if you believe this is an error.
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">System Settings</h1>
                    <p className="admin-page-subtitle">Configure core behaviors and manage administrative access.</p>
                </div>
            </div>

            <AiCriteriaManager initialCriteria={aiCriteria} />

            {isMaster && (
                <>
                    <h3 className="text-xl font-bold text-gray-800 mt-8 border-t pt-8">Team Notifications</h3>
                    <TeamEmailManager initialRecipients={notificationRecipients} />
                </>
            )}

            {isMaster && (
                <>
                    <h3 className="text-xl font-bold text-gray-800 mt-8 border-t pt-8">User Management</h3>
                    <UserManager initialUsers={users} availableRoles={roles} />
                </>
            )}
        </div>
    );
}
