"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    ClipboardList,
    ChevronRight,
    Menu,
    X,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { UserRole, logout } from "@/app/actions";
import { useState } from "react";

interface SidebarProps {
    userRoles: UserRole[];
}

const menuItems = [
    { name: "Executive Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["Master", "Approver", "HR"] },
    { name: "Candidate Pipeline", href: "/admin/applications", icon: Users, roles: ["Master", "Approver", "HR"] },
    { name: "Assessment Slots", href: "/admin/slots", icon: Calendar, roles: ["Master", "HR"] },
    { name: "Interviews", href: "/admin/interviews", icon: ClipboardList, roles: ["Master", "HR", "L1_Interviewer", "L2_Interviewer"] },
    { name: "Portal Settings", href: "/admin/settings", icon: Settings, roles: ["Master"] },
];

export default function Sidebar({ userRoles }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const allowedItems = menuItems.filter(item =>
        item.roles.some(role => userRoles.includes(role as UserRole))
    );

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-3 left-3 z-[60] p-2 bg-white rounded-md shadow-soft border border-border"
            >
                <Menu className="w-4 h-4 text-heading" strokeWidth={1.5} />
            </button>

            {/* Mobile Overlay */}
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
                {/* Logo Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between min-h-[60px] bg-white">
                    <Logo withText={true} />
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-surface">
                        <X className="w-4 h-4 text-muted" strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col pt-5 pb-3 overflow-y-auto custom-scrollbar">
                    {/* Navigation */}
                    <div className="px-3 mb-3">
                        <p className="px-2.5 text-[9.5px] font-semibold text-muted uppercase tracking-[0.18em] mb-3">
                            Portal Navigation
                        </p>
                        <nav className="space-y-0.5">
                            {allowedItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between px-2.5 py-2 rounded-md transition-all group",
                                            isActive
                                                ? "bg-primary text-white font-semibold"
                                                : "text-body hover:bg-primary-muted hover:text-primary"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <item.icon
                                                className={cn(
                                                    "w-3.5 h-3.5 shrink-0 transition-colors",
                                                    isActive ? "text-white" : "text-muted group-hover:text-primary"
                                                )}
                                                strokeWidth={1.5}
                                            />
                                            <span className="text-[12.5px] tracking-tight">{item.name}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-3 h-3 opacity-70" strokeWidth={1.5} />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto px-3">
                        <div className="p-3 bg-surface rounded-md border border-border mb-3">
                            <div className="flex items-center gap-2 text-heading mb-1">
                                <Shield className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Master Auth</span>
                            </div>
                            <p className="text-[10px] text-muted leading-relaxed">
                                Accessing with administrative protocols.
                            </p>
                        </div>

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

                <div className="px-5 py-3 border-t border-border bg-surface">
                    <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.16em] leading-none">
                        © 2026 Convergent
                    </p>
                </div>
            </aside>
        </>
    );
}
