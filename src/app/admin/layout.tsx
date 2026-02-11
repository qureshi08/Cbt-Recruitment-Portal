import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar userRoles={roles} />
            <div className="flex-1 ml-64">
                <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-gray-800">Admin Portal</h1>
                    <div className="flex items-center gap-6">
                        <NotificationBell />
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Guest'}</p>
                                <p className="text-xs text-gray-500">{roles.join(' & ') || 'No Role'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                {user?.full_name?.charAt(0) || 'G'}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
