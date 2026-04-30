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
        <Link href="/" className={cn("flex items-center group shrink-0", className)}>
            {/* CBT Logo - Compact Box */}
            <div className="relative group shrink-0">
                <div className="relative h-10 w-28 transition-transform duration-300 group-hover:scale-[1.02]">
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
                <div className="flex items-center gap-2">
                    <div className="w-[1px] h-6 bg-border group-hover:bg-primary/20 transition-colors" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-heading tracking-tight uppercase leading-tight italic">
                            Recruitment
                        </span>
                        <span className="text-[10px] font-bold text-primary tracking-[0.05em] uppercase leading-none mt-0.5">
                            Portal
                        </span>
                    </div>
                </div>
            )}
        </Link>
    );
}
