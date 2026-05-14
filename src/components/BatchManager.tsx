'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, ListOrdered } from 'lucide-react';
import { getCurrentBatchNumber, updateCurrentBatchNumber } from '@/app/actions';

export default function BatchManager() {
    const [batchNumber, setBatchNumber] = useState('31');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function load() {
            const res = await getCurrentBatchNumber();
            if (res.success) setBatchNumber(res.value);
            setIsLoading(false);
        }
        load();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateCurrentBatchNumber(batchNumber);
        if (res.success) {
            alert("Current Batch Updated Successfully!");
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
                Intake <span className="italic-accent">Management</span>
            </h3>
            <p className="text-[12px] text-muted mb-4 leading-relaxed">
                Set the current batch number for new applications. All new candidates will automatically be assigned this number.
            </p>

            <div className="bg-slate-50/50 border border-border rounded-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[200px]">
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 ml-1">
                            Current Batch Number
                        </label>
                        <div className="relative">
                            <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                            <input
                                type="text"
                                value={batchNumber}
                                onChange={(e) => setBatchNumber(e.target.value)}
                                placeholder="e.g. 31"
                                className="w-full bg-white border border-border rounded-sm pl-9 pr-4 py-2 text-xs outline-none focus:border-primary transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-end h-[58px]">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary-v2 !py-2 shrink-0 flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Update Batch</span>
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex items-start gap-2 text-[11px] text-muted leading-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 shrink-0" />
                    <span>Next applicant will be assigned as <strong>Batch #{batchNumber}</strong>.</span>
                </div>
            </div>
        </section>
    );
}
