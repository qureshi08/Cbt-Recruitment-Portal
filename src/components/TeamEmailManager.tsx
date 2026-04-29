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
    CalendarCheck
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
            // Refresh local state or reload
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

    const recruitmentEmails = recipients.filter(r => r.category === 'recruitment_team');
    const interviewerEmails = recipients.filter(r => r.category === 'interviewer');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        Team Notification Settings
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage who receives automated system notifications.</p>
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
                                <input name="email" type="email" required className="input-field h-11" placeholder="team@convergentbt.com" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Notification Category</label>
                                <select name="category" required className="input-field h-11">
                                    <option value="recruitment_team">Recruitment Team (New Apps & Bookings)</option>
                                    <option value="interviewer">Interviewers (Meeting Requests)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="submit" disabled={isSubmitting} className="btn-primary hover:bg-primary-dark">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Recipient"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recruitment Team Column */}
                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b border-border flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recruitment Team</h4>
                    </div>
                    <div className="p-2">
                        {recruitmentEmails.length === 0 ? (
                            <p className="p-4 text-sm text-gray-400 italic">No emails configured.</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recruitmentEmails.map((r) => (
                                    <div key={r.id} className="p-3 flex justify-between items-center group hover:bg-gray-50 rounded-lg transition-colors">
                                        <span className="text-sm text-gray-600 font-medium">{r.email}</span>
                                        <button
                                            onClick={() => handleRemoveRecipient(r.id, r.email)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Interviewers Column */}
                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b border-border flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Interviewers</h4>
                    </div>
                    <div className="p-2">
                        {interviewerEmails.length === 0 ? (
                            <p className="p-4 text-sm text-gray-400 italic">No emails configured.</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {interviewerEmails.map((r) => (
                                    <div key={r.id} className="p-3 flex justify-between items-center group hover:bg-gray-50 rounded-lg transition-colors">
                                        <span className="text-sm text-gray-600 font-medium">{r.email}</span>
                                        <button
                                            onClick={() => handleRemoveRecipient(r.id, r.email)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                <CalendarCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Email Logic Details:</p>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li><strong>Recruitment Team:</strong> Receives notification when a candidate submits an application or selects an assessment slot.</li>
                        <li><strong>Interviewers:</strong> Receives a meeting request email as soon as a candidate finishes their technical assessment.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
