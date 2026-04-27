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
        <Link href="/" className={cn("flex items-center gap-3", className)}>
            <div className="flex items-center gap-2">
                {/* CBT Logo */}
                <div className="relative h-6 w-24">
                    <Image
                        src="/logo.png"
                        alt="CBT Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>

                {/* Vertical Separator */}
                <div className="h-5 w-[1px] bg-border/60" />

                {/* CGAP Logo */}
                <div className="relative h-6 w-20">
                    <Image
                        src="/cgap-logo.png"
                        alt="CGAP Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </div>

            {withText && (
                <div className="h-4 w-[1px] bg-border/40 hidden xl:block" />
            )}

            {withText && (
                <span className="text-[13px] font-bold text-heading tracking-tight hidden xl:block uppercase">
                    Portal
                </span>
            )}
        </Link>
    );
}


