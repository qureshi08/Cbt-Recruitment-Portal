import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    // Strict multi-layer check: Redirect if no user or no assigned roles
    if (!user || !user.roles || user.roles.length === 0) {
        redirect("/login");
    }

    const roles = user.roles;

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar userRoles={roles} />
            <div className="flex-1 ml-64">
                <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-gray-400 uppercase tracking-tighter line-none">Internal Systems</h1>
                        <span className="text-lg font-bold text-gray-800 -mt-1">Admin Control Center</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <NotificationBell />

                        <div className="flex items-center gap-4 bg-gray-50 p-1.5 pr-4 rounded-full border border-border">
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-sm shadow-primary/20">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-sm font-extrabold text-gray-900 leading-none mb-0.5">
                                    {user.full_name || 'System User'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 leading-none">
                                    {user.email}
                                </span>
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
