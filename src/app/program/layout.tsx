import ProgramSidebar from "@/components/program/ProgramSidebar";
import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { ensureBuckets } from "@/app/actions";

export const dynamic = "force-dynamic";

const ACADEMY_ROLES = ["Program_Admin", "Mentor", "Fellow", "Master"];

export default async function ProgramLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user || !user.roles || user.roles.length === 0) {
        redirect("/login");
    }

    // A recruiting-only user (HR/Approver/Interviewer, no Academy role) who
    // navigates here directly is sent back to their own section rather than
    // seeing an empty Academy shell.
    if (!user.roles.some(r => ACADEMY_ROLES.includes(r))) {
        redirect("/admin");
    }

    // Same idempotent bucket check the recruiting layout already does —
    // covers the 'fellow-documents' bucket for a Program_Admin/Mentor/Fellow
    // user who never visits /admin themselves.
    await ensureBuckets();

    const roles = user.roles;

    return (
        <div className="flex h-screen bg-surface overflow-hidden">
            <ProgramSidebar userRoles={roles} />

            <div className="flex-1 ml-0 md:ml-[230px] flex flex-col min-w-0 h-full overflow-hidden">
                <header className="h-[52px] bg-white border-b border-border sticky top-0 z-20 flex items-center justify-between px-5 shrink-0 backdrop-blur-sm bg-white/95">
                    <div className="flex items-center gap-3 min-w-0 ml-12 md:ml-0" />

                    <div className="flex items-center gap-5 shrink-0">
                        <div className="flex items-center gap-2.5 pr-1 py-0.5 cursor-default">
                            <div className="flex flex-col text-right min-w-0 overflow-hidden leading-none">
                                <span className="text-[11px] font-semibold text-heading truncate max-w-[140px]">
                                    {user.full_name || 'System User'}
                                </span>
                                <span className="text-[9.5px] font-medium text-muted uppercase tracking-[0.1em] mt-1 truncate">
                                    {user.email}
                                </span>
                            </div>
                            <div className="w-7 h-7 rounded-md bg-heading text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-5 md:p-7">
                    <div className="max-w-[var(--container-max)] w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
