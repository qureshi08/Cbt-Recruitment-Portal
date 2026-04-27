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
        <Link href="/" className={cn("flex items-center gap-2 group", className)}>
            <div className="flex items-center">
                {/* CBT Full Logo - Enlarged */}
                <div className="relative h-9 w-36 pb-0.5">
                    <Image
                        src="/logo.png"
                        alt="CBT Logo"
                        fill
                        className="object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
                        priority
                    />
                </div>
            </div>

            {withText && (
                <div className="h-7 w-[1.5px] bg-border/40 hidden md:block mx-1" />
            )}

            {withText && (
                <div className="hidden md:flex flex-col min-w-0">
                    <span className="text-[12px] font-black text-heading tracking-[0.02em] uppercase leading-none truncate">
                        Recruitment
                    </span>
                    <span className="text-[10px] font-medium text-text-muted tracking-[0.15em] uppercase mt-0.5 truncate">
                        Portal
                    </span>
                </div>
            )}
        </Link>
    );
}





