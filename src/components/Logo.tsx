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
                <span className="text-xl font-bold text-gray-800 tracking-tight">
                    Recruitment Portal
                </span>
            )}
        </Link>
    );
}
