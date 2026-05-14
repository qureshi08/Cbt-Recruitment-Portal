"use client";

import { Video, Check, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MicrosoftTeamsManager() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const microsoft = searchParams.get('microsoft');
        if (microsoft === 'success') setStatus('success');
        if (microsoft === 'error') {
            setStatus('error');
            setMsg(searchParams.get('msg') || "Failed to connect");
        }
    }, [searchParams]);

    const handleConnect = () => {
        window.location.href = "/api/microsoft/auth";
    };

    return (
        <section className="border-t border-border pt-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <h3
                    className="text-heading font-bold"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", letterSpacing: "-0.02em" }}
                >
                    Microsoft <span className="italic-accent">Teams</span> Integration
                </h3>
            </div>

            <div className="bg-surface border border-border rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <p className="text-[13px] font-bold text-heading">Enable Automated Meeting Generation</p>
                    <p className="text-[11px] text-muted leading-relaxed max-w-md">
                        Connect your work account to allow the portal to create real Microsoft Teams meetings
                        automatically. No IT policy or PowerShell required!
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-[11px] font-bold uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4" /> Connected
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="btn-primary-v2 whitespace-nowrap !py-2.5"
                    >
                        <Video className="w-3.5 h-3.5" />
                        Connect Microsoft Teams
                    </button>
                )}
            </div>

            {status === 'error' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-[11px] text-red-600 font-medium">
                    <AlertCircle className="w-4 h-4" /> {msg}
                </div>
            )}
        </section>
    );
}
