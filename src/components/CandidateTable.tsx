"use client";

import { useState, useMemo, useRef } from "react";
import { useReactToPrint } from 'react-to-print';
import { Candidate, CandidateStatus, InterviewFeedbackJson } from "@/types/database";
import { updateCandidateStatus, deleteCandidate, UserRole, updateCandidate, uploadAssessmentScore, analyzeCandidateWithAi } from "@/app/actions";
import {
    ExternalLink,
    CheckCircle,
    XCircle,
    Copy,
    Check,
    Search,
    Filter,
    Phone,
    Trash2,
    Upload,
    Edit2,
    X,
    MoreHorizontal,
    Sparkles,
    ClipboardList,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// ─── Interview Score helpers ──────────────────────────────────────────────────

const SCORE_CATS: { key: keyof Omit<InterviewFeedbackJson, 'overall_notes'>; label: string }[] = [
    { key: 'technical', label: 'Technical' },
    { key: 'communication', label: 'Communication' },
    { key: 'masters_plans', label: "Master's Plans" },
    { key: 'analytical', label: 'Analytical' },
    { key: 'personality', label: 'Personality' },
];

function calcAvg(fb: InterviewFeedbackJson): number {
    const scores = SCORE_CATS.map(c => fb[c.key].score).filter(s => s > 0);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

function ScoreBar({ score }: { score: number }) {
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-primary', 'bg-primary'];
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={cn("h-1 w-3.5 rounded-full", n <= score ? colors[score] : 'bg-surface border border-border/50')} />
            ))}
        </div>
    );
}

function InterviewFeedbackModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
    const s = candidate.interview_scores;
    if (!s) return null;
    const l1 = s.l1_feedback_json;
    const l2 = s.l2_feedback_json;
    const l1Avg = l1 ? calcAvg(l1) : null;
    const l2Avg = l2 ? calcAvg(l2) : null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-heading/60 backdrop-blur-md" onClick={onClose} />
            <div className="bg-white rounded-sm shadow-premium w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-start bg-surface shrink-0">
                    <div>
                        <h3 className="font-bold text-heading text-xl tracking-tight italic">Interview Scorecard</h3>
                        <p className="text-[11px] font-bold text-muted mt-1 uppercase tracking-widest">{candidate.name}</p>
                        {s.decision && (
                            <span className={cn(
                                "mt-4 inline-block text-[9px] font-bold px-3 py-1 rounded-sm border uppercase tracking-widest",
                                s.decision === 'Recommended' ? "bg-primary text-white border-primary" :
                                    s.decision === 'Not Recommended' ? "bg-red-600 text-white border-red-600" :
                                        "bg-white text-muted border-border"
                            )}>
                                {s.decision}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white border border-transparent hover:border-border rounded-sm text-muted hover:text-heading transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
                    {/* Summary row */}
                    {(l1Avg !== null || l2Avg !== null) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {l1Avg !== null && (
                                <div className="bg-surface border border-border rounded-sm p-5 text-center">
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Round 01 Average</p>
                                    <p className="text-3xl font-bold text-heading italic">{l1Avg.toFixed(1)}<span className="text-sm text-muted not-italic font-normal"> / 5.0</span></p>
                                </div>
                            )}
                            {l2Avg !== null && (
                                <div className="bg-heading text-white rounded-sm p-5 text-center">
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] mb-2">Round 02 Average</p>
                                    <p className="text-3xl font-bold italic">{l2Avg.toFixed(1)}<span className="text-sm text-muted/50 not-italic font-normal"> / 5.0</span></p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Per-category breakdown */}
                    {[{ label: 'L1 Feedback Insights', fb: l1, type: 'L1' }, { label: 'L2 Feedback Insights', fb: l2, type: 'L2' }].map(({ label, fb, type }) => {
                        if (!fb) return null;
                        const isL2 = type === 'L2';
                        return (
                            <div key={label} className="space-y-4">
                                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1">{label}</label>
                                <div className={cn("rounded-sm border p-5 space-y-6 transition-all", isL2 ? "border-heading bg-white shadow-soft" : "border-primary/10 bg-surface")}>
                                    {SCORE_CATS.map(cat => {
                                        const d = fb[cat.key];
                                        if (!d || d.score === 0) return null;
                                        return (
                                            <div key={cat.key} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-heading uppercase tracking-wide">{cat.label}</span>
                                                    <div className="flex items-center gap-3">
                                                        <ScoreBar score={d.score} />
                                                        <span className={cn("text-xs font-black w-8 text-right italic", isL2 ? "text-heading" : "text-primary")}>{d.score}.0</span>
                                                    </div>
                                                </div>
                                                {d.notes && (
                                                    <div className="pl-4 border-l-2 border-primary/20">
                                                        <p className="text-sm text-body leading-relaxed font-semibold">{d.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {fb.overall_notes && (
                                        <div className="pt-6 border-t border-border mt-4">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Synthesis & Final Notes</p>
                                            <p className="text-sm text-heading leading-relaxed font-bold italic">"{fb.overall_notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-8 bg-surface border-t border-border shrink-0 text-center">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] italic">Official Recruitment Assessment Document</p>
                </div>
            </div>
        </div>
    );
}

interface CandidateTableProps {
    initialCandidates: Candidate[];
    userRoles: UserRole[];
}

const statusColors: Record<CandidateStatus, string> = {
    Applied: "bg-white text-heading border-border",
    Rejected: "bg-surface text-muted border-border font-bold",
    Approved: "bg-primary text-white border-primary shadow-sm",
    "Assessment Scheduled": "bg-heading text-white border-heading shadow-sm",
    Confirmed: "bg-primary text-white border-primary shadow-sm",
    Rescheduled: "bg-heading text-white border-heading shadow-sm",
    "Not Coming": "bg-surface text-muted border-border",
    "Assessment Completed": "bg-primary/5 text-primary border-primary/20 font-bold",
    "To Be Interviewed": "bg-primary/5 text-primary border-primary/20 font-bold",
    "Interview Scheduled": "bg-heading/5 text-heading border-heading/20 font-bold",
    Recommended: "bg-primary text-white border-primary shadow-premium font-bold",
    "Not Recommended": "bg-red-600 text-white border-red-700 shadow-sm font-bold",
    "L2 Interview Required": "bg-heading text-white border-heading shadow-sm font-bold",
};

const formatCNIC = (cnic: string) => {
    if (!cnic) return "";
    const cleaned = cnic.replace(/\D/g, '');
    if (cleaned.length === 13) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
    }
    return cnic;
};

export default function CandidateTable({ initialCandidates, userRoles }: CandidateTableProps) {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [batchFilter, setBatchFilter] = useState<string>("All");
    const [uploadingScore, setUploadingScore] = useState<string | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<{ id: string, status: 'success' | 'error', message?: string } | null>(null);
    const [selectedAiReasoning, setSelectedAiReasoning] = useState<Candidate | null>(null);
    const [selectedInterviewScores, setSelectedInterviewScores] = useState<Candidate | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const isMaster = userRoles.includes('Master');
    const isApprover = userRoles.includes('Approver');
    const isHR = userRoles.includes('HR');
    const isInterviewer = userRoles.includes('L1_Interviewer') || userRoles.includes('L2_Interviewer');

    const canApprove = isMaster || isApprover;
    const canDelete = isMaster;
    const canViewOnly = isHR || isInterviewer;

    const handleAiAnalysis = async (candidateId: string) => {
        setAnalyzingId(candidateId);
        setAnalysisStatus(null);
        try {
            const result = await analyzeCandidateWithAi(candidateId);
            if (result.success && result.analysis) {
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? {
                        ...c,
                        ai_score: result.analysis.score,
                        ai_reasoning: result.analysis.reasoning,
                        ai_analysis_json: result.analysis
                    } : c
                ));
                setAnalysisStatus({ id: candidateId, status: 'success' });
                // Reset success status after 3 seconds
                setTimeout(() => setAnalysisStatus(null), 3000);
            } else {
                setAnalysisStatus({ id: candidateId, status: 'error', message: result.error });
            }
        } catch (err: any) {
            setAnalysisStatus({ id: candidateId, status: 'error', message: "Technical Error: " + err.message });
        } finally {
            setAnalyzingId(null);
        }
    };

    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownloadReport = useReactToPrint({
        contentRef: reportRef,
        documentTitle: selectedAiReasoning ? `CGAP_AI_Report_${selectedAiReasoning.name.replace(/\s+/g, '_')}` : 'AI_Report',
        onBeforeGetContent: async () => {
            setIsDownloading(true);
            // wait a tick for state
            await new Promise(r => setTimeout(r, 100));
        },
        onAfterPrint: () => setIsDownloading(false),
        onPrintError: (err) => {
            console.error("Print error:", err);
            alert("Failed to generate PDF. Please try again.");
            setIsDownloading(false);
        }
    });

    const handleDelete = async (id: string) => {
        if (!canDelete) return;
        if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;

        const result = await deleteCandidate(id);
        if (result.success) {
            setCandidates(prev => prev.filter(c => c.id !== id));
        } else {
            alert("Failed to delete application: " + result.error);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: CandidateStatus) => {
        if (!canApprove && candidateStatusIsInitial(newStatus)) return;

        // Confirmation for actions that trigger emails
        const emailTriggerStatuses = ['Approved', 'Rejected', 'Recommended', 'Not Recommended'];
        if (emailTriggerStatuses.includes(newStatus)) {
            const confirmMsg = newStatus === 'Approved'
                ? "Are you sure you want to APPROVE this candidate? This will send an automated email with an assessment booking link."
                : `Are you sure you want to mark this candidate as ${newStatus.toUpperCase()}? This will send an automated rejection email.`;

            if (!window.confirm(confirmMsg)) return;
        }

        const result: any = await updateCandidateStatus(id, newStatus);
        if (result.success) {
            setCandidates(prev =>
                prev.map(c => c.id === id ? { ...c, status: newStatus, last_action_by: result.last_action_by } : c)
            );

            if (result.note) {
                alert(result.note);
            }
        } else {
            alert("Failed to update status: " + result.error);
        }
    };

    const handleScoreUpload = async (candidateId: string, file: File) => {
        setUploadingScore(candidateId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('candidateId', candidateId);

            const result = await uploadAssessmentScore(formData);

            if (result.success && result.publicUrl) {
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? {
                        ...c,
                        assessment_score_url: result.publicUrl,
                        last_action_by: result.last_action_by
                    } : c
                ));
                alert("Score uploaded successfully!");
            } else {
                throw new Error(result.error || "Failed to upload");
            }
        } catch (err: any) {
            alert("Failed to upload score: " + err.message);
        } finally {
            setUploadingScore(null);
        }
    };

    const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingCandidate) return;

        const formData = new FormData(e.currentTarget);
        const updates = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            cnic: (formData.get('cnic') as string || "").replace(/\D/g, ''),
            batch_number: formData.get('batch_number') as string,
        };

        const result = await updateCandidate(editingCandidate.id, updates);
        if (result.success) {
            setCandidates(prev => prev.map(c =>
                c.id === editingCandidate.id ? {
                    ...c,
                    ...updates,
                    last_action_by: result.last_action_by
                } : c
            ));
            setEditingCandidate(null);
            alert("Application updated successfully!");
        } else {
            alert("Failed to update: " + result.error);
        }
    };

    const candidateStatusIsInitial = (status: string) => {
        return status === 'Approved' || status === 'Rejected';
    };

    const copyBookingLink = (id: string) => {
        const link = `${window.location.origin}/book-slot/${id}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter(candidate => {
            const matchesSearch =
                candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (candidate.phone && candidate.phone.includes(searchQuery));

            const matchesStatus = statusFilter === "All" || candidate.status === statusFilter;
            const matchesBatch = batchFilter === "All" || candidate.batch_number === batchFilter;

            return matchesSearch && matchesStatus && matchesBatch;
        });
    }, [candidates, searchQuery, statusFilter, batchFilter]);

    const statuses = ["All", ...Object.keys(statusColors)];
    const batches = ["All", ...Array.from(new Set(candidates.map(c => c.batch_number).filter(Boolean)))];

    return (
        <div className="space-y-3">
            {/* Search and Filter Bar */}
            <div className="bg-white border border-border rounded-sm px-4 py-2 flex flex-col sm:flex-row gap-2.5 items-center shadow-soft">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input
                        type="text"
                        placeholder="Filter by name, email or mobile..."
                        className="w-full bg-surface border border-border rounded-sm pl-9 pr-3 py-1.5 text-[11px] font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 placeholder:text-muted outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-muted uppercase tracking-wider">Status</span>
                        <select
                            className="border border-border bg-surface rounded-sm px-2 py-1 text-[10px] font-bold cursor-pointer hover:border-primary transition-colors outline-none text-heading"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-muted uppercase tracking-wider">Batch</span>
                        <select
                            className="border border-border bg-surface rounded-sm px-2 py-1 text-[10px] font-bold cursor-pointer hover:border-primary transition-colors outline-none text-heading"
                            value={batchFilter}
                            onChange={(e) => setBatchFilter(e.target.value)}
                        >
                            {batches.map(batch => (
                                <option key={batch as string} value={batch as string}>{batch}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-sm border border-border bg-white shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed" style={{ minWidth: '680px' }}>
                        <thead>
                            <tr className="bg-surface border-b border-border">
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-14">Batch</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[22%]">Candidate</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[18%]">Profile Details</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[20%]">AI Analysis</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[12%]">Evaluation</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[14%]">Interviews</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] w-[14%]">Status</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-muted uppercase tracking-[0.2em] text-right w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 bg-white">
                            {filteredCandidates.map((candidate) => (
                                <tr key={candidate.id} className="hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-3 py-2.5">
                                        <span className="text-[10px] font-bold text-muted bg-surface px-2 py-0.5 rounded-sm border border-border">
                                            {candidate.batch_number || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 overflow-hidden">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-bold text-heading leading-tight truncate" title={candidate.name}>{candidate.name}</span>
                                            <span className="text-[11px] text-muted font-medium truncate" title={candidate.email}>{candidate.email}</span>
                                            {candidate.phone && (
                                                <span className="text-[10px] text-primary font-bold flex items-center gap-1.5 mt-0.5">
                                                    <Phone className="w-2.5 h-2.5 shrink-0" />
                                                    {candidate.phone}
                                                </span>
                                            )}
                                            {candidate.cnic && (
                                                <span className="text-[9px] text-muted tracking-tight font-bold mt-1 uppercase" title={`CNIC: ${candidate.cnic}`}>
                                                    ID: {formatCNIC(candidate.cnic)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 overflow-hidden">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            {candidate.location && (
                                                <span className="text-[10px] font-bold text-heading truncate flex items-center gap-2" title={candidate.location}>
                                                    📍 {candidate.location}
                                                </span>
                                            )}
                                            {candidate.degree_field && (
                                                <span className="text-[10px] px-2 py-1 bg-surface text-primary rounded-sm font-bold border border-border truncate uppercase tracking-tight" title={candidate.degree_field}>
                                                    {candidate.degree_field}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {candidate.graduation_year && (
                                                    <span className="text-[10px] text-muted font-bold bg-white px-1.5 py-0.5 rounded-sm border border-border">
                                                        BATCH '{candidate.graduation_year.slice(-2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-col gap-2 items-start">
                                            {/* AI Status Indicators */}
                                            {candidate.ai_status === 'processing' || analyzingId === candidate.id ? (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-sm w-full animate-pulse">
                                                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Analyzing...</span>
                                                </div>
                                            ) : candidate.ai_status === 'completed' || (candidate.ai_score !== null && candidate.ai_score !== undefined) ? (
                                                <div
                                                    className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity w-full"
                                                    onClick={() => setSelectedAiReasoning(candidate)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-sm flex items-center justify-center text-xs font-bold shadow-soft border shrink-0",
                                                            (candidate.ai_score ?? 0) >= 80 ? "bg-primary text-white border-primary" :
                                                                (candidate.ai_score ?? 0) >= 50 ? "bg-amber-500 text-white border-amber-600" :
                                                                    (candidate.ai_score ?? 0) > 0 ? "bg-heading text-white border-heading" :
                                                                        "bg-slate-100 text-muted border-border"
                                                        )}>
                                                            {candidate.ai_score ?? '—'}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-gray-700 truncate">
                                                                    {candidate.ai_analysis_json?.verdict || 'Processed'}
                                                                </span>
                                                                <Sparkles className="w-2.5 h-2.5 text-primary" />
                                                            </div>
                                                            <p className="text-[9px] text-gray-400 truncate max-w-[120px]">
                                                                {candidate.ai_reasoning}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : candidate.ai_status === 'failed' ? (
                                                <div className="flex flex-col gap-1 w-full">
                                                    <button
                                                        onClick={() => handleAiAnalysis(candidate.id)}
                                                        className="flex items-center justify-center gap-2 px-3 py-1 text-[10px] font-bold rounded-sm border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors w-full"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        SCREENING FAILED
                                                    </button>
                                                    <p className="text-[8px] text-red-500 font-medium leading-tight px-1 italic truncate max-w-[180px]" title={candidate.ai_reasoning}>
                                                        Error: {candidate.ai_reasoning}
                                                    </p>
                                                </div>
                                            ) : (canApprove && candidate.resume_url) ? (
                                                <button
                                                    onClick={() => handleAiAnalysis(candidate.id)}
                                                    className="flex items-center justify-center gap-2 px-3 py-1 text-[10px] font-bold rounded-sm border bg-surface text-heading border-border hover:border-primary hover:text-primary transition-colors w-full group"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                                                    {candidate.ai_status === 'pending' ? 'READY TO SCREEN' : 'RUN AI SCREENING'}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic px-1">
                                                    {!candidate.resume_url ? 'No resume' : 'Waiting...'}
                                                </span>
                                            )}

                                            {/* Resume Link - Always show if available */}
                                            {candidate.resume_url && (
                                                <a
                                                    href={candidate.resume_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded-md hover:bg-primary/10 hover:text-primary transition-all border border-gray-200/50"
                                                >
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                    View Resume
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {candidate.assessment_score_url ? (
                                            <a
                                                href={candidate.assessment_score_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-xs text-primary font-bold hover:underline"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                View Score Sheet
                                            </a>
                                        ) : (isMaster || isHR) ? (
                                            <div className="flex items-center gap-2">
                                                <label className="cursor-pointer bg-surface border border-border hover:border-primary px-3 py-1 rounded-sm text-[11px] font-bold text-heading flex items-center gap-2 transition-all">
                                                    {uploadingScore === candidate.id ? (
                                                        <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                    ) : <Upload className="w-3 h-3" />}
                                                    Upload
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleScoreUpload(candidate.id, file);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No score uploaded</span>
                                        )}
                                    </td>
                                    {/* Interview Scores */}
                                    <td className="px-3 py-2.5">
                                        {candidate.interview_scores?.l1_feedback_json || candidate.interview_scores?.l2_feedback_json ? (
                                            <div className="flex flex-col gap-1.5">
                                                {candidate.interview_scores.l1_feedback_json && (
                                                    <div className="flex flex-col gap-0.5 mb-1 last:mb-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-black text-blue-500 uppercase">L1</span>
                                                            <ScoreBar score={Math.round(calcAvg(candidate.interview_scores.l1_feedback_json))} />
                                                            <span className="text-[10px] font-black text-blue-700">{calcAvg(candidate.interview_scores.l1_feedback_json).toFixed(1)}</span>
                                                        </div>
                                                        {candidate.interview_scores.l1_interviewer_name && (
                                                            <span className="text-[8px] text-gray-400 font-bold ml-5 italic">— {candidate.interview_scores.l1_interviewer_name}</span>
                                                        )}
                                                    </div>
                                                )}
                                                {candidate.interview_scores.l2_feedback_json && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] font-black text-purple-500 uppercase">L2</span>
                                                            <ScoreBar score={Math.round(calcAvg(candidate.interview_scores.l2_feedback_json))} />
                                                            <span className="text-[10px] font-black text-purple-700">{calcAvg(candidate.interview_scores.l2_feedback_json).toFixed(1)}</span>
                                                        </div>
                                                        {candidate.interview_scores.l2_interviewer_name && (
                                                            <span className="text-[8px] text-gray-400 font-bold ml-5 italic">— {candidate.interview_scores.l2_interviewer_name}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedInterviewScores(candidate)}
                                                    className="flex items-center gap-1 text-[9px] font-bold text-gray-500 hover:text-primary transition-colors mt-0.5"
                                                >
                                                    <ClipboardList className="w-2.5 h-2.5" />
                                                    View Report
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">—</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={cn("status-badge whitespace-nowrap", statusColors[candidate.status])}>
                                                {candidate.status}
                                            </span>
                                            {candidate.last_action_by && (
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                    By: {candidate.last_action_by}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {candidate.status === 'Approved' && (isMaster || isHR) && (
                                                <button
                                                    onClick={() => copyBookingLink(candidate.id)}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-surface text-primary text-[10px] font-bold rounded-sm hover:border-primary transition-all border border-border"
                                                    title="Copy booking link for candidate"
                                                >
                                                    {copiedId === candidate.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    Link
                                                </button>
                                            )}



                                            {candidate.status === 'Applied' && canApprove && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'Approved')}
                                                        className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(candidate.id, 'Rejected')}
                                                        className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {(isMaster || isHR || isApprover) && (
                                                <button
                                                    onClick={() => setEditingCandidate(candidate)}
                                                    className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(candidate.id)}
                                                    className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}


                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-muted text-sm italic">
                                        No candidates match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Candidate Modal */}
            {
                editingCandidate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingCandidate(null)} />
                        <div className="bg-white rounded-sm shadow-premium w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
                            <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                                <h3 className="font-bold text-heading text-sm uppercase tracking-tight italic">Edit Candidate Account: {editingCandidate.name}</h3>
                                <button onClick={() => setEditingCandidate(null)} className="text-muted hover:text-heading transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleEditSave} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                    <input name="name" defaultValue={editingCandidate.name} required className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                    <input name="email" type="email" defaultValue={editingCandidate.email} required className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                    <input name="phone" defaultValue={editingCandidate.phone} required className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">CNIC</label>
                                    <input name="cnic" defaultValue={editingCandidate.cnic} placeholder="e.g. 61101-XXXXXXX-X" className="input-field" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Batch Number</label>
                                    <input name="batch_number" defaultValue={editingCandidate.batch_number} placeholder="e.g. 26" className="input-field" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setEditingCandidate(null)} className="btn-secondary flex-1">Cancel</button>
                                    <button type="submit" className="btn-primary flex-1">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* AI Reasoning Modal */}
            {selectedAiReasoning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedAiReasoning(null)} />
                    <div ref={reportRef} id="ai-report-outer" className="bg-white rounded-sm shadow-premium w-full max-w-xl relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[80vh] print:max-h-none print:w-[100vw] print:max-w-none print:shadow-none print:overflow-visible">

                        {/* Header */}
                        <div className="p-4 border-b border-border flex justify-between items-start bg-surface shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-sm flex items-center justify-center text-lg font-bold shadow-soft border border-border shrink-0",
                                    (selectedAiReasoning.ai_score || 0) >= 80 ? "bg-primary text-white border-primary" :
                                        (selectedAiReasoning.ai_score || 0) >= 50 ? "bg-amber-500 text-white border-amber-600" :
                                            (selectedAiReasoning.ai_score || 0) > 0 ? "bg-slate-700 text-white border-slate-800" :
                                                "bg-slate-100 text-slate-400 border-slate-200"
                                )}>
                                    {selectedAiReasoning.ai_score || '—'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-heading tracking-tight italic">{selectedAiReasoning.name}</h3>
                                    <p className="text-muted font-bold text-[10px] mt-0.5 uppercase tracking-widest">{selectedAiReasoning.position || 'Software Engineer'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="px-2 py-0.5 bg-white border border-primary/20 text-primary rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            AI VERDICT: {selectedAiReasoning.ai_analysis_json?.verdict || 'ANALYSIS PROCESSED'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAiReasoning(null)} className="p-2 border border-transparent hover:border-border hover:bg-white rounded-sm text-muted hover:text-heading transition-all shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div id="ai-report-scrollable" className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-white print:overflow-visible">
                            <div className="space-y-4">
                                <div className="p-4 rounded-sm bg-surface border border-border relative overflow-hidden">
                                    <h4 className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Target Criteria Alignment</h4>
                                    <p className="text-[13px] text-heading leading-relaxed font-bold italic">
                                        "{selectedAiReasoning.analysis_criteria || "Standard Technical Evaluation."}"
                                    </p>
                                </div>

                                {/* Skills Grid */}
                                <div>
                                    <label className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] px-1 mb-3 block">Extracted Skillset</label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAiReasoning.ai_analysis_json?.extracted_skills && selectedAiReasoning.ai_analysis_json.extracted_skills.length > 0 ? (
                                            selectedAiReasoning.ai_analysis_json.extracted_skills.map((skill: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-surface border border-border rounded-sm text-[10px] font-bold text-heading hover:border-primary transition-colors cursor-default">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="w-full text-center py-5 bg-surface rounded-sm border border-dashed border-border flex flex-col items-center gap-2">
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest italic opacity-40">No skills identified in resume</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 rounded-sm bg-heading text-white shadow-soft relative overflow-hidden">
                                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Candidate Profile Record</h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-4">
                                        {selectedAiReasoning.ai_analysis_json?.extracted_info && Object.entries(selectedAiReasoning.ai_analysis_json.extracted_info).map(([k, v]: [string, any]) => (
                                            <div key={k} className="flex flex-col gap-0.5">
                                                <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-60">{k.replace(/_/g, " ")}</span>
                                                <span className="text-[11px] font-bold text-white truncate" title={v || 'N/A'}>{v || 'N/A'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience Narratives */}
                                <div>
                                    <label className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] px-1 mb-2 block">Professional Narrative</label>
                                    <div className="bg-surface p-4 rounded-sm border border-border">
                                        <p className="text-[13px] text-heading leading-relaxed font-bold italic">
                                            "{selectedAiReasoning.ai_analysis_json?.experience_summary || "Candidate experience overview is being processed."}"
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Requirement Matching Analysis</label>
                                        {selectedAiReasoning.ai_analysis_json?.hard_filter_failed && (
                                            <div className="px-2 py-0.5 bg-red-600 text-white rounded-sm text-[8px] font-bold uppercase tracking-widest">
                                                CRITICAL FAILURE: {selectedAiReasoning.ai_analysis_json.hard_filter_failed}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedAiReasoning.ai_analysis_json?.matching_analysis && typeof selectedAiReasoning.ai_analysis_json.matching_analysis === 'object' ? (
                                            Object.entries(selectedAiReasoning.ai_analysis_json.matching_analysis).map(([key, val]: [string, any]) => (
                                                <div key={key} className="bg-white p-4 rounded-sm border border-border shadow-soft hover:border-primary transition-colors group">
                                                    <div className="flex justify-between items-start mb-2 gap-3">
                                                        <span className="text-[9px] font-bold text-muted uppercase tracking-tight group-hover:text-primary transition-colors">
                                                            {key.replace(/_/g, " ")}
                                                        </span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider shrink-0",
                                                            ["PASS", "STRONG", "HIGH"].includes(String(val.status).toUpperCase()) ? "bg-primary text-white" :
                                                                ["FAIL", "WEAK", "NONE"].includes(String(val.status).toUpperCase()) ? "bg-red-600 text-white" :
                                                                    "bg-amber-500 text-white"
                                                        )}>
                                                            {val.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-body leading-relaxed font-bold">{val.detail}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 bg-surface p-5 rounded-sm border border-border border-dashed italic text-[10px] text-muted text-center font-bold uppercase tracking-widest">
                                                Detailed matching analysis not generated
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Observation Flags */}
                                {selectedAiReasoning.ai_analysis_json?.flags && selectedAiReasoning.ai_analysis_json.flags.length > 0 && (
                                    <div className="p-5 rounded-sm bg-amber-50 border border-amber-100 shadow-soft">
                                        <h4 className="text-[9px] font-bold text-amber-700 uppercase tracking-[0.2em] mb-3">System Inference Flags</h4>
                                        <ul className="space-y-2">
                                            {selectedAiReasoning.ai_analysis_json.flags.map((flag, idx) => (
                                                <li key={idx} className="text-[10px] leading-relaxed font-bold text-amber-800 flex gap-2.5">
                                                    <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                                                    {flag}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-border flex gap-3 bg-surface shrink-0" data-html2canvas-ignore="true">
                            <button
                                onClick={() => setSelectedAiReasoning(null)}
                                className="flex-1 px-4 py-2.5 bg-white border border-border text-heading text-[11px] font-bold rounded-sm hover:bg-surface transition-all uppercase tracking-widest"
                            >
                                Dismiss
                            </button>
                            {selectedAiReasoning.ai_analysis_json && (
                                <button
                                    onClick={() => handleDownloadReport()}
                                    disabled={isDownloading}
                                    className="flex-1 px-4 py-2.5 bg-white border border-border text-primary text-[11px] font-bold rounded-sm hover:bg-primary/5 hover:border-primary/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isDownloading ? <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                    Download PDF
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    handleAiAnalysis(selectedAiReasoning.id);
                                    setSelectedAiReasoning(null);
                                }}
                                className="flex-[2] bg-primary text-white border border-primary-hover py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-soft"
                            >
                                <Sparkles className="w-3 h-3" />
                                Re-Analyze Candidate
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Interview Scores Modal */}
            {selectedInterviewScores && (
                <InterviewFeedbackModal
                    candidate={selectedInterviewScores}
                    onClose={() => setSelectedInterviewScores(null)}
                />
            )}
        </div>
    );
}
