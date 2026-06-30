"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { askCandidateSupport } from "@/app/actions";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const STARTER_PROMPTS = [
    "Am I eligible to apply?",
    "What's the assessment like?",
    "Where's your office?",
    "What happens after I apply?",
];

const WELCOME_MESSAGE: ChatMessage = {
    role: "assistant",
    content:
        "Hi! I'm the CGAP Support Assistant. Ask me anything about eligibility, the application process, the assessment, or what to expect on interview day.",
};

export default function CandidateChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to the bottom whenever a new message arrives.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, isSending]);

    // Focus the input when the panel opens.
    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => inputRef.current?.focus(), 200);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const send = async (textOverride?: string) => {
        const text = (textOverride ?? input).trim();
        if (!text || isSending) return;

        const next: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages(next);
        setInput("");
        setIsSending(true);

        const result = await askCandidateSupport(
            next.map(m => ({ role: m.role, content: m.content }))
        );

        setIsSending(false);

        if (result.success && result.reply) {
            setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
        } else {
            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        result.error ||
                        "I couldn't get an answer right now. Please try again, or reach out by email.",
                },
            ]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            {/* Floating launcher button */}
            {!isOpen && (
                <button
                    type="button"
                    aria-label="Open CGAP support chat"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 pl-4 pr-5 py-3 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-all"
                    style={{ boxShadow: "0 10px 35px -10px rgba(0, 146, 69, 0.55)" }}
                >
                    <MessageCircle className="w-4 h-4" strokeWidth={2} />
                    <span className="text-[12px] font-bold uppercase tracking-[0.14em]">Ask AI</span>
                </button>
            )}

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-5 right-5 z-[60] w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-2.5rem))] bg-white rounded-[16px] shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="px-4 py-3 bg-primary text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                <Sparkles className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold leading-tight">CGAP Support Assistant</p>
                                <p className="text-[10px] opacity-80 leading-tight">Powered by AI · Beta</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="Close chat"
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-md hover:bg-white/15 transition-colors"
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-surface/40">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] px-3 py-2 rounded-[12px] text-[12.5px] leading-relaxed whitespace-pre-wrap ${m.role === "user"
                                        ? "bg-primary text-white rounded-br-sm"
                                        : "bg-white text-heading border border-border rounded-bl-sm"
                                        }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {isSending && (
                            <div className="flex justify-start">
                                <div className="bg-white text-muted border border-border rounded-[12px] rounded-bl-sm px-3 py-2 text-[12px] flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                    Thinking…
                                </div>
                            </div>
                        )}

                        {/* Starter prompts — show only when there's just the welcome message */}
                        {messages.length === 1 && !isSending && (
                            <div className="pt-2 space-y-1.5">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.14em] px-1">
                                    Try asking
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {STARTER_PROMPTS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => send(p)}
                                            className="px-2.5 py-1.5 bg-white border border-border rounded-full text-[11px] text-heading font-medium hover:border-primary hover:text-primary transition-colors"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-border bg-white">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about CGAP eligibility, assessment, interview…"
                                rows={1}
                                disabled={isSending}
                                className="flex-1 resize-none bg-surface border border-border rounded-md px-3 py-2 text-[12.5px] outline-none focus:border-primary disabled:opacity-50 max-h-24"
                            />
                            <button
                                type="button"
                                onClick={() => send()}
                                disabled={isSending || !input.trim()}
                                aria-label="Send message"
                                className="w-9 h-9 shrink-0 bg-primary text-white rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" strokeWidth={2} />
                                )}
                            </button>
                        </div>
                        <p className="text-[9.5px] text-muted mt-1.5 px-1 leading-snug">
                            AI replies may be inaccurate. For account-specific questions, email careers@convergentbt.com.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
