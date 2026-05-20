'use client';

import { useState } from 'react';
import { MailCheck, Loader2, Info } from 'lucide-react';
import { sendDailySummaryNotifications } from '@/app/actions';

export default function DailySummaryManager() {
    const [isTriggering, setIsTriggering] = useState(false);
    const [resultMessage, setResultMessage] = useState<string | null>(null);

    const handleTrigger = async () => {
        if (!window.confirm(
            "Are you sure you want to trigger the daily summary job now?\n\n" +
            "This will instantly process the queue, send all pending candidate decision emails (Rejections & Recommendations) " +
            "and consolidated team digests, and then clear the notifications queue."
        )) {
            return;
        }

        setIsTriggering(false);
        setResultMessage(null);
        setIsTriggering(true);

        try {
            const res = await sendDailySummaryNotifications();
            if (res.success) {
                const count = res.count || 0;
                setResultMessage(`Success! daily summary completed successfully. Processed and dispatched ${count} items.`);
                alert(`Daily Summary Dispatched Successfully!\nProcessed: ${count} events.`);
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

    return (
        <section className="border-t border-border pt-6">
            <h3
                className="text-heading font-bold mb-1.5"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', letterSpacing: '-0.02em' }}
            >
                Daily Summary <span className="italic-accent">Control</span>
            </h3>
            <p className="text-[12px] text-muted mb-4 leading-relaxed">
                Manually run the daily dispatch. This compiles the team activity digest and immediately sends out queued candidate decisions (recommendation & rejection emails) rather than waiting for the scheduled 6:00 PM PKT time.
            </p>

            <div className="bg-slate-50/50 border border-border rounded-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-start gap-2 text-[11px] text-muted leading-relaxed">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>
                                The daily summary is configured to run automatically everyday at <strong>6:00 PM PKT</strong> (1:00 PM UTC). 
                                Use this button if you have just finished interviews and want the candidate decision emails to go out immediately.
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center shrink-0">
                        <button
                            onClick={handleTrigger}
                            disabled={isTriggering}
                            className="btn-primary-v2 !py-2 flex items-center gap-2"
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
        </section>
    );
}
