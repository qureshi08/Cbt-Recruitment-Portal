'use client';

import { useState } from 'react';
import { KeyRound, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { updatePassword } from '@/app/actions';
import { cn } from '@/lib/utils';

export default function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords do not match");
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const res = await updatePassword(password);
            if (res.success) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setPassword('');
                    setConfirm('');
                }, 2000);
            } else {
                setError(res.error || "Update failed");
                setStatus('error');
            }
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-heading/60 backdrop-blur-sm" onClick={onClose} />

            <div className="bg-white rounded-sm shadow-premium w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
                <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-sm">
                            <KeyRound className="w-4 h-4 text-primary" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-bold text-heading text-[15px] tracking-tight">Security Settings</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white rounded-sm text-muted hover:text-heading transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">New Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field !py-2"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="input-field !py-2"
                            placeholder="••••••••"
                        />
                    </div>

                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-sm border border-red-100 text-[11px] font-medium flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100 text-[11px] font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Password updated successfully! Closing...
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2"
                    >
                        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
