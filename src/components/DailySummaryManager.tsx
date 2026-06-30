'use client';

import { useState, useEffect } from 'react';
import { MailCheck, Loader2, Info, RefreshCw, AlertCircle, Inbox, UserCheck, UserX, FileText, Trash2, X } from 'lucide-react';
import { sendDailySummaryNotifications, getQueuedNotifications, clearQueuedNotifications, removeQueuedNotification } from '@/app/actions';

interface QueuedItem {
    id: string;
    category: string;
    event_type: string;
    details: any;
    created_at: string;
}

export default function DailySummaryManager() {
    const [isTriggering, setIsTriggering] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isLoadingQueue, setIsLoadingQueue] = useState(true);
    const [queuedItems, setQueuedItems] = useState<QueuedItem[]>([]);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleRemoveOne = async (item: QueuedItem) => {
        // Pull a friendly label for the confirm dialog. Candidate decisions
        // show the name; team digest events fall back to the event type.
        const friendly = item.category === 'candidate_decision'
            ? (item.details?.name || item.details?.email || 'this candidate decision')
            : (item.event_type || 'this event').replace(/_/g, ' ');

        if (!window.confirm(`Remove '${friendly}' from the queue without sending it?\n\nThis is permanent.`)) {
            return;
        }

        setRemovingId(item.id);
        // Optimistic UI — drop the item locally first so the click feels instant.
        const prevItems = queuedItems;
        setQueuedItems(prev => prev.filter(q => q.id !== item.id));

        const res = await removeQueuedNotification(item.id);
        setRemovingId(null);

        if (!res.success) {
            setQueuedItems(prevItems); // rollback
            alert(`Failed to remove from queue: ${res.error || 'Unknown error'}`);
        }
    };

    const loadQueue = async () => {
        setIsLoadingQueue(true);
        try {
            const res = await getQueuedNotifications();
            if (res.success) {
                setQueuedItems(res.data || []);
            } else {
                console.error("Failed to load queue:", res.error);
            }
        } catch (err) {
            console.error("Error loading queue:", err);
        } finally {
            setIsLoadingQueue(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const handleTrigger = async () => {
        if (queuedItems.length === 0) {
            alert("The queue is currently empty. There is no pending info to send!");
            return;
        }

        if (!window.confirm(
            "Are you sure you want to trigger the daily summary job now?\n\n" +
            `This will instantly dispatch all ${queuedItems.length} pending events/emails, and clear the queue.\n` +
            "Note: All duplicate entries for the same candidate will automatically be de-duplicated before sending."
        )) {
            return;
        }

        setIsTriggering(true);
        setResultMessage(null);

        try {
            const res = await sendDailySummaryNotifications();
            if (res.success) {
                const count = res.count || 0;
                setResultMessage(`Success! Daily summary completed successfully. Processed and dispatched ${count} items.`);
                alert(`Daily Summary Dispatched Successfully!\nProcessed: ${count} events.`);
                // Refresh the queue so it is shown as empty
                await loadQueue();
            } else {
                setResultMessage(`Error: ${res.error || 'Failed to dispatch summary'}`);
                alert(`Failed to dispatch daily summary: ${res.error}`);
            }
        } catch (err: any) {
            setResultMessage(`Error: ${err.message || 'An unexpected error occurred'}`);
            alert(`An unexpected error occurred: ${err.message}`);
        } finally {
            setIsTriggering(false);
        }
    };

    const handleClearQueue = async () => {
        if (queuedItems.length === 0) {
            alert("The queue is already empty!");
            return;
        }

        if (!window.confirm(
            "CRITICAL WARNING:\n\n" +
            `Are you sure you want to clear and delete all ${queuedItems.length} queued events?\n` +
            "This will instantly delete them from the database WITHOUT sending any emails.\n\n" +
            "This is highly recommended to clean out duplicate or stale testing logs. This action is permanent."
        )) {
            return;
        }

        setIsClearing(true);
        setResultMessage(null);

        try {
            const res = await clearQueuedNotifications();
            if (res.success) {
                setResultMessage("Success: Notification queue successfully cleared without sending any emails.");
                alert("Queue Cleared Successfully!");
                await loadQueue();
            } else {
                setResultMessage(`Error: ${res.error || 'Failed to clear queue'}`);
                alert(`Failed to clear queue: ${res.error}`);
            }
        } catch (err: any) {
            setResultMessage(`Error: ${err.message || 'An unexpected error occurred'}`);
            alert(`An unexpected error occurred: ${err.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    // Filter queue
    const candidateEmails = queuedItems.filter(item => item.category === 'candidate_decision');
    const teamNotifications = queuedItems.filter(item => item.category !== 'candidate_decision');

    return (
        <section className="border-t border-border pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <h3
                    className="text-heading font-bold"
                    style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', letterSpacing: '-0.02em' }}
                >
                    Daily Summary <span className="italic-accent">Control & Queue</span>
                </h3>
                <button
                    onClick={loadQueue}
                    disabled={isLoadingQueue || isTriggering || isClearing}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-bold transition-colors"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin' : ''}`} />
                    <span>Refresh Queue</span>
                </button>
            </div>
            <p className="text-[12px] text-muted mb-4 leading-relaxed">
                Check and manage notifications currently on hold. These are compiled daily at <strong>6:00 PM PKT</strong> (1:00 PM UTC), or can be sent out immediately using the trigger below.
            </p>

            <div className="space-y-4">
                {/* Visual Queue Monitor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Candidate emails queue */}
                    <div className="bg-slate-50/50 border border-border rounded-sm p-4 flex flex-col min-h-[180px]">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                <Inbox className="w-3.5 h-3.5 text-primary" />
                                Held Candidate Decisions
                            </span>
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {candidateEmails.length} Pending
                            </span>
                        </div>

                        {isLoadingQueue ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted" />
                            </div>
                        ) : candidateEmails.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <Inbox className="w-6 h-6 text-slate-300 mb-1" />
                                <span className="text-[11px] text-muted font-medium">No decision emails on hold</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2 pr-1">
                                {candidateEmails.map((item) => {
                                    const isRec = item.event_type === 'CANDIDATE_RECOMMENDED';
                                    const { name, email } = item.details || {};
                                    const isRemovingThis = removingId === item.id;
                                    return (
                                        <div key={item.id} className="group relative bg-white border border-border p-2 rounded-sm flex items-start justify-between gap-2">
                                            <div className="min-w-0 pr-7">
                                                <p className="text-[11px] font-bold text-heading leading-tight truncate">{name}</p>
                                                <p className="text-[10px] text-muted leading-none mt-0.5 truncate">{email}</p>
                                                <p className="text-[9px] text-slate-400 mt-1">
                                                    Queued: {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                                                isRec
                                                    ? 'bg-green-50 text-green-700 border border-green-150'
                                                    : 'bg-red-50 text-red-750 border border-red-150'
                                            }`}>
                                                {isRec ? <UserCheck className="w-2.5 h-2.5" /> : <UserX className="w-2.5 h-2.5" />}
                                                {isRec ? 'Recommended' : 'Rejected'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOne(item)}
                                                disabled={isRemovingThis}
                                                title="Remove this entry from the queue (won't be sent)"
                                                className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors disabled:opacity-40"
                                            >
                                                {isRemovingThis ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <X className="w-3 h-3" strokeWidth={2.5} />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Team digests queue */}
                    <div className="bg-slate-50/50 border border-border rounded-sm p-4 flex flex-col min-h-[180px]">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                Held Administrative Digest Events
                            </span>
                            <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {teamNotifications.length} Events
                            </span>
                        </div>

                        {isLoadingQueue ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted" />
                            </div>
                        ) : teamNotifications.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <AlertCircle className="w-6 h-6 text-slate-300 mb-1" />
                                <span className="text-[11px] text-muted font-medium">No activity digest events on hold</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2 pr-1">
                                {teamNotifications.map((item) => {
                                    const isRemovingThis = removingId === item.id;
                                    return (
                                        <div key={item.id} className="group relative bg-white border border-border p-2 rounded-sm pr-7">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                                                    {item.event_type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[8px] text-slate-400 pr-4">
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted mt-1 leading-normal">
                                                {item.event_type === 'NEW_APPLICATION' && `New intake application: ${item.details?.name} (${item.details?.position})`}
                                                {item.event_type === 'APPROVED_PENDING_SLOTS' && `Approved awaiting slots: ${item.details?.name}`}
                                                {item.event_type === 'INVITE_SENT' && `Invite sent to: ${item.details?.name}`}
                                                {item.event_type === 'SLOT_BOOKED_INTERNAL' && `Slot booked by: ${item.details?.name}`}
                                                {item.event_type === 'DECISION' && `Decision logged for ${item.details?.name}: ${item.details?.status}`}
                                                {item.event_type === 'AVAILABILITY_RESPONSE' && `Availability response from interviewer for ${item.details?.candidateName}`}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOne(item)}
                                                disabled={isRemovingThis}
                                                title="Remove this entry from the queue (won't be sent)"
                                                className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors disabled:opacity-40"
                                            >
                                                {isRemovingThis ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <X className="w-3 h-3" strokeWidth={2.5} />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Operations Control Panel */}
                <div className="bg-slate-50/50 border border-border rounded-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-start gap-2 text-[11px] text-muted leading-relaxed">
                                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>
                                    <strong>Queue De-duplication:</strong> When you trigger dispatch, duplicates (like multiple bookings or application entries for the same candidate) are automatically merged into a single row.
                                    <br />
                                    Use <strong>Dispatch Summary Now</strong> to process and send, or click <strong>Clear Queue</strong> to permanently delete these entries without sending.
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <button
                                onClick={handleClearQueue}
                                disabled={isTriggering || isClearing || isLoadingQueue || queuedItems.length === 0}
                                className="px-3.5 py-2 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 text-[11px] font-bold rounded-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isClearing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                                <span>Clear Queue</span>
                            </button>

                            <button
                                onClick={handleTrigger}
                                disabled={isTriggering || isClearing || isLoadingQueue || queuedItems.length === 0}
                                className="btn-primary-v2 !py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTriggering ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <MailCheck className="w-3.5 h-3.5" />
                                )}
                                <span>Dispatch Summary Now</span>
                            </button>
                        </div>
                    </div>

                    {resultMessage && (
                        <div className={`mt-3 p-3 rounded-sm text-xs font-medium border ${
                            resultMessage.startsWith('Success') 
                                ? 'bg-green-50/50 border-green-200 text-green-800' 
                                : 'bg-red-50/50 border-red-200 text-red-800'
                        }`}>
                            {resultMessage}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
