"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Clock, Send, Mail, User, Briefcase, Loader2, Sparkles, Check, X } from "lucide-react";
import { submitInterviewerAvailability, getCandidateBasic } from "@/app/actions";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

function AvailabilityForm() {
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
        if (result.success) setStatus('success');
        else setStatus('error');
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-primary/5 border border-surface p-8 text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Response Received</h1>
                    <p className="text-gray-500 mb-8 px-4">Thank you! The recruitment team has been notified of your availability regarding {candidate?.name}.</p>
                    <button onClick={() => window.close()} className="w-full btn-primary h-12 rounded-xl font-bold">Close Window</button>
                    <p className="mt-6 text-[10px] text-gray-300 uppercase tracking-widest font-bold">Convergent Business Technologies</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="mb-8"><Logo withText={true} className="scale-110" /></div>
            <main className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl shadow-primary/10 border border-surface overflow-hidden">
                <div className="bg-primary p-8 text-white relative">
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10">
                            <Sparkles className="w-3 h-3" /> Meeting Invitation
                        </span>
                        <h1 className="text-2xl font-bold mb-1">Confirm Availability</h1>
                        <p className="text-primary-foreground/80 text-sm">Please respond to the interview request below.</p>
                    </div>
                </div>

                <div className="px-8 pt-8 pb-4">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-border flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-border"><User className="w-6 h-6 text-primary" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{candidate?.name || 'Candidate'}</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium uppercase tracking-tight"><Briefcase className="w-3.5 h-3.5 opacity-60" />{candidate?.position || 'CGAP Program'}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Are you available for this round?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAvailable(true)}
                                className={cn("flex items-center justify-center gap-2 h-14 rounded-2xl border-2 transition-colors font-bold", isAvailable === true ? "bg-emerald-50 border-primary text-primary" : "bg-white border-border text-gray-400")}
                            >
                                <Check className="w-5 h-5" /> Available
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAvailable(false)}
                                className={cn("flex items-center justify-center gap-2 h-14 rounded-2xl border-2 transition-colors font-bold", isAvailable === false ? "bg-rose-50 border-rose-500 text-rose-600" : "bg-white border-border text-gray-400")}
                            >
                                <X className="w-5 h-5" /> Not Available
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Your Professional Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. name@convergentbt.com" className="input-field h-12 bg-gray-50/50" />
                    </div>

                    {isAvailable && (
                        <div className="space-y-1.5 text-left transition-opacity duration-200">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Preferred Time (Optional)</label>
                            <input type="text" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} placeholder="e.g. Tomorrow at 3PM" className="input-field h-12 bg-gray-50/50" />
                        </div>
                    )}

                    <button type="submit" disabled={isSubmitting || isAvailable === null} className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg shadow-xl shadow-primary/20 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Response</>}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default function AvailabilityResponsePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading response form...</div>}>
            <AvailabilityForm />
        </Suspense>
    );
}
