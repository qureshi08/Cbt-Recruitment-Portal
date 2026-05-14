import { Video, Check, ShieldCheck, AlertCircle, Loader2, Link as LinkIcon, Save } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getMasterMeetingLink, updateMasterMeetingLink } from "@/app/actions";

export default function MicrosoftTeamsManager() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState("");
    const [masterLink, setMasterLink] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const microsoft = searchParams.get('microsoft');
        if (microsoft === 'success') setStatus('success');
        if (microsoft === 'error') {
            setStatus('error');
            setMsg(searchParams.get('msg') || "Failed to connect");
        }

        async function loadSettings() {
            const res = await getMasterMeetingLink();
            if (res.success) setMasterLink(res.value);
        }
        loadSettings();
    }, [searchParams]);

    const handleSaveLink = async () => {
        setIsSaving(true);
        await updateMasterMeetingLink(masterLink);
        setIsSaving(false);
        alert("Master Meeting Link Saved!");
    };

    return (
        <section className="border-t border-border pt-6 animate-in slide-in-from-bottom-2 duration-500 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <h3
                    className="text-heading font-bold"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", letterSpacing: "-0.02em" }}
                >
                    Microsoft <span className="italic-accent">Teams</span> Integration
                </h3>
            </div>

            {/* Option 2: Manual Master Link (No Permissions Needed) */}
            <div className="bg-surface border border-border rounded-md p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full mt-1">
                        <LinkIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[13px] font-bold text-heading">Fallback: Master Meeting Link</p>
                        <p className="text-[11px] text-muted leading-relaxed">
                            If the automated button above is blocked by your IT, simply paste a
                            permanent Teams meeting link here. The portal will use this link for all interviews.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={masterLink}
                        onChange={(e) => setMasterLink(e.target.value)}
                        placeholder="https://teams.microsoft.com/l/meetup-join/..."
                        className="flex-1 bg-white border border-border rounded-sm px-4 py-2 text-xs outline-none focus:border-primary transition-all"
                    />
                    <button
                        onClick={handleSaveLink}
                        disabled={isSaving}
                        className="btn-primary-v2 !py-2 shrink-0"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Link
                    </button>
                </div>
            </div>
        </section>
    );
}
