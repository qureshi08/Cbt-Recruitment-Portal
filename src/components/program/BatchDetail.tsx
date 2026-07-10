"use client";

import { useState } from "react";
import { CHECKLIST_ITEMS, ChecklistItem, ChecklistItemKey, Fellow, ONBOARDING_DOC_TYPES, OnboardingDocument } from "@/types/academy";
import { updateChecklistItem, provisionFellowAccount, verifyOnboardingDocument, rejectOnboardingDocument, launchBatch } from "@/app/program/actions";
import { withLoading } from "@/lib/loading";
import { cn } from "@/lib/utils";
import { Check, UserPlus, ChevronDown } from "lucide-react";

interface AvailableCandidate {
    id: string;
    name: string;
    email: string;
    batch_number?: string | null;
}

interface FellowWithDocs extends Fellow {
    documents: OnboardingDocument[];
}

interface BatchDetailProps {
    batchId: string;
    initialStatus: string;
    initialChecklist: ChecklistItem[];
    initialFellows: FellowWithDocs[];
    initialAvailableCandidates: AvailableCandidate[];
}

function FellowDocuments({ fellow, onChange }: { fellow: FellowWithDocs; onChange: (fellowId: string, docs: OnboardingDocument[]) => void }) {
    const [busyType, setBusyType] = useState<string | null>(null);

    const docFor = (type: string) => fellow.documents.find(d => d.doc_type === type);

    const handleVerify = async (doc: OnboardingDocument) => {
        setBusyType(doc.doc_type);
        const result = await withLoading(() => verifyOnboardingDocument(doc.id));
        setBusyType(null);
        if (result.success) {
            onChange(fellow.id, fellow.documents.map(d => d.id === doc.id ? { ...d, verified_at: new Date().toISOString(), rejected_reason: null } : d));
        }
    };

    const handleReject = async (doc: OnboardingDocument) => {
        const reason = window.prompt("Reason for rejecting this document?");
        if (!reason) return;
        setBusyType(doc.doc_type);
        const result = await withLoading(() => rejectOnboardingDocument(doc.id, reason));
        setBusyType(null);
        if (result.success) {
            onChange(fellow.id, fellow.documents.map(d => d.id === doc.id ? { ...d, verified_at: null, rejected_reason: reason } : d));
        }
    };

    return (
        <div className="px-5 pb-3 pt-1 bg-surface/60 space-y-1.5">
            {ONBOARDING_DOC_TYPES.map(docType => {
                const doc = docFor(docType.key);
                if (!doc || !doc.uploaded_at) {
                    return (
                        <div key={docType.key} className="flex items-center justify-between text-[11px] py-1">
                            <span className="text-muted">{docType.label}</span>
                            <span className="text-muted italic">Not uploaded</span>
                        </div>
                    );
                }
                return (
                    <div key={docType.key} className="flex items-center justify-between text-[11px] py-1">
                        <a href={doc.file_url ?? "#"} target="_blank" rel="noreferrer" className="text-heading font-semibold hover:text-primary underline underline-offset-2">
                            {docType.label}
                        </a>
                        {doc.verified_at ? (
                            <span className="text-primary font-bold text-[10px]">Verified</span>
                        ) : doc.rejected_reason ? (
                            <span className="text-rose-600 font-bold text-[10px]">Rejected: {doc.rejected_reason}</span>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleVerify(doc)}
                                    disabled={busyType === docType.key}
                                    className="px-2 py-1 bg-primary text-white text-[9.5px] font-bold rounded-sm hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Verify
                                </button>
                                <button
                                    onClick={() => handleReject(doc)}
                                    disabled={busyType === docType.key}
                                    className="px-2 py-1 bg-white border border-border text-rose-600 text-[9.5px] font-bold rounded-sm hover:border-rose-300 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function BatchDetail({ batchId, initialStatus, initialChecklist, initialFellows, initialAvailableCandidates }: BatchDetailProps) {
    const [status, setStatus] = useState(initialStatus);
    const [checklist, setChecklist] = useState(initialChecklist);
    const [fellows, setFellows] = useState(initialFellows);
    const [availableCandidates, setAvailableCandidates] = useState(initialAvailableCandidates);
    const [provisioningId, setProvisioningId] = useState<string | null>(null);
    const [expandedFellowId, setExpandedFellowId] = useState<string | null>(null);
    const [isLaunching, setIsLaunching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const doneCount = checklist.filter(c => c.done_at).length;
    const allChecklistDone = doneCount === CHECKLIST_ITEMS.length;

    const handleLaunch = async () => {
        if (!window.confirm("Launch this batch? Its status moves to Active.")) return;
        setIsLaunching(true);
        const result = await withLoading(() => launchBatch(batchId));
        setIsLaunching(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setStatus("Active");
    };

    const handleToggleChecklist = async (itemKey: ChecklistItemKey, currentlyDone: boolean) => {
        const result = await withLoading(() => updateChecklistItem(batchId, itemKey, !currentlyDone));
        if (result.error) {
            setError(result.error);
            return;
        }
        setChecklist(prev => prev.map(c => c.item_key === itemKey
            ? { ...c, done_at: !currentlyDone ? new Date().toISOString() : null }
            : c
        ));
    };

    const handleProvision = async (candidate: AvailableCandidate) => {
        if (!window.confirm(
            `Provision ${candidate.name} as a Fellow in Batch #${batchId}?\n\n` +
            "This creates a real login account for them and emails their credentials immediately."
        )) return;

        setProvisioningId(candidate.id);
        const result = await withLoading(() => provisionFellowAccount(candidate.id, batchId));
        setProvisioningId(null);

        if (result.error) {
            setError(result.error);
            return;
        }
        setAvailableCandidates(prev => prev.filter(c => c.id !== candidate.id));
        setFellows(prev => [...prev, { ...result.fellow, name: candidate.name, email: candidate.email, documents: [] }]);
    };

    return (
        <div className="space-y-5">
            {error && (
                <div className="flex items-center justify-between gap-3 text-[11.5px] px-4 py-2.5 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            {/* Pre-Orientation Checklist */}
            <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-heading tracking-tight italic">Pre-Orientation Checklist</h2>
                        <p className="text-[11px] text-muted mt-0.5">{doneCount} of {CHECKLIST_ITEMS.length} complete · Batch status: {status}</p>
                    </div>
                    {status === "Pending Orientation" && allChecklistDone && (
                        <button
                            onClick={handleLaunch}
                            disabled={isLaunching}
                            className="px-3.5 py-2 bg-primary text-white text-[10.5px] font-bold rounded-sm shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            {isLaunching ? "Launching…" : "Launch Batch →"}
                        </button>
                    )}
                </div>
                {status === "Pending Orientation" && !allChecklistDone && (
                    <div className="mx-5 mt-4 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                        Batch can&apos;t move to Orientation until all items are done.
                    </div>
                )}
                <div className="p-5 space-y-1">
                    {checklist.map(item => {
                        const meta = CHECKLIST_ITEMS.find(i => i.key === item.item_key)!;
                        const isDone = !!item.done_at;
                        return (
                            <div key={item.item_key} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                                <button
                                    onClick={() => !meta.auto && handleToggleChecklist(item.item_key, isDone)}
                                    disabled={meta.auto}
                                    className={cn(
                                        "w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors",
                                        isDone ? "bg-primary border-primary text-white" : "border-border",
                                        meta.auto && "opacity-60 cursor-not-allowed"
                                    )}
                                    title={meta.auto ? "Set automatically by the system" : undefined}
                                >
                                    {isDone && <Check className="w-3 h-3" strokeWidth={3} />}
                                </button>
                                <span className={cn("text-[12.5px] flex-1", isDone ? "text-heading font-semibold" : "text-body")}>
                                    {meta.label}
                                </span>
                                {item.done_by && (
                                    <span className="text-[10px] text-muted">{item.done_by}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fellows */}
            <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface">
                    <h2 className="text-sm font-bold text-heading tracking-tight italic">Fellows</h2>
                    <p className="text-[11px] text-muted mt-0.5">{fellows.length} provisioned · {availableCandidates.length} confirmed candidate{availableCandidates.length !== 1 ? "s" : ""} ready to add</p>
                </div>

                {fellows.length > 0 && (
                    <div className="divide-y divide-border">
                        {fellows.map(f => {
                            const isExpanded = expandedFellowId === f.id;
                            const verifiedCount = f.documents.filter(d => d.verified_at).length;
                            return (
                                <div key={f.id}>
                                    <button
                                        onClick={() => setExpandedFellowId(isExpanded ? null : f.id)}
                                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface/60 transition-colors text-left"
                                    >
                                        <div>
                                            <p className="text-[12.5px] font-bold text-heading">{f.name}</p>
                                            <p className="text-[10.5px] text-muted">{f.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border bg-surface text-muted border-border">
                                                {verifiedCount} of {ONBOARDING_DOC_TYPES.length} docs verified
                                            </span>
                                            <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", isExpanded && "rotate-180")} />
                                        </div>
                                    </button>
                                    {isExpanded && (
                                        <FellowDocuments
                                            fellow={f}
                                            onChange={(fellowId, docs) => setFellows(prev => prev.map(pf => pf.id === fellowId ? { ...pf, documents: docs } : pf))}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {availableCandidates.length > 0 && (
                    <div className="p-5 border-t border-border bg-surface/50">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Add from Confirmed Candidates</p>
                        <div className="space-y-2">
                            {availableCandidates.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-white border border-border rounded-sm px-4 py-2.5">
                                    <div>
                                        <p className="text-[12px] font-bold text-heading">{c.name}</p>
                                        <p className="text-[10.5px] text-muted">{c.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handleProvision(c)}
                                        disabled={provisioningId === c.id}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white text-[10.5px] font-bold rounded-sm shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-60"
                                    >
                                        {provisioningId === c.id ? (
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <UserPlus className="w-3 h-3" />
                                        )}
                                        <span>Provision</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
