import { getCurrentUser } from "@/lib/auth-utils";
import { fetchAllUsers, getAllRoles } from "@/app/actions";
import UserManager from "@/components/UserManager";
import { ShieldAlert } from "lucide-react";

export default async function SettingsPage() {
    const user = await getCurrentUser();

    // Safety check: Only Master users can access user management
    const isMaster = user?.roles.includes('Master');

    if (!isMaster) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-red-50 rounded-full">
                    <ShieldAlert className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 text-center max-w-md">
                    You do not have the required permissions to access User Management.
                    Please contact the System Administrator if you believe this is an error.
                </p>
            </div>
        );
    }

    const [users, roles] = await Promise.all([
        fetchAllUsers(),
        getAllRoles()
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
                <p className="text-sm text-gray-500">Configure system roles and manage administrative access.</p>
            </div>

            <UserManager initialUsers={users} availableRoles={roles} />
        </div>
    );
}
