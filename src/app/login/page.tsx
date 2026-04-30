"use client";

import { useState, useEffect } from "react";
import { login } from "@/app/actions";
import { Shield, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (cooldown > 0) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);

            if (nextAttempts >= 3) {
                setError("Excessive failed attempts. Cool-down active.");
                setCooldown(30);
                setAttempts(0);
            } else {
                setError(`Authentication failure. ${3 - nextAttempts} attempts remaining.`);
            }
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5 grid-bg">
            <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Branding Block */}
                <div className="flex flex-col items-center mb-8">
                    <Logo withText={true} />
                </div>

                {/* Login Card */}
                <div className="bg-white border border-border rounded-[12px] overflow-hidden" style={{ boxShadow: "var(--shadow-premium)" }}>
                    <div className="h-[3px] w-full bg-primary" />
                    <div className="p-7">
                        <div className="mb-6">
                            <h2
                                className="text-[20px] font-bold text-heading"
                                style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
                            >
                                Admin <span className="italic-accent">Registry</span>
                            </h2>
                            <p className="text-[10.5px] font-semibold text-muted uppercase tracking-[0.12em] mt-1">
                                Authorized entry sequence only
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 text-[11.5px] font-medium rounded-md flex items-start gap-2">
                                    <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.14em]">Identification</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="input-field pl-9"
                                        placeholder="recruiter@convergentbt.com"
                                        disabled={cooldown > 0}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.14em]">Authorization Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="input-field pl-9"
                                        placeholder="••••••••"
                                        disabled={cooldown > 0}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || cooldown > 0}
                                className="btn-primary w-full !py-2.5 !text-[12.5px] mt-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                                ) : (
                                    <>
                                        <span>Establish Session</span>
                                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link href="/" className="text-[10px] font-semibold text-muted hover:text-primary transition-colors uppercase tracking-[0.18em]">
                        ← Public Navigation
                    </Link>
                </div>
            </div>
        </div>
    );
}
