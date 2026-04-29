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
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <Sidebar userRoles={roles} />

            {/* Main content — offset by sidebar width, no horizontal overflow */}
            <div className="flex-1 ml-0 md:ml-[220px] flex flex-col min-w-0 h-full overflow-hidden">

                {/* Top Header */}
                <header className="h-14 bg-white/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-5 border-b border-border/30 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] shrink-0">
                    {/* Page context — removed redundant text as per request */}
                    <div className="flex items-center gap-3 min-w-0">
                    </div>

                    {/* Right side — notifications + user pill */}
                    <div className="flex items-center gap-3 shrink-0">
                        <NotificationBell />

                        <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-[11px] shadow-md shadow-primary/20 shrink-0">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col text-left min-w-0">
                                <span className="text-[12px] font-semibold text-heading leading-none truncate max-w-[120px]">
                                    {user.full_name || 'User'}
                                </span>
                                <span className="text-[10px] font-medium text-muted leading-none mt-0.5 truncate max-w-[160px]">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable page content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="p-4 md:p-6 max-w-[1440px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
