"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Loader2, Search, ChevronDown, ChevronUp, Mail, Users, Shield,
    CheckCircle2, XCircle, Clock, RefreshCw, Inbox
} from "lucide-react";
import { cn, formatSlotDate, formatSlotTime } from "@/lib/utils";
import { getEmailBroadcastHistory } from "@/app/actions";

interface BroadcastRecipient {
    name: string;
    email: string;
    source: 'candidate' | 'team';
}

interface DeliveryResult {
    email: string;
    ok: boolean;
    error?: string;
}

interface BroadcastRecord {
    id: string;
    sentAt: string;
    sentBy: string;
    subject: string;
    body: string;
    cc: string[];
    recipients: BroadcastRecipient[];
    recipientCount: number;
    personalize: boolean;
    status: 'sending' | 'completed' | 'unknown';
    successCount: number | null;
    failedCount: number | null;
    deliveryResults: DeliveryResult[];
}

function StatusBadge({ record }: { record: BroadcastRecord }) {
    if (record.status === 'sending') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-2.5 h-2.5 animate-pulse" /> Sending
            </span>
        );
    }
    const failed = record.failedCount ?? 0;
    if (failed > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-2.5 h-2.5" /> {record.successCount ?? 0} sent · {failed} failed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
            <CheckCircle2 className="w-2.5 h-2.5" /> {record.successCount ?? record.recipientCount} delivered
        </span>
    );
}

function BroadcastCard({ record }: { record: BroadcastRecord }) {
    const [expanded, setExpanded] = useState(false);
    const deliveryByEmail = useMemo(() => {
        const map = new Map<string, DeliveryResult>();
        for (const d of record.deliveryResults) map.set(d.email.toLowerCase(), d);
        return map;
    }, [record.deliveryResults]);

    return (
        <div className="bg-white border border-border rounded-md shadow-soft overflow-hidden">
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-surface/60 transition-colors"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-bold text-heading truncate">{record.subject}</p>
                        <StatusBadge record={record} />
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                        Sent by <span className="font-semibold text-heading">{record.sentBy}</span>
                        {" · "}
                        {formatSlotDate(record.sentAt, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {" at "}
                        {formatSlotTime(record.sentAt)} PKT
                        {" · "}
                        <span className="font-semibold text-heading">{record.recipientCount}</span> recipient{record.recipientCount !== 1 ? 's' : ''}
                        {record.cc.length > 0 && <> · CC: {record.cc.length}</>}
                    </p>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted shrink-0 mt-1" />}
            </button>

            {expanded && (
                <div className="border-t border-border px-4 py-4 space-y-4 bg-surface/40">
                    {/* Body */}
                    <div className="space-y-1.5">
                        <p className="text-[9.5px] font-bold text-muted uppercase tracking-[0.14em]">Body {record.personalize && <span className="text-primary">· Personalized per recipient</span>}</p>
                        <div className="bg-white border border-border rounded-sm px-3 py-2.5 text-[12px] text-heading whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                            {record.body}
                        </div>
                    </div>

                    {/* CC */}
                    {record.cc.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[9.5px] font-bold text-muted uppercase tracking-[0.14em]">CC</p>
                            <div className="flex flex-wrap gap-1.5">
                                {record.cc.map(e => (
                                    <span key={e} className="px-2 py-0.5 bg-white border border-border rounded-full text-[10.5px] text-heading">{e}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recipients */}
                    <div className="space-y-1.5">
                        <p className="text-[9.5px] font-bold text-muted uppercase tracking-[0.14em]">
                            Recipients ({record.recipients.length})
                        </p>
                        <div className="bg-white border border-border rounded-sm max-h-64 overflow-y-auto divide-y divide-border/60">
                            {record.recipients.map(r => {
                                const delivery = deliveryByEmail.get(r.email.toLowerCase());
                                return (
                                    <div key={r.email} className="flex items-center justify-between gap-2 px-3 py-1.5">
                                        <div className="min-w-0 flex items-center gap-2">
                                            {r.source === 'candidate'
                                                ? <Users className="w-3 h-3 text-muted shrink-0" />
                                                : <Shield className="w-3 h-3 text-muted shrink-0" />}
                                            <div className="min-w-0">
                                                <p className="text-[11.5px] font-semibold text-heading truncate leading-tight">{r.name}</p>
                                                <p className="text-[10px] text-muted truncate leading-tight">{r.email}</p>
                                            </div>
                                        </div>
                                        {delivery ? (
                                            delivery.ok ? (
                                                <span title="Delivered"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /></span>
                                            ) : (
                                                <span title={delivery.error || 'Failed'}><XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" /></span>
                                            )
                                        ) : (
                                            <span title="Pending"><Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /></span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmailHistoryPanel() {
    const [records, setRecords] = useState<BroadcastRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        setError(null);
        const res = await getEmailBroadcastHistory();
        if (res.success) {
            setRecords(res.data as BroadcastRecord[]);
        } else {
            setError(res.error || 'Failed to load email history.');
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return records;
        return records.filter(r =>
            r.subject.toLowerCase().includes(needle) ||
            r.sentBy.toLowerCase().includes(needle) ||
            r.recipients.some(rec => rec.email.toLowerCase().includes(needle) || rec.name.toLowerCase().includes(needle))
        );
    }, [records, search]);

    return (
        <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by subject, sender, or recipient…"
                        className="w-full pl-8 pr-2 py-1.5 text-[12px] bg-white border border-border rounded-sm outline-none focus:border-primary"
                    />
                </div>
                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-heading bg-white border border-border rounded-sm hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    Refresh
                </button>
                <span className="ml-auto text-[11px] font-semibold text-muted">
                    Showing <span className="text-heading">{filtered.length}</span> of {records.length}
                </span>
            </div>

            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="py-16 flex items-center justify-center text-muted text-[12px]">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading email history…
                    </div>
                ) : error ? (
                    <div className="py-16 text-center text-rose-600 text-[12px]">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-muted text-[12px] text-center gap-2">
                        <Inbox className="w-6 h-6 opacity-40" />
                        {records.length === 0 ? 'No broadcasts sent yet.' : 'No broadcasts match your search.'}
                    </div>
                ) : (
                    filtered.map(record => <BroadcastCard key={record.id} record={record} />)
                )}
            </div>
        </div>
    );
}
