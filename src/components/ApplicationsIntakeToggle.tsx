"use client";

import { useState } from "react";
import { Lock, Unlock, Loader2, AlertTriangle } from "lucide-react";
import { setApplicationsOpenSetting } from "@/app/actions";

interface ApplicationsIntakeToggleProps {
    initialOpen: boolean;
}

export default function ApplicationsIntakeToggle({ initialOpen }: ApplicationsIntakeToggleProps) {
    const [open, setOpen] = useState(initialOpen);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

    const handleToggle = async () => {
        const next = !open;
        const confirmMessage = next
            ? "Re-open applications? The landing-page form will become active again and the AI assistant will encourage candidates to apply."
            : "Close applications? The landing-page form will be disabled, candidates will see a red 'applications closed' notice, and the AI assistant will stop directing people to apply.";
        if (!window.confirm(confirmMessage)) return;

        setSaving(true);
        setStatus(null);
        const res = await setApplicationsOpenSetting(next);
        setSaving(false);
        if (res.success) {
            setOpen(next);
            setStatus({ ok: true, message: next ? 'Applications are now OPEN.' : 'Applications are now CLOSED.' });
        } else {
            setStatus({ ok: false, message: res.error || 'Failed to update setting.' });
        }
    };

    return (
        <section className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${open ? 'bg-primary/10' : 'bg-red-50'}`}>
                    {open
                        ? <Unlock className="w-5 h-5 text-primary" strokeWidth={1.6} />
                        : <Lock className="w-5 h-5 text-red-600" strokeWidth={1.6} />}
                </div>
                <div>
                    <h3
                        className="text-heading font-bold"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', letterSpacing: '-0.02em' }}
                    >
                        Applications <span className="italic-accent">Intake</span>
                    </h3>
                    <p className="text-[12px] text-muted leading-relaxed mt-0.5">
                        Master switch that controls whether the public landing page is accepting new applications. Off = the apply button is disabled, candidates see a red closed-notice, and the chatbot stops directing people to apply.
                    </p>
                </div>
            </div>

            <div className="card space-y-4">
                {/* The big toggle */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-surface border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${open
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                        >
                            {open ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {open ? 'Accepting Applications' : 'Applications Closed'}
                        </span>
                        <p className="text-[11.5px] text-muted leading-relaxed">
                            {open
                                ? 'The landing-page form is live.'
                                : 'The landing-page form is disabled. Candidates see the red closed notice.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={open}
                        onClick={handleToggle}
                        disabled={saving}
                        title={open ? 'Click to close applications' : 'Click to reopen applications'}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none disabled:opacity-50 ${open ? 'bg-primary border-primary' : 'bg-red-500 border-red-500'
                            }`}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${open ? 'translate-x-5' : 'translate-x-0.5'
                                } ${saving ? 'animate-pulse' : ''}`}
                        />
                    </button>
                </div>

                {/* Closed-state info box */}
                {!open && (
                    <div className="rounded-md border border-red-200 bg-red-50/50 p-3 text-[11.5px] text-red-800 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <p className="font-bold">Applications are CLOSED right now.</p>
                            <p className="mt-1">
                                Visitors to the landing page see a red <em>"Applications are currently closed"</em> notice instead of the form. Direct API submissions (curl, scripted) are also blocked server-side. The AI assistant will stop encouraging applications and instead suggest waiting for the next intake.
                            </p>
                        </div>
                    </div>
                )}

                {status && (
                    <div className={`text-[11.5px] px-3 py-2 rounded-md border font-medium ${status.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                        {saving ? (
                            <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Updating…</span>
                        ) : status.message}
                    </div>
                )}
            </div>
        </section>
    );
}
