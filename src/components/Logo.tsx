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
            <div className="relative h-8 w-[80px] shrink-0 transition-transform duration-300 group-hover:scale-[1.01]">
                <Image
                    src="/logo.png"
                    alt="CBT Logo"
                    fill
                    className="object-contain object-left"
                    priority
                />
            </div>

            {withText && (
                <div className="flex items-center shrink-0 -ml-1">
                    {/* Compact Brand Divider */}
                    <div className="w-[1.5px] h-6 bg-border group-hover:bg-primary transition-colors mx-2" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-black text-heading tracking-tight uppercase leading-tight">
                            Recruitment
                        </span>
                        <span className="text-[8.5px] font-black text-primary tracking-[0.1em] uppercase leading-none mt-0.5">
                            Portal
                        </span>
                    </div>
                </div>
            )}
        </Link>
    );
}
