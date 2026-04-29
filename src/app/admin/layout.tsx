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
        <div className="flex h-screen bg-surface-alt overflow-hidden">
            <Sidebar userRoles={roles} />

            {/* Main content — offset by sidebar width (260px), no horizontal overflow */}
            <div className="flex-1 ml-0 md:ml-[260px] flex flex-col min-w-0 h-full overflow-hidden">

                {/* Top Header — Clean & High Contrast */}
                <header className="h-[80px] bg-white border-b border-border sticky top-0 z-20 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Dynamic Page Indicator (optional) */}
                    </div>

                    {/* Right side — notifications + user profile */}
                    <div className="flex items-center gap-6 shrink-0">
                        <NotificationBell />

                        <div className="flex items-center gap-3 bg-surface-alt pr-4 pl-1.5 py-1.5 rounded-sm border border-border shadow-soft group hover:border-primary transition-all cursor-default">
                            <div className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center font-bold text-sm shadow-premium shrink-0">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col text-left min-w-0 overflow-hidden">
                                <span className="text-[12px] font-bold text-heading leading-tight truncate max-w-[140px]">
                                    {user.full_name || 'System User'}
                                </span>
                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest leading-none mt-0.5 truncate max-w-[180px]">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main View Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white/40">
                    <div className="p-8 max-w-7xl w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
