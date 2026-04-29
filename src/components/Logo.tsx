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
        <Link href="/" className={cn("flex items-center group", className)}>
            <div className="flex items-center">
                {/* CBT Full Logo */}
                <div className="relative h-9 w-32 transition-transform duration-300 group-hover:scale-[1.01]">
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
                <div className="flex items-center">
                    <div className="w-[1px] h-8 bg-border group-hover:bg-primary transition-colors mx-6" />
                    <div className="flex flex-col min-w-0 transition-all group-hover:translate-x-1">
                        <span className="text-[12px] font-bold text-heading tracking-tight uppercase leading-tight italic font-heading">
                            Recruitment
                        </span>
                        <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase leading-none mt-1">
                            Portal
                        </span>
                    </div>
                </div>
            )}
        </Link>
    );
}
