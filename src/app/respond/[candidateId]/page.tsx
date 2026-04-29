"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Send, Mail, User, Briefcase, Loader2, Sparkles } from "lucide-react";
import { submitInterviewerAvailability, getCandidateBasic } from "@/app/actions";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function AvailabilityResponsePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const candidateId = params.candidateId as string;

    const [candidate, setCandidate] = useState<{ name: string, position: string } | null>(null);
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [isAvailable, setIsAvailable] = useState<boolean | null>(
        searchParams.get('available') === 'true' ? true :
            searchParams.get('available') === 'false' ? false : null
    );
    const [preferredTime, setPreferredTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCandidate = async () => {
            const data = await getCandidateBasic(candidateId);
            setCandidate(data);
            setIsLoading(false);
        };
        fetchCandidate();
    }, [candidateId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAvailable === null || !email) return;

        setIsSubmitting(true);
        const result = await submitInterviewerAvailability(candidateId, email, isAvailable, preferredTime);

        if (result.success) {
            setStatus('success');
        } else {
            setStatus('error');
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-primary/5 border border-surface p-8 text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Response Received</h1>
                    <p className="text-gray-500 mb-8 px-4">Thank you! The recruitment team has been notified of your availability regarding {candidate?.name}.</p>
                    <button
                        onClick={() => window.close()}
                        className="w-full btn-primary h-12 rounded-xl font-bold"
                    >
                        Close Window
                    </button>
                    <p className="mt-6 text-[10px] text-gray-300 uppercase tracking-widest font-bold">Convergent Business Technologies</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                <Logo withText={true} className="scale-110" />
            </div>

            <main className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl shadow-primary/10 border border-surface overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="bg-primary p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/20">
                            <Sparkles className="w-3 h-3" />
                            Meeting Invitation
                        </span>
                        <h1 className="text-2xl font-bold mb-1">Confirm Availability</h1>
                        <p className="text-primary-foreground/80 text-sm">Please respond to the interview request below.</p>
                    </div>
                </div>

                {/* Candidate Info Box */}
                <div className="px-8 pt-8 pb-4">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-border flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-border">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{candidate?.name || 'A candidate'}</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium uppercase tracking-tight">
                                <Briefcase className="w-3.5 h-3.5 opacity-60" />
                                {candidate?.position || 'CGAP Program'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6">
                    {/* Availability Toggle */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Are you available for this round?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAvailable(true)}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-14 rounded-2xl border-2 transition-all font-bold",
                                    isAvailable === true
                                        ? "bg-emerald-50 border-primary text-primary shadow-lg shadow-primary/10"
                                        : "bg-white border-border text-gray-500 hover:border-gray-300"
                                )}
                            >
                                <CheckCircle className={cn("w-5 h-5", isAvailable === true ? "text-primary" : "text-gray-300")} />
                                Available
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAvailable(false)}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-14 rounded-2xl border-2 transition-all font-bold",
                                    isAvailable === false
                                        ? "bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-500/10"
                                        : "bg-white border-border text-gray-500 hover:border-gray-300"
                                )}
                            >
                                <XCircle className={cn("w-5 h-5", isAvailable === false ? "text-rose-500" : "text-gray-300")} />
                                Not Available
                            </button>
                        </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            Your Professional Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. name@convergentbt.com"
                            className="input-field h-12 bg-gray-50/50 border-gray-200 focus:bg-white"
                        />
                    </div>

                    {/* Preferred Time (Conditional) */}
                    {isAvailable && (
                        <div className="space-y-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Preferred Time (Optional)
                            </label>
                            <input
                                type="text"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                placeholder="e.g. Tomorrow at 3PM or Wednesday morning"
                                className="input-field h-12 bg-gray-50/50 border-gray-200 focus:bg-white"
                            />
                            <p className="text-[10px] text-gray-400 ml-1 italic">This helps the recruitment team schedule the call.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || isAvailable === null || !email}
                        className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none mt-8 group"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Submit Response
                            </>
                        )}
                    </button>
                </form>
            </main>

            <footer className="mt-8 text-gray-400 text-xs font-medium text-center">
                <p>&copy; {new Date().getFullYear()} Convergent Business Technologies (CBT)</p>
                <p className="opacity-60 text-[10px] mt-1 uppercase tracking-tighter">Powered by Recruitment Portal AI</p>
            </footer>
        </div>
    );
}
