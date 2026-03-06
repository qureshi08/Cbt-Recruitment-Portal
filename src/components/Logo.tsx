"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LogoProps {
    className?: string;
    withText?: boolean;
}

export default function Logo({ className, withText = true }: LogoProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link href="/" className={cn("flex items-center gap-2", className)}>
            <div className="relative w-10 h-10 overflow-hidden rounded-sm flex items-center justify-center">
                <Image
                    src="/logo.png"
                    alt="CBT Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {withText && (
                <span className="text-[17px] font-semibold text-gray-800 tracking-normal">
                    Recruitment Portal
                </span>
            )}
        </Link>
    );
}
