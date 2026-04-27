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
            <div className="flex items-center">
                {/* CBT Full Logo */}
                <div className="relative h-10 w-44 transition-transform duration-300 group-hover:scale-[1.01]">
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
                <div className="flex flex-col min-w-0 -ml-1 border-l border-border pl-3 group-hover:border-primary transition-colors">
                    <span className="text-[12px] font-black text-heading tracking-tight uppercase leading-tight italic">
                        Recruitment
                    </span>
                    <span className="text-[11px] font-bold text-primary tracking-[0.05em] uppercase leading-none mt-0.5">
                        Portal
                    </span>
                </div>
            )}
        </Link>
    );
}








