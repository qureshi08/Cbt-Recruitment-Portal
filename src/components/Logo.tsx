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
            {/* Logo image — compact 32px height */}
            <div className="relative group shrink-0">
                <div className="relative h-8 w-24 transition-transform duration-300 group-hover:scale-[1.02]">
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
                    <div className="flex flex-col min-w-0 leading-none">
                        <span
                            className="text-[10.5px] font-bold text-heading tracking-tight uppercase"
                            style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                        >
                            Recruitment
                        </span>
                        <span className="text-[9px] font-semibold text-primary tracking-[0.18em] uppercase mt-1">
                            Portal
                        </span>
                    </div>
                </div>
            )}
        </Link>
    );
}
