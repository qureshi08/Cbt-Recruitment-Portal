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

    // Silently ensure buckets and roles exist
    if (user?.roles) {
        await ensureBuckets();
    }

    if (!user || !user.roles || user.roles.length === 0) {
        redirect("/login");
    }

    const roles = user.roles;

    return (
        <div className="flex h-screen bg-surface overflow-hidden">
            <Sidebar userRoles={roles} />

            {/* Main content — compact offset */}
            <div className="flex-1 ml-0 md:ml-[260px] flex flex-col min-w-0 h-full overflow-hidden">

                {/* Top Header — SLIM & REFINED */}
                <header className="h-14 bg-white border-b border-border/50 sticky top-0 z-20 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                    </div>

                    {/* Right side — notifications + user profile */}
                    <div className="flex items-center gap-6 shrink-0">
                        <NotificationBell />

                        <div className="flex items-center gap-3 pr-1 py-1 rounded-sm transition-all cursor-default">
                            <div className="flex flex-col text-right min-w-0 overflow-hidden">
                                <span className="text-[11px] font-bold text-heading leading-tight truncate max-w-[140px]">
                                    {user.full_name || 'System User'}
                                </span>
                                <span className="text-[9px] font-bold text-muted uppercase tracking-[0.1em] leading-none mt-1 truncate">
                                    {user.email}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-sm bg-heading text-white flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0 border border-primary/20">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main View Area — Compressed Spacing */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10">
                    <div className="max-w-[var(--container-max)] w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
