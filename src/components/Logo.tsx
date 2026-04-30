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
        <Link href="/" className={cn("flex items-center shrink-0", className)}>
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
        </Link>
    );
}
