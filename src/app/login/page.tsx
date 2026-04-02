"use client";

import { useState, useEffect } from "react";
import { login } from "@/app/actions";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase-client";

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

    async function handleMicrosoftLogin() {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                scopes: 'email profile openid',
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });
    }

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
            setError(`${result.error} (Attempts: ${nextAttempts}/3)`);

            if (nextAttempts >= 3) {
                setCooldown(30);
                setAttempts(0);
            }
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-border animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center space-y-2">
                    <Logo />
                    <h2 className="text-2xl font-bold text-heading mt-6 font-heading">Recruiter Portal</h2>
                    <p className="text-text-muted text-sm">Secure sign-in for internal users</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleMicrosoftLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl transition-all hover:bg-gray-50 font-semibold text-heading shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0h10v10H0z" fill="#f25022" /><path d="M11 0h10v10H11z" fill="#7fba00" /><path d="M0 11h10v10H0z" fill="#00a4ef" /><path d="M11 11h10v10H11z" fill="#ffb900" />
                        </svg>
                        Sign in with Microsoft
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-text-muted">Or sign in with password</span></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-shake">
                                <Shield className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-text-muted uppercase ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="input-field pl-10 h-11"
                                        placeholder="recruiter@cbt.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-text-muted uppercase ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="input-field pl-10 h-11"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || cooldown > 0}
                            className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : cooldown > 0 ? (
                                `Locked: ${cooldown}s`
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>

                <div className="pt-4 text-center">
                    <p className="text-[11px] text-text-muted/60">
                        Convergent Business Technologies | Recruiter Portal
                    </p>
                </div>
            </div>
        </div>
    );
}
