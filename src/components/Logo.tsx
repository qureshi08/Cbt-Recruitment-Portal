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
        <Link href="/" className={cn("flex items-center gap-3 group", className)}>
            <div className="flex items-center gap-4">
                {/* CBT Full Logo */}
                <div className="relative h-7 w-32 pb-0.5">
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
                <div className="h-6 w-[1.5px] bg-border/40 hidden md:block mx-1" />
            )}

            {withText && (
                <div className="hidden md:flex flex-col">
                    <span className="text-[13px] font-black text-heading tracking-[0.05em] uppercase leading-none">
                        Recruitment
                    </span>
                    <span className="text-[11px] font-medium text-text-muted tracking-[0.2em] uppercase mt-0.5">
                        Portal
                    </span>
                </div>
            )}
        </Link>
    );
}




