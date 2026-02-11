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
import { UserRole } from "@/app/actions";

interface SidebarProps {
    userRoles: UserRole[];
}

const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["Master", "Approver", "HR"] },
    { name: "Applications", href: "/admin/applications", icon: Users, roles: ["Master", "Approver", "HR"] },
    { name: "Assessment Slots", href: "/admin/slots", icon: Calendar, roles: ["Master", "HR"] },
    { name: "Interviews", href: "/admin/interviews", icon: ClipboardList, roles: ["Master", "Interviewer", "HR"] },
    { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["Master"] },
];

export default function Sidebar({ userRoles }: SidebarProps) {
    const pathname = usePathname();

    const allowedItems = menuItems.filter(item =>
        item.roles.some(role => userRoles.includes(role as UserRole))
    );

    return (
        <aside className="w-64 bg-white border-r border-border flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6 border-b border-border">
                <Logo />
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {allowedItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded transition-colors group",
                                isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600")} />
                                <span>{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <button className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
