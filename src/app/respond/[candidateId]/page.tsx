"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Clock, Send, Mail, User, Briefcase, Loader2, Sparkles, Check, X, Calendar } from "lucide-react";
import { submitInterviewerAvailability, getCandidateBasic } from "@/app/actions";
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

    useEffect(() => {
        const fetchCandidate = async () => {
            const data = await getCandidateBasic(candidateId);
            setCandidate(data);

            // Try to extract email from URL
            const urlEmail = searchParams.get('email');
            if (urlEmail) {
                setEmail(decodeURIComponent(urlEmail));
            }

            setIsLoading(false);
        };
        fetchCandidate();
    }, [candidateId, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAvailable === null || !email || !interviewerName) return;

        setIsSubmitting(true);

        // Format the date nicely for the email notification
        let formattedTime = "";
        if (preferredDateTime) {
            const dt = new Date(preferredDateTime);
            formattedTime = dt.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }

        const result = await submitInterviewerAvailability(
            candidateId,
            email,
            isAvailable,
            formattedTime,
            interviewerName
        );

        if (result.success) setStatus('success');
        else setStatus('error');
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-surface p-10 text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                        <Check className="w-12 h-12 text-emerald-500 relative z-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 italic">Response Shared</h1>
                    <p className="text-gray-500 mb-10 px-4 leading-relaxed">Thank you, <strong>{interviewerName}</strong>. The recruitment team has been updated regarding your availability for {candidate?.name}.</p>
                    <button onClick={() => window.close()} className="w-full btn-primary h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">Close Portal</button>
                    <p className="mt-8 text-[11px] text-gray-400 uppercase tracking-[0.2em] font-black italic opacity-50">CBT Recruitment Portal</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="mb-8 scale-110"><Logo withText={true} /></div>

            <main className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl shadow-primary/10 border border-surface overflow-hidden transition-all duration-500 ease-in-out">
                {/* Visual Header */}
                <div className="bg-primary p-10 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.1em] border border-white/10 shadow-sm">
                                <Sparkles className="w-3 h-3 inline mr-1.5 mb-0.5" />
                                Appointment Request
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2 italic">Confirm Availability</h1>
                        <p className="text-white/70 text-sm font-medium">Coordinate your interview session with the candidate.</p>
                    </div>
                </div>

                {/* Candidate Info Overview */}
                <div className="px-10 pt-10 pb-2">
                    <div className="bg-gray-50/80 rounded-[2rem] p-6 border border-border flex items-center gap-5 transition-transform hover:scale-[1.02] duration-300">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-border">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight truncate italic">{candidate?.name || 'Candidate'}</h2>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1.5 font-bold uppercase tracking-widest mt-0.5">
                                <Briefcase className="w-3.5 h-3.5 opacity-60" />
                                {candidate?.position || 'CGAP Program'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 pt-6 space-y-8">
                    {/* Status Toggle */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Status</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setIsAvailable(true)}
                                className={cn(
                                    "flex items-center justify-center gap-3 h-16 rounded-[1.5rem] border-2 transition-all font-bold text-base",
                                    isAvailable === true
                                        ? "bg-emerald-50 border-primary text-primary shadow-lg shadow-primary/5"
                                        : "bg-white border-border text-gray-400 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                )}
                            >
                                <Check className="w-5 h-5" /> Available
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAvailable(false)}
                                className={cn(
                                    "flex items-center justify-center gap-3 h-16 rounded-[1.5rem] border-2 transition-all font-bold text-base",
                                    isAvailable === false
                                        ? "bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-500/5"
                                        : "bg-white border-border text-gray-400 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                                )}
                            >
                                <X className="w-5 h-5" /> Not Available
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Input */}
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <User className="w-3 h-3" /> Interviewer Name
                            </label>
                            <input
                                type="text"
                                required
                                value={interviewerName}
                                onChange={(e) => setInterviewerName(e.target.value)}
                                placeholder="Your Name"
                                className="input-field h-14 bg-gray-50/50 border-gray-200 rounded-2xl focus:bg-white text-base font-medium transition-all"
                            />
                        </div>

                        {/* Email Indicator (Auto-detected) */}
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Mail className="w-3 h-3" /> Professional Email
                            </label>
                            <div className="h-14 bg-gray-100/50 border border-border rounded-2xl px-5 flex items-center text-gray-500 text-sm font-medium overflow-hidden italic">
                                <span className="truncate">{email || "Email required"}</span>
                                {email && <Check className="ml-auto w-4 h-4 text-emerald-500 shrink-0" />}
                            </div>
                        </div>
                    </div>

                    {/* Preferred Date & Time Selector */}
                    {isAvailable && (
                        <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Preferred Date & Time
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={preferredDateTime}
                                    onChange={(e) => setPreferredDateTime(e.target.value)}
                                    className="input-field h-14 bg-gray-50/50 border-gray-200 rounded-2xl focus:bg-white text-base font-medium pr-12 transition-all appearance-none"
                                    required={isAvailable}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Clock className="w-5 h-5 text-gray-300" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 ml-1 font-medium italic opacity-70 italic">Select your preferred slot to help the recruitment team schedule the call.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || isAvailable === null || !email || !interviewerName || (isAvailable && !preferredDateTime)}
                        className="w-full btn-primary h-16 rounded-[1.5rem] flex items-center justify-center gap-3 font-bold text-xl shadow-2xl shadow-primary/20 disabled:opacity-30 disabled:shadow-none hover:scale-[1.01] active:scale-[0.99] transition-all group"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Submit Response
                            </>
                        )}
                    </button>
                </form>
            </main>

            <footer className="mt-12 text-gray-400 text-[10px] font-black uppercase tracking-[0.25em] text-center opacity-40 italic">
                <p>&copy; {new Date().getFullYear()} Convergent Business Technologies</p>
                <p className="mt-1.5 opacity-50">Automated Recruitment Workflow</p>
            </footer>
        </div>
    );
}

export default function AvailabilityResponsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                <p className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] italic">Accessing Portal...</p>
            </div>
        }>
            <AvailabilityForm />
        </Suspense>
    );
}
