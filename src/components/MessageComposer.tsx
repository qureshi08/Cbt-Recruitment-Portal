"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Send, Users, X, CheckSquare, Square, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { withLoading } from "@/lib/loading";
import { getCandidatesForBroadcast, sendCustomBroadcastToCandidates } from "@/app/actions";

interface BroadcastCandidate {
    id: string;
    name: string;
    email: string;
    status: string;
    batch_number?: string | null;
    position?: string | null;
}

interface MessageComposerProps {
    senderName: string;
}

const STATUS_GROUPS: { label: string; statuses: string[] }[] = [
    { label: 'Approved', statuses: ['Approved'] },
    { label: 'Invite Sent', statuses: ['Invite Sent'] },
    { label: 'Assessment Scheduled', statuses: ['Assessment Scheduled', 'Confirmed', 'Rescheduled'] },
    { label: 'Assessment Completed', statuses: ['Assessment Completed', 'To Be Interviewed'] },
    { label: 'Interviewing', statuses: ['Interview Scheduled', 'L2 Interview Required'] },
    { label: 'Recommended', statuses: ['Recommended'] },
    { label: 'Selected', statuses: ['Selected'] },
    { label: 'Absent / Rejected', statuses: ['Absent', 'Rejected', 'Not Recommended'] },
];

