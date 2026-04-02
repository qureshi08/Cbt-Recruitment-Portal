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
        <Link href="/" className={cn("flex items-center gap-2.5", className)}>
            <div className="relative w-8 h-8 overflow-hidden rounded-sm flex items-center justify-center">
                <Image
                    src="/logo.png"
                    alt="CBT Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {withText && (
                <span className="text-[15px] font-bold text-heading tracking-tight">
                    Recruitment Portal
                </span>
            )}
        </Link>
    );
}
