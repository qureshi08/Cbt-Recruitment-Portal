'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { getMasterMeetingLink, updateMasterMeetingLink, sendTestInvite } from '@/app/actions';

export default function MicrosoftTeamsManager() {
    const [masterLink, setMasterLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getMasterMeetingLink();
            if (res.success) setMasterLink(res.value);
            setIsLoading(false);
        }
        load();
    }, []);

    const handleSaveLink = async () => {
        setIsSaving(true);
        const res = await updateMasterMeetingLink(masterLink);
        if (res.success) {
            alert("Master Meeting Link Saved!");
        } else {
            alert("Error: " + res.error);
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="p-4 border border-border rounded-sm animate-pulse bg-slate-50/50" />;

    return (
        <section className="border-t border-border pt-6">
            <h3
                className="text-heading font-bold mb-1.5"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem', letterSpacing: '-0.02em' }}
            >
                Shared <span className="italic-accent">Teams Link</span>
            </h3>
            <p className="text-[12px] text-muted mb-4 leading-relaxed">
                Provide a permanent Microsoft Teams meeting link. This link will be used for all scheduled interviews.
                <br />
            </p>

            <div className="bg-slate-50/50 border border-border rounded-sm p-4">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2 ml-1">
                    Master Interview Link
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                        <input
                            type="text"
                            value={masterLink}
                            onChange={(e) => setMasterLink(e.target.value)}
                            placeholder="https://teams.microsoft.com/l/meetup-join/..."
                            className="w-full bg-white border border-border rounded-sm pl-9 pr-4 py-2 text-xs outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <button
                        onClick={handleSaveLink}
                        disabled={isSaving}
                        className="btn-primary-v2 !py-2 shrink-0"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Link
                    </button>
                    <button
                        onClick={async () => {
                            const res = await sendTestInvite();
                            if (res.success) alert("Test Email Sent to your account!");
                            else alert("Error: " + res.error);
                        }}
                        className="btn-secondary !py-2 shrink-0 flex items-center gap-2"
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Send Test Invite
                    </button>
                </div>

                <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50/50 p-2 rounded-sm border border-amber-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <span><strong>Privacy Note:</strong> This link is shared across all interviews. Ensure your Teams settings allow for a clean meeting lobby.</span>
                </div>
            </div>
        </section>
    );
}
