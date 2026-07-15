"use client";

import { X, Phone, Mail, MapPin, GraduationCap, ExternalLink, Sparkles, ClipboardList, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Candidate, CandidateStatus } from "@/types/database";
import { calcAvg } from "@/components/InterviewScorecard";

interface CandidateProfileModalProps {
    candidate: Candidate;
    statusColors: Record<CandidateStatus, string>;
    formatCNIC: (cnic: string) => string;
    onClose: () => void;
    onViewAiAnalysis: (candidate: Candidate) => void;
    onViewInterviewScores: (candidate: Candidate) => void;
}

function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[9px] font-bold text-muted uppercase tracking-[0.16em] mb-1">{label}</p>
            <p className="text-[12.5px] font-semibold text-heading">{value}</p>
        </div>
    );
}

export default function CandidateProfileModal({
    candidate,
    statusColors,
    formatCNIC,
    onClose,
    onViewAiAnalysis,
    onViewInterviewScores,
}: CandidateProfileModalProps) {
    const s = candidate.interview_scores;
    const l1Avg = s?.l1_feedback_json ? calcAvg(s.l1_feedback_json) : null;
    const l2Avg = s?.l2_feedback_json ? calcAvg(s.l2_feedback_json) : null;
    const hasInterviewScores = l1Avg !== null || l2Avg !== null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={onClose} />
            <div className="bg-white rounded-sm shadow-premium w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[88vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-start bg-surface shrink-0">
                    <div className="min-w-0">
                        <h3 className="font-bold text-heading text-xl tracking-tight italic truncate">{candidate.name}</h3>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <span className={cn("status-badge whitespace-nowrap", statusColors[candidate.status])}>
                                {candidate.status}
                            </span>
                            {candidate.batch_number && (
                                <span className="text-[9px] font-bold text-muted bg-white px-2 py-0.5 rounded-sm border border-border">
                                    BATCH {candidate.batch_number}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white border border-transparent hover:border-border rounded-sm text-muted hover:text-heading transition-all shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-7 flex-1 custom-scrollbar">
                    {/* Contact */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Contact</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                                <span className="text-[12.5px] font-semibold text-heading truncate">{candidate.email}</span>
                            </div>
                            {candidate.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                                    <span className="text-[12.5px] font-semibold text-heading">{candidate.phone}</span>
                                </div>
                            )}
                            {candidate.cnic && <Field label="CNIC" value={formatCNIC(candidate.cnic)} />}
                            {candidate.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
                                    <span className="text-[12.5px] font-semibold text-heading">{candidate.location}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Academic profile */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} /> Academic Profile
                        </p>
                        <div className="grid grid-cols-2 gap-4 bg-surface border border-border rounded-sm p-4">
                            <Field label="University" value={candidate.university} />
                            <Field label="Degree Field" value={candidate.degree_field} />
                            <Field label="Graduation Year" value={candidate.graduation_year} />
                            <Field label="Education Status" value={candidate.education_status} />
                            <Field label="Position Applied" value={candidate.position} />
                        </div>
                    </div>

                    {/* AI screening */}
                    {(candidate.ai_score !== null && candidate.ai_score !== undefined) && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">AI Screening</p>
                            <button
                                onClick={() => onViewAiAnalysis(candidate)}
                                className="w-full flex items-center gap-3 bg-surface border border-border rounded-sm p-4 hover:border-primary/40 transition-colors text-left"
                            >
                                <div className={cn(
                                    "w-11 h-11 rounded-sm flex items-center justify-center text-sm font-bold shadow-soft border shrink-0",
                                    (candidate.ai_score ?? -1) >= 80 ? "bg-[#009245] text-white border-[#009245]" :
                                        (candidate.ai_score ?? -1) >= 60 ? "bg-[#22c55e] text-white border-[#22c55e]" :
                                            (candidate.ai_score ?? -1) >= 40 ? "bg-[#f59e0b] text-white border-[#f59e0b]" :
                                                "bg-[#ef4444] text-white border-[#ef4444]"
                                )}>
                                    {candidate.ai_score}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[12px] font-bold text-heading">{candidate.ai_analysis_json?.verdict || 'Processed'}</span>
                                        <Sparkles className="w-3 h-3 text-primary" />
                                    </div>
                                    <p className="text-[11px] text-muted truncate">{candidate.ai_reasoning}</p>
                                </div>
                                <span className="text-[10px] font-bold text-primary shrink-0">View Full →</span>
                            </button>
                        </div>
                    )}

                    {/* Assessment */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} /> Assessment
                        </p>
                        {candidate.assessment_score_url ? (
                            <a
                                href={candidate.assessment_score_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-surface border border-border rounded-sm p-4 text-primary font-bold text-[12.5px] hover:border-primary/40 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Score Sheet
                            </a>
                        ) : (
                            <p className="text-[11.5px] text-muted italic">No assessment score sheet uploaded yet.</p>
                        )}
                    </div>

                    {/* Interview scores */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Interview</p>
                        {hasInterviewScores ? (
                            <button
                                onClick={() => onViewInterviewScores(candidate)}
                                className="w-full bg-surface border border-border rounded-sm p-4 hover:border-primary/40 transition-colors text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {l1Avg !== null && (
                                            <div>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Round 1</p>
                                                <p className="text-lg font-bold text-heading italic">{l1Avg.toFixed(1)}<span className="text-[10px] text-muted not-italic font-normal"> /5.0</span></p>
                                            </div>
                                        )}
                                        {l2Avg !== null && (
                                            <div>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Round 2</p>
                                                <p className="text-lg font-bold text-heading italic">{l2Avg.toFixed(1)}<span className="text-[10px] text-muted not-italic font-normal"> /5.0</span></p>
                                            </div>
                                        )}
                                        {s?.decision && (
                                            <span className={cn(
                                                "text-[9px] font-bold px-2.5 py-1 rounded-sm border uppercase tracking-widest",
                                                s.decision === 'Recommended' ? "bg-primary text-white border-primary" :
                                                    s.decision === 'Not Recommended' ? "bg-red-600 text-white border-red-600" :
                                                        "bg-white text-muted border-border"
                                            )}>
                                                {s.decision}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-primary shrink-0">View Full →</span>
                                </div>
                            </button>
                        ) : (
                            <p className="text-[11.5px] text-muted italic">No interview scores recorded yet.</p>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="pt-5 border-t border-border flex items-center justify-between text-[10.5px] text-muted">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" strokeWidth={1.5} />
                            Applied {new Date(candidate.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        {candidate.last_action_by && <span>Last updated by {candidate.last_action_by}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
