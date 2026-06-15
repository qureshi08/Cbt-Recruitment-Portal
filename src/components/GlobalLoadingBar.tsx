"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getActiveLoaders, startLoading, endLoading } from "@/lib/loading";

// Thin animated bar at the top of the viewport. Visible whenever any
// part of the app is mid-request. Listens to global loading events plus
// Next.js navigation changes so route transitions also flash a brief bar.
export default function GlobalLoadingBar() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Global tick listener — re-derives loading state from the shared counter.
    useEffect(() => {
        const sync = () => setIsLoading(getActiveLoaders() > 0);
        window.addEventListener("cbt:loading:tick", sync);
        return () => window.removeEventListener("cbt:loading:tick", sync);
    }, []);

    // Briefly show the bar on every navigation so users get feedback for link
    // clicks too, not just server-action calls.
    useEffect(() => {
        startLoading();
        const t = setTimeout(() => endLoading(), 400);
        return () => {
            clearTimeout(t);
            endLoading();
        };
    }, [pathname, searchParams]);

    return (
        <div
            aria-hidden="true"
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none overflow-hidden"
        >
            <div
                className={`h-full bg-primary shadow-[0_0_10px_rgba(0,146,69,0.6)] transition-opacity duration-200 ${isLoading ? "opacity-100" : "opacity-0"
                    }`}
                style={{
                    width: "35%",
                    animation: isLoading ? "cbt-loading-bar 1.2s ease-in-out infinite" : "none",
                }}
            />
            <style>{`
                @keyframes cbt-loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(380%); }
                }
            `}</style>
        </div>
    );
}
