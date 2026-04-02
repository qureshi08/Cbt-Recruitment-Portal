"use client";

import { useState, useEffect } from "react";
import { login } from "@/app/actions";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

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
                setError("Too many failed attempts. Please wait 30 seconds before trying again.");
                setCooldown(30);
                setAttempts(0);
            } else {
                setError(`Invalid credentials. ${3 - nextAttempts} attempt${3 - nextAttempts === 1 ? '' : 's'} remaining.`);
            }
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-border animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center space-y-2 mb-8">
                    <Logo />
                    <h2 className="text-2xl font-bold text-heading mt-4 font-heading">Recruiter Portal</h2>
                    <p className="text-text-muted text-sm">Sign in to access your portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-in fade-in duration-300">
                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {cooldown > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-lg text-center font-semibold">
                            Locked out — try again in {cooldown}s
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="input-field pl-10 h-11"
                                placeholder="recruiter@convergentbt.com"
                                disabled={cooldown > 0}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                name="password"
                                type="password"
                                required
                                className="input-field pl-10 h-11"
                                placeholder="••••••••"
                                disabled={cooldown > 0}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || cooldown > 0}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : cooldown > 0 ? (
                            `Locked — ${cooldown}s`
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <p className="text-[11px] text-text-muted/50 text-center mt-8">
                    Convergent Business Technologies · Recruiter Portal
                </p>
            </div>
        </div>
    );
}