export default function MessageComposer({ senderName }: MessageComposerProps) {
    const [candidates, setCandidates] = useState<BroadcastCandidate[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(true);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [batchFilter, setBatchFilter] = useState<string>('All');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('Dear {{firstName}},\n\n\n\nWarm regards,\nRecruitment Team\nConvergent Business Technologies');
    const [personalize, setPersonalize] = useState(true);
    const [ccInput, setCcInput] = useState('');
    const [ccList, setCcList] = useState<string[]>([]);

    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

    useEffect(() => {
        (async () => {
            setLoadingCandidates(true);
            const res = await getCandidatesForBroadcast();
            if (res.success) setCandidates(res.data || []);
            else setResult({ ok: false, message: res.error || 'Failed to load candidates.' });
            setLoadingCandidates(false);
        })();
    }, []);

    const batches = useMemo(() => {
        const set = new Set<string>();
        for (const c of candidates) if (c.batch_number) set.add(c.batch_number);
        return ['All', ...Array.from(set).sort()];
    }, [candidates]);

    const filtered = useMemo(() => {
        return candidates.filter(c => {
            const needle = search.trim().toLowerCase();
            const matchesSearch = !needle
                || c.name?.toLowerCase().includes(needle)
                || c.email?.toLowerCase().includes(needle);
            const matchesBatch = batchFilter === 'All' || c.batch_number === batchFilter;
            const group = STATUS_GROUPS.find(g => g.label === statusFilter);
            const matchesStatus = statusFilter === 'All' || (group?.statuses ?? [statusFilter]).includes(c.status);
            return matchesSearch && matchesBatch && matchesStatus;
        });
    }, [candidates, search, batchFilter, statusFilter]);

    const allFilteredSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));

    const toggle = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAllFiltered = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allFilteredSelected) {
                filtered.forEach(c => next.delete(c.id));
            } else {
                filtered.forEach(c => next.add(c.id));
            }
            return next;
        });
    };

    const addCcEmail = () => {
        const candidate = ccInput.trim();
        if (!candidate) return;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(candidate)) {
            setResult({ ok: false, message: `'${candidate}' is not a valid email.` });
            return;
        }
        if (ccList.includes(candidate)) {
            setCcInput('');
            return;
        }
        setCcList(prev => [...prev, candidate]);
        setCcInput('');
        setResult(null);
    };

    const removeCcEmail = (e: string) => setCcList(prev => prev.filter(x => x !== e));

    const selectedCandidates = candidates.filter(c => selectedIds.has(c.id));

    const handleSend = async () => {
        setResult(null);
        if (selectedIds.size === 0) {
            setResult({ ok: false, message: 'Pick at least one recipient first.' });
            return;
        }
        if (!subject.trim()) {
            setResult({ ok: false, message: 'Subject is required.' });
            return;
        }
        if (!body.trim()) {
            setResult({ ok: false, message: 'Body is required.' });
            return;
        }

        const sampleName = selectedCandidates[0]?.name ?? 'first candidate';
        const ok = window.confirm(
            `Send this email to ${selectedIds.size} candidate(s)?\n\n` +
            `First recipient: ${sampleName}\n` +
            `Subject: ${subject}\n` +
            (ccList.length ? `CC: ${ccList.join(', ')}\n` : '') +
            `\nThis is irreversible — once sent, emails cannot be recalled.`
        );
        if (!ok) return;

        setIsSending(true);
        const res = await withLoading(() => sendCustomBroadcastToCandidates({
            candidateIds: Array.from(selectedIds),
            subject: subject.trim(),
            bodyPlain: body,
            cc: ccList,
            personalize,
        }));
        setIsSending(false);

        if (res.success) {
            setResult({
                ok: true,
                message: `Queued ${res.queued} email${res.queued !== 1 ? 's' : ''} for delivery${res.skipped ? ` (${res.skipped} skipped — missing or invalid email)` : ''}. They are being sent in the background.`,
            });
            setSelectedIds(new Set());
        } else {
            setResult({ ok: false, message: res.error || 'Failed to send.' });
        }
    };

    const previewBody = personalize && selectedCandidates[0]
        ? body
            .replace(/\{\{\s*name\s*\}\}/gi, selectedCandidates[0].name ?? 'Applicant')
            .replace(/\{\{\s*firstName\s*\}\}/gi, (selectedCandidates[0].name ?? 'Applicant').split(/\s+/)[0])
        : body;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
            {/* Recipients panel */}
            <div className="bg-white border border-border rounded-[12px] shadow-soft flex flex-col overflow-hidden h-[680px]">
                <div className="px-4 py-3 border-b border-border bg-surface">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">Recipients</p>
                    <p className="text-[11px] text-muted mt-0.5">
                        <span className="font-bold text-heading">{selectedIds.size}</span> of {candidates.length} selected
                    </p>
                </div>
                <div className="px-3 pt-3 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" strokeWidth={1.5} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or email…"
                            className="w-full pl-8 pr-2 py-1.5 text-[12px] bg-surface border border-border rounded-sm outline-none focus:border-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-white border border-border rounded-sm px-2 py-1.5 text-[11px] font-semibold cursor-pointer outline-none"
                        >
                            <option value="All">All statuses</option>
                            {STATUS_GROUPS.map(g => (
                                <option key={g.label} value={g.label}>{g.label}</option>
                            ))}
                        </select>
                        <select
                            value={batchFilter}
                            onChange={e => setBatchFilter(e.target.value)}
                            className="bg-white border border-border rounded-sm px-2 py-1.5 text-[11px] font-semibold cursor-pointer outline-none"
                        >
                            {batches.map(b => (
                                <option key={b} value={b}>{b === 'All' ? 'All batches' : `Batch ${b}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={toggleAllFiltered}
                            disabled={filtered.length === 0}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/5 rounded uppercase tracking-widest disabled:opacity-40"
                        >
                            {allFilteredSelected
                                ? <CheckSquare className="w-3.5 h-3.5" strokeWidth={2} />
                                : <Square className="w-3.5 h-3.5" strokeWidth={2} />}
                            <span>{allFilteredSelected ? 'Deselect all' : `Select all (${filtered.length})`}</span>
                        </button>
                        {selectedIds.size > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedIds(new Set())}
                                className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded uppercase tracking-widest"
                            >
                                Clear ({selectedIds.size})
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 mt-1 border-t border-border/40">
                    {loadingCandidates ? (
                        <div className="h-full flex items-center justify-center text-muted text-[11px]">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading candidates…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted text-[11px] text-center px-4">
                            <Users className="w-5 h-5 mb-1 opacity-40" />
                            No candidates match the current filters.
                        </div>
                    ) : (
                        <ul className="space-y-0.5">
                            {filtered.map(c => {
                                const checked = selectedIds.has(c.id);
                                return (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            onClick={() => toggle(c.id)}
                                            className={cn(
                                                "w-full flex items-start gap-2 px-2 py-1.5 rounded-sm text-left transition-colors",
                                                checked ? "bg-primary/5" : "hover:bg-surface"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                checked ? "bg-primary border-primary text-white" : "border-border bg-white"
                                            )}>
                                                {checked && <CheckSquare className="w-3 h-3" strokeWidth={2.5} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12px] font-semibold text-heading truncate leading-tight">{c.name}</p>
                                                <p className="text-[10.5px] text-muted truncate leading-tight">{c.email}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted">{c.status}</span>
                                                    {c.batch_number && (
                                                        <span className="text-[9px] font-bold text-primary/80">· B{c.batch_number}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Composer panel */}
            <div className="bg-white border border-border rounded-[12px] shadow-soft flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">Message</p>
                    <p className="text-[11px] text-muted mt-0.5">
                        Sender: <span className="font-semibold text-heading">{senderName}</span> · From: CBT Recruitment
                    </p>
                </div>

                <div className="px-5 py-5 space-y-4 flex-1 overflow-y-auto">
                    {/* Subject */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">Subject</label>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="e.g. Important Update: CGAP Program Postponed"
                            className="w-full bg-white border border-border rounded-sm px-3 py-2 text-[13px] outline-none focus:border-primary"
                        />
                    </div>

                    {/* CC */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">CC <span className="font-normal text-muted normal-case">(optional, max 10)</span></label>
                        <div className="flex gap-2">
                            <input
                                value={ccInput}
                                onChange={e => setCcInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCcEmail(); } }}
                                placeholder="someone@convergentbt.com"
                                className="flex-1 bg-white border border-border rounded-sm px-3 py-2 text-[12px] outline-none focus:border-primary"
                            />
                            <button
                                type="button"
                                onClick={addCcEmail}
                                disabled={!ccInput.trim()}
                                className="px-3 py-2 bg-surface border border-border rounded-sm text-[11px] font-bold text-heading hover:border-primary/40 disabled:opacity-40 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                        {ccList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {ccList.map(e => (
                                    <span key={e} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/8 text-primary border border-primary/20 rounded-full text-[11px] font-medium">
                                        {e}
                                        <button type="button" onClick={() => removeCcEmail(e)} className="hover:bg-primary/15 rounded-full p-0.5">
                                            <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">Body</label>
                            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-heading cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={personalize}
                                    onChange={e => setPersonalize(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                                />
                                Personalize (replace <code className="bg-surface px-1 rounded">{'{{firstName}}'}</code> &amp; <code className="bg-surface px-1 rounded">{'{{name}}'}</code>)
                            </label>
                        </div>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={14}
                            className="w-full bg-white border border-border rounded-sm px-3 py-2.5 text-[12.5px] outline-none focus:border-primary leading-relaxed font-mono"
                        />
                        <div className="flex items-start gap-2 text-[10.5px] text-muted">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" strokeWidth={1.6} />
                            <span>Write in plain text — blank lines become paragraph breaks. Links auto-format. Personalize tokens are replaced per-recipient before sending.</span>
                        </div>
                    </div>

                    {/* Preview */}
                    {selectedCandidates.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-[0.14em]">
                                Preview (for {selectedCandidates[0].name})
                            </label>
                            <div className="bg-surface border border-border rounded-sm px-4 py-3 text-[12.5px] text-heading whitespace-pre-wrap leading-relaxed">
                                {previewBody}
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={cn(
                            "text-[11.5px] px-3 py-2 rounded-sm border font-medium",
                            result.ok
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-rose-50 border-rose-200 text-rose-700"
                        )}>
                            {result.message}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-border bg-surface flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted">
                        {selectedIds.size > 0
                            ? <>Ready to send to <strong className="text-heading">{selectedIds.size}</strong> recipient{selectedIds.size !== 1 ? 's' : ''}{ccList.length > 0 && <> · CC: {ccList.length}</>}</>
                            : 'Pick recipients on the left to enable Send.'}
                    </span>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || selectedIds.size === 0 || !subject.trim() || !body.trim()}
                        className="bg-primary text-white px-5 py-2 rounded-sm text-[11.5px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isSending ? 'Sending…' : `Send${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
