"use client";

import { useState } from "react";
import { Send, History } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageComposer from "@/components/MessageComposer";
import EmailHistoryPanel from "@/components/EmailHistoryPanel";

interface MessagingCenterProps {
    senderName: string;
}

export default function MessagingCenter({ senderName }: MessagingCenterProps) {
    const [tab, setTab] = useState<'compose' | 'history'>('compose');

    return (
        <div className="space-y-4">
            <div className="inline-flex bg-surface border border-border rounded-md p-1 gap-1">
                <button
                    type="button"
                    onClick={() => setTab('compose')}
                    className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest transition-colors",
                        tab === 'compose' ? "bg-primary text-white shadow-sm" : "text-muted hover:text-heading"
                    )}
                >
                    <Send className="w-3.5 h-3.5" />
                    Compose
                </button>
                <button
                    type="button"
                    onClick={() => setTab('history')}
                    className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest transition-colors",
                        tab === 'history' ? "bg-primary text-white shadow-sm" : "text-muted hover:text-heading"
                    )}
                >
                    <History className="w-3.5 h-3.5" />
                    History
                </button>
            </div>

            {tab === 'compose' ? (
                <MessageComposer senderName={senderName} />
            ) : (
                <EmailHistoryPanel />
            )}
        </div>
    );
}
