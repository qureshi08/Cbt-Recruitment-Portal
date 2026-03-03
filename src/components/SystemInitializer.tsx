"use client";

import { useState } from "react";
import { Settings, CheckCircle2, AlertCircle } from "lucide-react";
import { ensureBuckets } from "@/app/actions";

export default function SystemInitializer() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    const handleInitialize = async () => {
        setStatus('loading');
        try {
            const result = await ensureBuckets();
            if (result.success) {
                setStatus('success');
                setMessage("Storage buckets initialized successfully!");
            } else {
                setStatus('error');
                setMessage(result.error);
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">System Storage Setup</h4>
                    <p className="text-sm text-gray-500">Initialize missing storage buckets (Resumes, Scores).</p>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2">
                <button
                    onClick={handleInitialize}
                    disabled={status === 'loading'}
                    className="btn-primary !py-2 !px-6 text-sm flex items-center gap-2"
                >
                    {status === 'loading' ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "Initialize Buckets"}
                </button>

                {status === 'success' && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {message}
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-1 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-3 h-3" />
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
