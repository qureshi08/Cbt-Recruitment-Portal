import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { ensureBuckets } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    // Silently ensure buckets and roles exist (runs once, idempotent)
    if (user?.roles) {
        await ensureBuckets();
    }

    // Strict multi-layer check: Redirect if no user or no assigned roles
    if (!user || !user.roles || user.roles.length === 0) {
        redirect("/login");
    }

    const roles = user.roles;

    return (
        <div className="flex h-screen bg-[#FAFBFC] overflow-hidden">
            <Sidebar userRoles={roles} />
            <div className="flex-1 ml-0 md:ml-56 flex flex-col min-w-0 h-full overflow-hidden">
                <header className="h-14 glass sticky top-0 z-20 flex items-center justify-end md:justify-between px-4 md:px-8 border-b border-border/30">
                    <div className="hidden md:block"></div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md shadow-primary/20">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[12px] font-semibold text-gray-900 leading-none">
                                    {user.full_name || 'User'}
                                </span>
                                <span className="text-[10px] font-medium text-gray-500 leading-none mt-0.5">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-3 md:p-5 overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="max-w-[1440px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
