"use client";

import { useState, useEffect } from "react";
import { login } from "@/app/actions";
import { Shield, Mail, Lock, Loader2, ArrowRight, Activity, Cpu } from "lucide-react";
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
                setError("Protocol Violation: Excessive failed attempts detected. Cool-down sequence initiated.");
                setCooldown(30);
                setAttempts(0);
            } else {
                setError(`Authentication Failure. ${3 - nextAttempts} attempt${3 - nextAttempts === 1 ? '' : 's'} remain before lockout.`);
            }
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/[0.02] rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.01]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.06)] border border-border/60 animate-in fade-in zoom-in duration-700">
                    <div className="flex flex-col items-center mb-12">
                        <Logo withText={true} className="scale-110" />
                        <div className="w-12 h-0.5 bg-gray-100 rounded-full my-8" />
                        <div className="flex items-center gap-2 px-3 py-1 bg-heading text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full italic mb-4">
                            <Shield className="w-3 h-3" />
                            Internal Access
                        </div>
                        <h2 className="text-2xl font-black text-heading uppercase tracking-tight italic">Authentication</h2>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Convergent Recruiter Command Center</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-tight rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
                                <Shield className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {cooldown > 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-black uppercase tracking-widest rounded-2xl text-center flex flex-col items-center gap-2">
                                <Activity className="w-4 h-4 animate-pulse" />
                                <span>Lockout Active · {cooldown}s Remaining</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Identity Endpoint</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="input-field pl-12 h-14 !rounded-2xl shadow-sm bg-gray-50/50 focus:bg-white transition-all"
                                    placeholder="recruiter@convergentbt.com"
                                    disabled={cooldown > 0}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Access Protocol</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="input-field pl-12 h-14 !rounded-2xl shadow-sm bg-gray-50/50 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                    disabled={cooldown > 0}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || cooldown > 0}
                            className="w-full h-16 bg-heading hover:bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl shadow-heading/10 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : cooldown > 0 ? (
                                "ACCESS DENIED"
                            ) : (
                                <>
                                    <span>Establish Session</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 opacity-20">
                            <Cpu className="w-4 h-4" />
                            <div className="w-px h-3 bg-gray-400" />
                            <Shield className="w-4 h-4" />
                            <div className="w-px h-3 bg-gray-400" />
                            <Activity className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] text-muted font-black tracking-[0.3em] uppercase italic">
                            © 2026 Convergent Systems
                        </p>
                    </div>
                </div>
                <div className="mt-8 flex justify-center">
                    <Link href="/" className="text-[10px] font-black text-muted hover:text-primary transition-colors uppercase tracking-[0.3em] italic">
                        Back to Public Terminal
                    </Link>
                </div>
            </div>
        </div>
    );
}
