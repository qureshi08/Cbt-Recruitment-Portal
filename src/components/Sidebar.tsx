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
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { UserRole, logout } from "@/app/actions";
import { useState } from "react";

interface SidebarProps {
    userRoles: UserRole[];
}

const menuItems = [
    { name: "Recruiter Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["Master", "Approver", "HR"] },
    { name: "Applications", href: "/admin/applications", icon: Users, roles: ["Master", "Approver", "HR"] },
    { name: "Assessment Slots", href: "/admin/slots", icon: Calendar, roles: ["Master", "HR"] },
    { name: "Interviews", href: "/admin/interviews", icon: ClipboardList, roles: ["Master", "HR", "L1_Interviewer", "L2_Interviewer"] },
    { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["Master"] },
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
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-md shadow-sm border border-gray-100"
            >
                <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "w-[220px] bg-white/80 backdrop-blur-xl border-r border-border/50 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo Header */}
                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-white/60 min-h-[56px]">
                    <Logo withText={true} />
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {allowedItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-gray-400 group-hover:text-primary transition-colors")} />
                                    <span className="text-[12px] tracking-tight truncate">{item.name}</span>
                                </div>
                                {isActive && <ChevronRight className="w-3 h-3 opacity-80 shrink-0" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-border/40 bg-white/60">
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-3 py-2 w-full text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium"
                        >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span>Logout</span>
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
