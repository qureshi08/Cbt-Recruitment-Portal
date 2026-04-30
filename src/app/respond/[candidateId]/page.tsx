"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { Send, Loader2, Check, X, Calendar, ShieldCheck, AlertCircle } from "lucide-react";
import { submitInterviewerAvailability, getCandidateBasic, getInterviewerNameByEmail } from "@/app/actions";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

function AvailabilityForm() {
    const params = useParams();
    const candidateId = params.candidateId as string;

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
            try {
                const cData = await getCandidateBasic(candidateId);
                if (!isMounted) return;
                setCandidate(cData);

                const urlParams = new URLSearchParams(window.location.search);
                const urlEmail = urlParams.get('email');
                const urlAvail = urlParams.get('available');

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
    }, [candidateId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAvailable === null || (!email && !isLegacyLink)) return;

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

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <Loader2 className="w-7 h-7 animate-spin text-primary/40" strokeWidth={1.5} />
        </div>
    );

    if (isLegacyLink) return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-5">
            <div className="max-w-sm w-full bg-white rounded-[12px] border border-border p-8 text-center" style={{ boxShadow: "var(--shadow-soft)" }}>
                <AlertCircle className="w-9 h-9 text-rose-500 mx-auto mb-3" strokeWidth={1.5} />
                <h1
                    className="text-heading font-bold mb-1.5"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", letterSpacing: "-0.02em" }}
                >
                    Incomplete Link
                </h1>
                <p className="text-muted text-[12.5px] leading-relaxed">Please use the latest link from your email inbox.</p>
            </div>
        </div>
    );

    if (status === 'success') return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-5 text-center grid-bg">
            <div className="bg-white p-8 rounded-[12px] border border-border max-w-sm w-full" style={{ boxShadow: "var(--shadow-premium)" }}>
                <div className="w-12 h-12 bg-primary-muted rounded-[10px] flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h2
                    className="text-heading font-bold mb-1.5"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", letterSpacing: "-0.02em" }}
                >
                    <span className="italic-accent">Success</span>
                </h2>
                <p className="text-muted text-[12.5px] mb-6 leading-relaxed">Response shared for {candidate?.name}.</p>
                <button onClick={() => window.close()} className="btn-primary w-full">Close</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5 grid-bg">
            <div className="mb-6">
                <Logo withText={true} />
            </div>

            <main className="max-w-md w-full bg-white rounded-[12px] border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-premium)" }}>
                <div className="h-[3px] w-full bg-primary" />
                <div className="bg-dark p-6 text-white text-center relative overflow-hidden">
                    <span className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.16em] block mb-1.5">Interviewer Response</span>
                    <h1
                        className="font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", letterSpacing: "-0.02em" }}
                    >
                        Confirm <span className="italic-accent">Availability</span>
                    </h1>
                </div>

                <div className="p-6 space-y-5">
                    <div className="p-3.5 rounded-md bg-surface border border-border flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-heading truncate">{interviewerName}</p>
                            <p className="text-[10px] text-muted font-medium uppercase tracking-[0.12em] mt-0.5 truncate">{email}</p>
                        </div>
                    </div>

                    <div className="text-center bg-primary-muted p-3 rounded-md border border-primary/15">
                        <p
                            className="text-primary-dark font-bold text-[13px]"
                            style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}
                        >
                            {candidate?.name}
                        </p>
                        <p className="text-[10px] text-primary uppercase tracking-[0.12em] font-semibold">{candidate?.position}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAvailable(true)}
                                className={cn(
                                    "h-11 rounded-md border-2 font-semibold text-[12px] transition-all",
                                    isAvailable === true
                                        ? "bg-primary-muted border-primary text-primary"
                                        : "bg-white border-border text-muted hover:border-primary/40"
                                )}
                            >
                                <Check className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAvailable(false)}
                                className={cn(
                                    "h-11 rounded-md border-2 font-semibold text-[12px] transition-all",
                                    isAvailable === false
                                        ? "bg-rose-50 border-rose-500 text-rose-600"
                                        : "bg-white border-border text-muted hover:border-rose-300"
                                )}
                            >
                                <X className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                            </button>
                        </div>

                        {isAvailable && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-semibold text-muted uppercase tracking-[0.14em] flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" strokeWidth={1.5} /> Proposed Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={preferredDateTime}
                                    onChange={(e) => setPreferredDateTime(e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || isAvailable === null || (isAvailable === true && !preferredDateTime)}
                            className="btn-primary w-full !py-2.5 disabled:opacity-50"
                        >
                            {isSubmitting
                                ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                                : <><Send className="w-3.5 h-3.5" strokeWidth={1.5} /> Share Status</>}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default function AvailabilityResponsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface text-primary/30 text-[10px] font-semibold tracking-[0.4em] uppercase">
                CBT
            </div>
        }>
            <AvailabilityForm />
        </Suspense>
    );
}
