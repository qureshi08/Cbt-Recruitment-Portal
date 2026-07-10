"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ClipboardList, ScrollText, LogOut, GraduationCap, X, Menu, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import SidebarNavItem from "@/components/SidebarNavItem";
import { UserRole, logout } from "@/app/actions";
import { useState } from "react";

interface ProgramSidebarProps {
    userRoles: UserRole[];
}

// Deliberately its own component, not a reuse/extension of the recruiting
// Sidebar.tsx — different nav items per role, and keeps the recruiting
// Sidebar untouched by anything Academy-related.
const adminItems = [
    { name: "Batches", href: "/program/batches", icon: LayoutDashboard },
    { name: "Mentors", href: "/program/mentors", icon: Users },
    { name: "Activity Log", href: "/program/activity-log", icon: ScrollText },
];

export default function ProgramSidebar({ userRoles }: ProgramSidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const isAdmin = userRoles.includes("Program_Admin") || userRoles.includes("Master");
    const isMentor = userRoles.includes("Mentor");
    const isFellow = userRoles.includes("Fellow");

    const items = isAdmin
        ? adminItems
        : isMentor
            ? [{ name: "My Batch", href: "/program/mentor", icon: ClipboardList }]
            : isFellow
                ? [{ name: "Onboarding", href: "/program/fellow", icon: GraduationCap }]
                : [];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-white rounded-md shadow-soft border border-border"
            >
                <Menu className="w-4 h-4 text-heading" strokeWidth={1.5} />
            </button>

            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-heading/60 backdrop-blur-sm z-[70]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "w-[230px] bg-white border-r border-border flex flex-col h-screen fixed left-0 top-0 z-[80] transition-transform duration-300",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between min-h-[60px] bg-white">
                    <Logo withText={true} />
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-surface">
                        <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col pt-5 pb-3 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-3">
                        <p className="px-2.5 text-[9.5px] font-semibold text-muted uppercase tracking-[0.18em] mb-3">
                            CGAP Academy
                        </p>
                        <nav className="space-y-0.5">
                            {items.map((item) => (
                                <SidebarNavItem
                                    key={item.name}
                                    href={item.href}
                                    label={item.name}
                                    Icon={item.icon}
                                    isActive={pathname === item.href}
                                    onClick={() => setIsOpen(false)}
                                />
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto px-3">
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="flex items-center gap-2.5 px-2.5 py-2 w-full text-muted hover:text-primary hover:bg-primary/5 rounded-md transition-all text-[11px] font-semibold uppercase tracking-[0.12em] mb-2"
                        >
                            <Shield className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                            <span>Security Settings</span>
                        </button>

                        <form action={logout} className="border-t border-border pt-3">
                            <button
                                type="submit"
                                className="flex items-center gap-2.5 px-2.5 py-2 w-full text-muted hover:text-red-600 hover:bg-red-50/50 rounded-md transition-all text-[11px] font-semibold uppercase tracking-[0.12em]"
                            >
                                <LogOut className="w-3.5 h-3.5 shrink-0 rotate-180" strokeWidth={1.5} />
                                <span>Secure Logout</span>
                            </button>
                        </form>
                    </div>
                </div>

                <ChangePasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                />

                <div className="px-5 py-3 border-t border-border bg-surface">
                    <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.16em] leading-none">
                        © 2026 Convergent
                    </p>
                </div>
            </aside>
        </>
    );
}
