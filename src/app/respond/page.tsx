"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, Send, Mail, User, Briefcase, Loader2, Sparkles, Check, X, Calendar, ShieldCheck, AlertCircle } from "lucide-react";
import { submitInterviewerAvailability, getCandidateBasic, getInterviewerNameByEmail } from "@/app/actions";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

function AvailabilityForm() {
    const searchParams = useSearchParams();
    const candidateId = searchParams.get('id') as string;

    const [candidate, setCandidate] = useState<{ name: string, position: string } | null>(null);
    const [email, setEmail] = useState("");
    const [interviewerName, setInterviewerName] = useState("");
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [preferredDateTime, setPreferredDateTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState(true);
    const [isLegacyLink, setIsLegacyLink] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (!candidateId) {
                if (isMounted) setIsLoading(false);
                return;
            };
            try {
                const cData = await getCandidateBasic(candidateId);
                if (!isMounted) return;
                setCandidate(cData);

                const urlEmail = searchParams.get('email');
                const urlAvail = searchParams.get('available');

                if (urlAvail === 'true') setIsAvailable(true);
                if (urlAvail === 'false') setIsAvailable(false);

                if (urlEmail && urlEmail !== "[INTERVIEWER_EMAIL]") {
                    const decodedEmail = decodeURIComponent(urlEmail);
                    setEmail(decodedEmail);
                    const name = await getInterviewerNameByEmail(decodedEmail);
                    if (isMounted) setInterviewerName(name || "Interviewer");
                } else if (urlEmail === "[INTERVIEWER_EMAIL]") {
                    setIsLegacyLink(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, [candidateId, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAvailable === null || (!email && !isLegacyLink) || !candidateId) return;

        setIsSubmitting(true);
        let formattedTime = "";
        if (preferredDateTime) {
            const dt = new Date(preferredDateTime);
            formattedTime = dt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
        }

        const result = await submitInterviewerAvailability(candidateId, email || "unknown", isAvailable, formattedTime, interviewerName || "Interviewer");
        if (result.success) setStatus('success');
        else setStatus('error');
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary/20" /></div>;

    if (!candidateId || isLegacyLink) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-10 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-2">Invalid or Legacy Link</h1>
                <p className="text-gray-500 text-sm">Please use the latest invitation link from your email.</p>
            </div>
        </div>
    );

    if (status === 'success') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-surface max-w-sm w-full">
                <Check className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2 italic">Success</h2>
                <p className="text-gray-500 text-sm mb-8">Response shared for {candidate?.name}.</p>
                <button onClick={() => window.close()} className="w-full btn-primary h-12 rounded-xl">Close</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#009245_1px,transparent_1px)] [background-size:40px_40px] [background-opacity:0.02]">
            <Logo withText={true} className="mb-10 opacity-50" />
            <main className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-surface overflow-hidden">
                <div className="bg-primary p-10 text-white text-center">
                    <h1 className="text-2xl font-bold italic tracking-tight">Confirm Availability</h1>
                </div>
                <div className="p-8 space-y-6">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-border flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-bold truncate italic">{interviewerName}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{email}</p>
                        </div>
                    </div>

                    <div className="text-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-800 italic">{candidate?.name}</p>
                        <p className="text-[10px] text-emerald-600 uppercase tracking-tighter">{candidate?.position}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setIsAvailable(true)} className={cn("h-14 rounded-2xl border-2 font-bold transition-all", isAvailable === true ? "bg-emerald-50 border-primary text-primary" : "bg-white border-border text-gray-300")}><Check className="w-5 h-5 mx-auto" /></button>
                            <button type="button" onClick={() => setIsAvailable(false)} className={cn("h-14 rounded-2xl border-2 font-bold transition-all", isAvailable === false ? "bg-rose-50 border-rose-500 text-rose-600" : "bg-white border-border text-gray-300")}><X className="w-5 h-5 mx-auto" /></button>
                        </div>

                        {isAvailable && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> Proposed Time</label>
                                <input type="datetime-local" value={preferredDateTime} onChange={(e) => setPreferredDateTime(e.target.value)} className="input-field h-14 bg-gray-50 rounded-xl" required />
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting || isAvailable === null || (isAvailable && !preferredDateTime)} className="w-full btn-primary h-16 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg disabled:opacity-50 transition-all">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Share Status</>}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default function AvailabilityResponsePage() {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-primary/10 tracking-[1em]">CBT</div>}><AvailabilityForm /></Suspense>;
}
