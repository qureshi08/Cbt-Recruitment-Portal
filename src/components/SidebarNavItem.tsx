"use client";

import Link, { useLinkStatus } from "next/link";
import { Loader2, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
    href: string;
    label: string;
    Icon: LucideIcon;
    isActive: boolean;
    onClick?: () => void;
}

// Inner component that lives inside <Link> so it can call useLinkStatus().
// `pending` flips true the instant the user clicks, before the destination
// page has finished rendering — that's what gives the click immediate
// visual feedback instead of the previous 1-2s 'is anything happening?'
// silence.
function NavItemContent({ label, Icon, isActive }: Omit<SidebarNavItemProps, 'href' | 'onClick'>) {
    const { pending } = useLinkStatus();
    const showActive = isActive || pending;

    return (
        <div
            className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-md transition-all group",
                showActive
                    ? "bg-primary text-white font-semibold shadow-sm scale-[0.99]"
                    : "text-body hover:bg-primary-muted hover:text-primary",
                pending && "animate-pulse"
            )}
        >
            <div className="flex items-center gap-2.5">
                <Icon
                    className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-colors",
                        showActive ? "text-white" : "text-muted group-hover:text-primary"
                    )}
                    strokeWidth={1.5}
                />
                <span className="text-[12.5px] tracking-tight">{label}</span>
            </div>
            {pending ? (
                <Loader2 className="w-3 h-3 animate-spin opacity-90" strokeWidth={2} />
            ) : (
                isActive && <ChevronRight className="w-3 h-3 opacity-70" strokeWidth={1.5} />
            )}
        </div>
    );
}

export default function SidebarNavItem({ href, label, Icon, isActive, onClick }: SidebarNavItemProps) {
    return (
        <Link href={href} onClick={onClick} prefetch={true}>
            <NavItemContent label={label} Icon={Icon} isActive={isActive} />
        </Link>
    );
}
