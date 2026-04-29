"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Clock, Send, Mail, User, Briefcase, Loader2, Sparkles, Check, X, Calendar, ShieldCheck, AlertCircle } from "lucide-react";
import { submitInterviewerAvailability, getCandidateBasic, getInterviewerNameByEmail } from "@/app/actions";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

function AvailabilityForm() {
    const params = useParams();
    const searchParams = useSearchParams();
    const candidateId = params.candidateId as string;

    const [candidate, setCandidate] = useState<{ name: string, position: string } | null>(null);
    const [email, setEmail] = useState("");
    const [interviewerName, setInterviewerName] = useState("");
    const [isAvailable, setIsAvailable] = useState<boolean | null>(
        searchParams.get('available') === 'true' ? true :
            searchParams.get('available') === 'false' ? false : null
    );
    const [preferredDateTime, setPreferredDateTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState(true);
    const [isLegacyLink, setIsLegacyLink] = useState(false);

    useEffect(() => {
        const initPortal = async () => {
            // 1. Fetch Candidate
            const cData = await getCandidateBasic(candidateId);
            setCandidate(cData);

            // 2. Extract and Verify Identity
            const urlEmail = searchParams.get('email');
            if (urlEmail && urlEmail !== "[INTERVIEWER_EMAIL]") {
                const decodedEmail = decodeURIComponent(urlEmail);
                setEmail(decodedEmail);

                // Fetch Name automatically
                const name = await getInterviewerNameByEmail(decodedEmail);
                setInterviewerName(name || "Interviewer");
            } else if (urlEmail === "[INTERVIEWER_EMAIL]") {
                setIsLegacyLink(true);
            }

            setIsLoading(false);
        };
        initPortal();
    }, [candidateId, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAvailable === null || (!email && !isLegacyLink)) return;

        setIsSubmitting(true);

        let formattedTime = "";
        if (preferredDateTime) {
            const dt = new Date(preferredDateTime);
            formattedTime = dt.toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });
        }

        const result = await submitInterviewerAvailability(
            candidateId,
            email || "unknown@interviewer.com",
            isAvailable,
            formattedTime,
            interviewerName || "Anonymous Interviewer"
        );

        if (result.success) setStatus('success');
        else setStatus('error');
        setIsSubmitting(false);
    };

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="w-12 h-12 animate-spin text-primary/30" />
            <p className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] italic">Authenticating...</p>
        </div>
    );

    if (isLegacyLink) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-rose-100 p-10 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Incomplete Link</h1>
                    <p className="text-gray-500 mb-8 leading-relaxed">This invitation link is missing identity details. Please check your latest email for a refreshed link or contact the recruitment team.</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-surface p-10 text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Check className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 italic">Response Shared</h1>
                    <p className="text-gray-500 mb-10 px-4 leading-relaxed">Thank you, <strong>{interviewerName}</strong>. Your availability for <strong>{candidate?.name}</strong> has been successfully recorded.</p>
                    <button onClick={() => window.close()} className="w-full btn-primary h-14 rounded-2xl font-bold">Portal Closed</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#009245_1px,transparent_1px)] [background-size:32px_32px] [background-opacity:0.02]">
            <div className="mb-10 opacity-80"><Logo withText={true} /></div>

            <main className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl shadow-primary/20 border border-surface overflow-hidden">
                <div className="bg-primary p-12 text-white relative">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 mb-6">
                            Verified Access Only
                        </span>
                        <h1 className="text-4xl font-bold mb-2 italic tracking-tight">Confirm Availability</h1>
                        <p className="text-white/60 text-sm max-w-sm">A fast-track response portal for CBT Interviewers.</p>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* Verified Identity Header */}
                    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-gray-50 border border-border shadow-inner">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-border">
                                <ShieldCheck className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 italic leading-none">{interviewerName}</h3>
                                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1.5">{email}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-tighter">Identity Verified</span>
                        </div>
                    </div>

                    {/* Candidate Preview */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-1">Candidate Profile</p>
                        <div className="flex items-center gap-5 p-1 px-2">
                            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-base font-bold text-gray-800 italic">{candidate?.name}</p>
                                <p className="text-[11px] text-gray-400 font-medium">{candidate?.position}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Status Toggle */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-1">Select Attendance</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAvailable(true)}
                                    className={cn(
                                        "flex items-center justify-center gap-3 h-16 rounded-[1.5rem] border-2 transition-all font-bold text-lg",
                                        isAvailable === true
                                            ? "bg-emerald-50 border-primary text-primary"
                                            : "bg-white border-border text-gray-400 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <Check className="w-6 h-6" /> Available
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAvailable(false)}
                                    className={cn(
                                        "flex items-center justify-center gap-3 h-16 rounded-[1.5rem] border-2 transition-all font-bold text-lg",
                                        isAvailable === false
                                            ? "bg-rose-50 border-rose-500 text-rose-600"
                                            : "bg-white border-border text-gray-400 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <X className="w-6 h-6" /> Unavailable
                                </button>
                            </div>
                        </div>

                        {/* Preferred Date & Time Selector */}
                        {isAvailable && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Proposed Date & Time
                                </label>
                                <div className="relative group">
                                    <input
                                        type="datetime-local"
                                        value={preferredDateTime}
                                        onChange={(e) => setPreferredDateTime(e.target.value)}
                                        className="input-field h-16 bg-gray-50/50 border-gray-200 rounded-2xl focus:bg-white text-lg font-bold pr-12 transition-all appearance-none shadow-sm group-hover:border-primary/30"
                                        required={isAvailable}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-hover:text-primary transition-colors">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || isAvailable === null || (isAvailable && !preferredDateTime)}
                            className="w-full btn-primary h-20 rounded-[2rem] flex items-center justify-center gap-3 font-bold text-2xl shadow-2xl shadow-primary/30 disabled:opacity-30 disabled:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-8 h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Share Availability
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>

            <footer className="mt-12 text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-30 italic">
                Convergent Business Technologies - Internal Recruitment Workflow
            </footer>
        </div>
    );
}

export default function AvailabilityResponsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
            </div>
        }>
            <AvailabilityForm />
        </Suspense>
    );
}
