"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getActiveLoaders, startLoading, endLoading } from "@/lib/loading";

// Two-layer global busy indicator:
//   1. A thin animated bar at the top of the viewport — visible the instant
//      something is in flight, so quick actions get an immediate signal.
//   2. A centered modal overlay with a clearly visible spinner and
//      'Processing…' text — appears only after the action has been running
//      for >300ms so brief navigations don't flash a modal at the user.
//      The overlay covers the viewport and absorbs clicks, which doubles as
//      protection against accidental double-submits.
//
// Both layers are driven by the same event bus (see src/lib/loading.ts).
export default function GlobalLoadingBar() {
    const [isLoading, setIsLoading] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [longRunning, setLongRunning] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const sync = () => setIsLoading(getActiveLoaders() > 0);
        window.addEventListener("cbt:loading:tick", sync);
        return () => window.removeEventListener("cbt:loading:tick", sync);
    }, []);

    // Brief flash of the bar on every navigation so link clicks get feedback.
    useEffect(() => {
        startLoading();
        const t = setTimeout(() => endLoading(), 400);
        return () => {
            clearTimeout(t);
            endLoading();
        };
    }, [pathname, searchParams]);

    // Show the centered overlay only after 300ms of continuous loading.
    useEffect(() => {
        if (!isLoading) {
            setShowOverlay(false);
            setLongRunning(false);
            return;
        }
        const overlayTimer = setTimeout(() => setShowOverlay(true), 300);
        // After 6 seconds, swap in a 'still working' hint so users know
        // the request hasn't been forgotten about.
        const longTimer = setTimeout(() => setLongRunning(true), 6000);
        return () => {
            clearTimeout(overlayTimer);
            clearTimeout(longTimer);
        };
    }, [isLoading]);

    return (
        <>
            {/* Layer 1: top progress bar — visible immediately */}
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

            {/* Layer 2: centered overlay — appears after 300ms */}
            {showOverlay && (
                <div
                    aria-live="polite"
                    aria-busy="true"
                    className="fixed inset-0 z-[9998] flex items-center justify-center bg-heading/45 backdrop-blur-[2px] animate-in fade-in duration-200"
                >
                    <div className="bg-white rounded-md shadow-premium px-9 py-7 flex flex-col items-center gap-3 min-w-[240px] max-w-[320px] border border-border text-center">
                        <Loader2 className="w-9 h-9 text-primary animate-spin" strokeWidth={1.5} />
                        <p className="text-[12px] font-bold text-heading uppercase tracking-[0.18em] mt-1">
                            Processing
                        </p>
                        <p className="text-[11px] text-muted font-medium leading-relaxed">
                            {longRunning
                                ? "This is taking a little longer than usual — please don't close or refresh this tab."
                                : "Please wait, do not refresh this tab."}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
