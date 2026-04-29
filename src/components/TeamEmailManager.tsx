"use client";

import { useState } from "react";
import {
    Mail,
    Plus,
    Trash2,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Users,
    Briefcase,
    CalendarCheck,
    ShieldCheck,
    UserCircle,
    UserCog
} from "lucide-react";
import { addTeamNotificationRecipient, removeTeamNotificationRecipient } from "@/app/actions";
import { cn } from "@/lib/utils";

interface TeamEmailManagerProps {
    initialRecipients: any[];
}

export default function TeamEmailManager({ initialRecipients }: TeamEmailManagerProps) {
    const [recipients, setRecipients] = useState(initialRecipients);
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleAddRecipient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus(null);
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const category = formData.get('category') as string;

        const result = await addTeamNotificationRecipient(email, category);

        if (result.success) {
            setStatus({ type: 'success', message: 'Email recipient added successfully!' });
            setIsAdding(false);
            setTimeout(() => window.location.reload(), 1000);
        } else {
            setStatus({ type: 'error', message: result.error || 'Failed to add recipient.' });
        }
        setIsSubmitting(false);
    };

    const handleRemoveRecipient = async (id: string, email: string) => {
        if (!confirm(`Remove ${email} from notifications?`)) return;

        const result = await removeTeamNotificationRecipient(id);
        if (result.success) {
            setRecipients(prev => prev.filter(r => r.id !== id));
            setStatus({ type: 'success', message: 'Recipient removed successfully.' });
        } else {
            setStatus({ type: 'error', message: result.error || 'Removal failed.' });
        }
    };

    const getGroup = (cat: string) => recipients.filter(r => r.category === cat);

    const groups = [
        { id: 'recruitment_team', label: 'Recruitment Team', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'approver', label: 'Approvers', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'l1_interviewer', label: 'L1 Interviewers', icon: UserCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'l2_interviewer', label: 'L2 Interviewers', icon: UserCog, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Role-Based Notifications
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Configure automated emails for each recruitment stage.</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setStatus(null);
                    }}
                    className="btn-primary flex items-center gap-2 text-sm font-semibold rounded-xl shadow-sm"
                >
                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Recipient</>}
                </button>
            </div>

            {status && (
                <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in slide-in-from-top-4 duration-300",
                    status.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                )}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {status.message}
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-6 rounded-2xl border border-primary/20 shadow-lg animate-in zoom-in duration-200">
                    <form onSubmit={handleAddRecipient} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                <input name="email" type="email" required className="input-field h-11" placeholder="user@convergentbt.com" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Workflow Role</label>
                                <select name="category" required className="input-field h-11">
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="submit" disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Recipient"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map(group => {
                    const list = getGroup(group.id);
                    const Icon = group.icon;
                    return (
                        <div key={group.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div className={cn("p-4 border-b border-border flex items-center justify-between", group.bg)}>
                                <div className="flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4", group.color)} />
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{group.label}</h4>
                                </div>
                                <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full text-gray-500">
                                    {list.length} {list.length === 1 ? 'e-mail' : 'e-mails'}
                                </span>
                            </div>
                            <div className="p-2 min-h-[100px]">
                                {list.length === 0 ? (
                                    <p className="p-4 text-xs text-gray-400 italic text-center mt-4">No recipients assigned to this role.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {list.map((r) => (
                                            <div key={r.id} className="p-2.5 flex justify-between items-center group hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-border/50">
                                                <span className="text-sm text-gray-600 font-medium">{r.email}</span>
                                                <button
                                                    onClick={() => handleRemoveRecipient(r.id, r.email)}
                                                    className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all md:opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-3">
                    <CalendarCheck className="w-5 h-5" />
                    Automation Workflow Guide
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-emerald-800/80 leading-relaxed">
                    <div className="space-y-2">
                        <p><strong>Step 1:</strong> Candidate applies &rarr; <span className="font-semibold text-emerald-900">Recruitment & Approvers</span> notified.</p>
                        <p><strong>Step 2:</strong> Approver approves candidate &rarr; <span className="font-semibold text-emerald-900">Recruitment Team</span> notified.</p>
                        <p><strong>Step 3:</strong> Candidate books slot &rarr; <span className="font-semibold text-emerald-900">Recruitment Team</span> notified.</p>
                    </div>
                    <div className="space-y-2">
                        <p><strong>Step 4:</strong> Assessment marked complete &rarr; <span className="font-semibold text-emerald-900">L1 Interviewers</span> get meeting request.</p>
                        <p><strong>Step 5:</strong> L2 requested by L1 &rarr; <span className="font-semibold text-emerald-900">L2 Interviewers</span> get meeting request.</p>
                        <p><strong>Step 6:</strong> Final decision recorded &rarr; <span className="font-semibold text-emerald-900">Recruitment Team</span> notified to close file.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
