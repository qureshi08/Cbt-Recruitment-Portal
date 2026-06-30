"use client";

import { useState } from "react";
import { Sparkles, Save, RotateCcw, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { updateChatbotPrompt, restoreChatbotPromptToDefault } from "@/app/actions";

interface ChatbotPromptManagerProps {
    initialPrompt: string;
    initialIsDefault: boolean;
    defaultPrompt: string;
}

export default function ChatbotPromptManager({
    initialPrompt,
    initialIsDefault,
    defaultPrompt,
}: ChatbotPromptManagerProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [savedPrompt, setSavedPrompt] = useState(initialPrompt);
    const [isDefault, setIsDefault] = useState(initialIsDefault);
    const [saving, setSaving] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

    const dirty = prompt !== savedPrompt;
    const matchesFactoryDefault = prompt.trim() === defaultPrompt.trim();

    const handleSave = async () => {
        setStatus(null);
        setSaving(true);
        const result = await updateChatbotPrompt(prompt);
        setSaving(false);
        if (result.success) {
            setSavedPrompt(prompt);
            setIsDefault(false);
            setStatus({ ok: true, message: 'Saved. The chatbot will use this prompt from the next message onward.' });
        } else {
            setStatus({ ok: false, message: result.error || 'Failed to save.' });
        }
    };

    const handleRestoreDefault = async () => {
        if (!window.confirm(
            "Restore the chatbot system prompt to the factory default?\n\n" +
            "Your current custom prompt will be discarded. This cannot be undone."
        )) {
            return;
        }
        setStatus(null);
        setRestoring(true);
        const result = await restoreChatbotPromptToDefault();
        setRestoring(false);
        if (result.success) {
            setPrompt(defaultPrompt);
            setSavedPrompt(defaultPrompt);
            setIsDefault(true);
            setStatus({ ok: true, message: 'Restored to the factory default prompt.' });
        } else {
            setStatus({ ok: false, message: result.error || 'Failed to restore.' });
        }
    };

    return (
        <section className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3
                        className="text-heading font-bold"
                        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', letterSpacing: '-0.02em' }}
                    >
                        AI Assistant <span className="italic-accent">System Prompt</span>
                    </h3>
                    <p className="text-[12px] text-muted leading-relaxed mt-0.5">
                        Controls what the candidate-facing chatbot on the landing page knows and how it answers. Changes go live on the very next message — no redeploy needed.
                    </p>
                </div>
            </div>

            <div className="card space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {isDefault ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold uppercase tracking-widest">
                            <AlertTriangle className="w-3 h-3" /> Using factory default
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" /> Custom override active
                        </span>
                    )}
                    <span className="text-muted">
                        {prompt.length.toLocaleString()} characters
                    </span>
                </div>

                <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                        Edit carefully. This text steers every reply the bot gives candidates on the public landing page. Keep formatting rules, eligibility facts, and the no-promises / no-CNIC guardrails intact unless you intend to change behaviour.
                    </p>
                </div>

                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    spellCheck={false}
                    className="w-full bg-white border border-border rounded-md p-4 text-[12.5px] font-mono leading-relaxed text-heading focus:outline-none focus:border-primary transition-colors min-h-[460px] shadow-inner whitespace-pre-wrap"
                    placeholder="You are the CGAP Support Assistant…"
                />

                {status && (
                    <div className={`text-[11.5px] px-3 py-2 rounded-md border font-medium ${status.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                        {status.message}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-muted">
                        {dirty
                            ? <span className="text-amber-700 font-semibold">Unsaved changes</span>
                            : isDefault
                                ? 'Currently serving the factory default.'
                                : 'Saved override is active.'}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPrompt(defaultPrompt)}
                            disabled={saving || restoring || matchesFactoryDefault}
                            title="Load the factory default into the editor (does not save)"
                            className="px-3 py-2 text-[11px] font-bold text-muted hover:text-heading uppercase tracking-widest disabled:opacity-40"
                        >
                            Load default
                        </button>
                        <button
                            type="button"
                            onClick={handleRestoreDefault}
                            disabled={saving || restoring || isDefault}
                            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-rose-600 border border-rose-200 bg-white rounded-sm hover:bg-rose-50 disabled:opacity-40"
                        >
                            {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            Restore Factory
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || restoring || !dirty || !prompt.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest bg-primary text-white rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {saving ? 'Saving…' : 'Save Prompt'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
