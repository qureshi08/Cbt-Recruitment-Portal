"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    ChevronRight,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { UserRole, logout } from "@/app/actions";

interface SidebarProps {
    userRoles: UserRole[];
}

const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["Master", "Approver", "HR"] },
    { name: "Applications", href: "/admin/applications", icon: Users, roles: ["Master", "Approver", "HR"] },
    { name: "Assessment Slots", href: "/admin/slots", icon: Calendar, roles: ["Master", "HR"] },
    { name: "Interviews", href: "/admin/interviews", icon: ClipboardList, roles: ["Master", "HR", "L1_Interviewer", "L2_Interviewer"] },
    { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["Master"] },
];

export default function Sidebar({ userRoles }: SidebarProps) {
    const pathname = usePathname();

    const allowedItems = menuItems.filter(item =>
        item.roles.some(role => userRoles.includes(role as UserRole))
    );

    return (
        <aside className="w-60 glass border-r border-border flex flex-col h-screen fixed left-0 top-0 z-30">
            <div className="p-5 border-b border-border/40">
                <Logo withText={true} />
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {allowedItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-xl transition-all group",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold"
                                    : "text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-400 group-hover:text-primary transition-colors")} />
                                <span className="text-[13px] tracking-tight">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <form action={logout}>
                    <button
                        type="submit"
                        className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
