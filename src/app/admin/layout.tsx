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
        <div className="flex min-h-screen bg-[#FAFBFC]">
            <Sidebar userRoles={roles} />
            <div className="flex-1 ml-0 md:ml-60 flex flex-col min-w-0">
                <header className="h-16 glass sticky top-0 z-20 flex items-center justify-end md:justify-between px-4 md:px-10 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                    <div className="hidden md:block"></div>

                    <div className="flex items-center gap-6">
                        <NotificationBell />

                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[13px] font-semibold text-gray-900 leading-none mb-0.5">
                                    {user.full_name || 'User'}
                                </span>
                                <span className="text-[11px] font-medium text-gray-500 leading-none">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-4 md:p-8 lg:p-10 max-w-[1280px] w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </main>
            </div>
        </div>
    );
}
