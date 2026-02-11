"use client";

import { useState } from "react";
import { Clock, User, CheckCircle, XCircle, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCandidateStatus, UserRole } from "@/app/actions";
import { supabase } from "@/lib/supabase";

interface Interview {
    id: string;
    candidate_id: string;
    scheduled_at: string;
    decision?: string | null;
    feedback?: string | null;
    candidates?: { name: string; position: string } | null;
}

interface InterviewListProps {
    initialInterviews: Interview[];
    userRoles: UserRole[];
}

export default function InterviewList({ initialInterviews, userRoles }: InterviewListProps) {
    const [interviews, setInterviews] = useState(initialInterviews);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDecision = async (decision: 'Recommended' | 'Not Recommended') => {
        if (!selectedInterview) return;
        setIsSubmitting(true);

        try {
            const feedback = (document.getElementById('feedback-textarea') as HTMLTextAreaElement).value;

            // 1. Update Interview record
            const { error: intError } = await supabase
                .from('interviews')
                .update({ decision, feedback })
                .eq('id', selectedInterview.id);

            if (intError) throw intError;

            // 2. Update Candidate Status
            await updateCandidateStatus(selectedInterview.candidate_id, decision);

            // 3. Update Local State
            setInterviews(prev => prev.map(i =>
                i.id === selectedInterview.id ? { ...i, decision, feedback } : i
            ));

            setSelectedInterview(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-border">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Interview</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {interviews.map((interview) => (
                        <tr key={interview.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                        {new Date(interview.scheduled_at).toLocaleString()}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">{interview.candidates?.name}</span>
                                    <span className="text-xs text-gray-500">{interview.candidates?.position}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {interview.decision ? (
                                    <span className={cn(
                                        "status-badge",
                                        interview.decision === 'Recommended' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    )}>
                                        {interview.decision}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Pending Feedback</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {!interview.decision && (userRoles.includes('Interviewer') || userRoles.includes('Master')) ? (
                                    <button
                                        onClick={() => setSelectedInterview(interview)}
                                        className="btn-secondary !py-1 !px-3 text-xs flex items-center justify-center gap-1 ml-auto"
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                        Submit Feedback
                                    </button>
                                ) : (
                                    !interview.decision && <span className="text-xs text-gray-400 font-medium">View Only</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {interviews.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                No interviews scheduled.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Feedback Modal */}
            {selectedInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedInterview(null)} />
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Interview Feedback: {selectedInterview.candidates?.name}</h3>
                            <button onClick={() => setSelectedInterview(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 font-bold uppercase tracking-wider text-xs">Interview Notes</label>
                                <textarea
                                    id="feedback-textarea"
                                    className="input-field min-h-[150px] py-3 text-sm"
                                    placeholder="Assess technical skills, communication, and cultural fit..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => handleDecision('Not Recommended')}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-lg font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleDecision('Recommended')}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-bold text-sm hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Recommend
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
