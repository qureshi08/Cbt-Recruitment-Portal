"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    withText?: boolean;
}

export default function Logo({ className, withText = true }: LogoProps) {
    return (
        <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
            <div className="flex items-center">
                {/* CBT Full Logo - Bigger & Cohesive */}
                <div className="relative h-8 w-34 transition-transform duration-300 group-hover:scale-[1.01]">
                    <Image
                        src="/logo.png"
                        alt="CBT Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </div>

            {withText && (
                <div className="flex flex-col min-w-0 -ml-0.5">
                    <span className="text-[11px] font-black text-heading tracking-tight uppercase leading-[1.1] truncate">
                        Recruitment
                    </span>
                    <span className="text-[10px] font-bold text-primary/80 tracking-[0.1em] uppercase leading-none truncate">
                        Portal
                    </span>
                </div>
            )}
        </Link>
    );
}







