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
    { name: "Evaluation Center", href: "/admin/interviews", icon: ClipboardList, roles: ["Master", "HR", "L1_Interviewer", "L2_Interviewer"] },
    { name: "Portal Controls", href: "/admin/settings", icon: Settings, roles: ["Master"] },
];

export default function Sidebar({ userRoles }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const allowedItems = menuItems.filter(item =>
        item.roles.some(role => userRoles.includes(role as UserRole))
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-sm shadow-sm border border-border"
            >
                <Menu className="w-5 h-5 text-heading" />
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
                    "w-[260px] bg-white border-r border-border flex flex-col h-screen fixed left-0 top-0 z-[80] transition-transform duration-300",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo Header — Strictly Aligned */}
                <div className="px-6 py-6 border-b border-border flex items-center justify-between min-h-[80px] bg-white">
                    <Logo withText={true} />
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-sm hover:bg-surface">
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col pt-8 pb-4">
                    {/* Navigation Section */}
                    <div className="px-4 mb-4">
                        <p className="px-3 text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
                            Registry Navigation
                        </p>
                        <nav className="space-y-1">
                            {allowedItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-sm transition-all group",
                                            isActive
                                                ? "bg-primary text-white shadow-premium font-bold"
                                                : "text-body hover:bg-surface hover:text-heading"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-white" : "text-muted group-hover:text-primary")} />
                                            <span className="text-[13px] tracking-tight">{item.name}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto px-4">
                        <div className="p-4 bg-surface rounded-sm border border-border mb-4">
                            <div className="flex items-center gap-3 text-heading mb-2">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Master Auth</span>
                            </div>
                            <p className="text-[10px] text-muted font-medium leading-relaxed">
                                You are accessing with administrative protocols.
                            </p>
                        </div>

                        <form action={logout} className="border-t border-border pt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-3 px-3 py-2.5 w-full text-muted hover:text-red-600 hover:bg-red-50/50 transition-all text-xs font-bold uppercase tracking-widest"
                            >
                                <LogOut className="w-4 h-4 shrink-0 rotate-180" />
                                <span>Registry Exit</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border bg-surface">
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] leading-none">
                        © 2026 Convergent
                    </p>
                </div>
            </aside>
        </>
    );
}
