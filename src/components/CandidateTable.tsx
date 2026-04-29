"use client";

import { useState, useMemo } from "react";
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
    const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-500', 'bg-green-500'];
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={cn("h-1 w-4 rounded-full", n <= score ? colors[score] : 'bg-gray-200')} />
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
            <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-start bg-surface-alt shrink-0">
                    <div>
                        <h3 className="font-black text-heading text-2xl tracking-tight italic">Interview Scorecard</h3>
                        <p className="text-sm font-bold text-muted mt-1 uppercase tracking-widest">{candidate.name}</p>
                        {s.decision && (
                            <span className={cn(
                                "mt-4 inline-block text-[10px] font-black px-4 py-1.5 rounded-full border",
                                s.decision === 'Recommended' ? "bg-green-500 text-white border-green-600" :
                                    s.decision === 'Not Recommended' ? "bg-red-500 text-white border-red-600" :
                                        "bg-primary/10 text-primary border-primary/20"
                            )}>
                                {s.decision.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-muted hover:text-heading shadow-sm transition-all hover:rotate-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto p-8 space-y-8 flex-1 custom-scrollbar">
                    {/* Summary row */}
                    {(l1Avg !== null || l2Avg !== null) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {l1Avg !== null && (
                                <div className="bg-primary-light border-2 border-primary/10 rounded-3xl p-6 text-center shadow-soft">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Round 01 Average</p>
                                    <p className="text-4xl font-black text-heading italic">{l1Avg.toFixed(1)}<span className="text-lg text-muted not-italic"> / 5.0</span></p>
                                </div>
                            )}
                            {l2Avg !== null && (
                                <div className="bg-heading text-white rounded-3xl p-6 text-center shadow-elevated">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Round 02 Average</p>
                                    <p className="text-4xl font-black italic">{l2Avg.toFixed(1)}<span className="text-lg text-muted/50 not-italic"> / 5.0</span></p>
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
                                <div className={cn("rounded-[2rem] border-2 p-6 space-y-6 shadow-soft transition-all", isL2 ? "border-heading bg-white" : "border-primary/10 bg-surface-alt")}>
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

                <div className="p-8 bg-surface-alt border-t border-border shrink-0 text-center">
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
    Applied: "bg-surface-alt text-heading border-border",
    Rejected: "bg-rose-50 text-rose-700 border-rose-100",
    Approved: "bg-primary/10 text-primary border-primary/20",
    "Assessment Scheduled": "bg-indigo-50 text-indigo-700 border-indigo-100",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Rescheduled: "bg-amber-50 text-amber-700 border-amber-100",
    "Not Coming": "bg-slate-50 text-slate-700 border-slate-100",
    "Assessment Completed": "bg-teal-50 text-teal-700 border-teal-100",
    "To Be Interviewed": "bg-cyan-50 text-cyan-700 border-cyan-100",
    "Interview Scheduled": "bg-violet-50 text-violet-700 border-violet-100",
    Recommended: "bg-primary text-white border-primary shadow-sm",
    "Not Recommended": "bg-rose-600 text-white border-rose-700 shadow-sm",
    "L2 Interview Required": "bg-sky-600 text-white border-sky-700 shadow-sm",
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
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="card !p-6 flex flex-col md:flex-row gap-6 items-center bg-white shadow-soft">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Filter by name, email or mobile..."
                        className="input-field !pl-12 !h-14 !rounded-2xl shadow-inner border-border/60"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1">Status Phase</span>
                        <select
                            className="input-field !h-12 !py-0 !px-4 !text-xs !rounded-xl cursor-pointer hover:border-primary transition-colors"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[100px]">
                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-1">Batch ID</span>
                        <select
                            className="input-field !h-12 !py-0 !px-4 !text-xs !rounded-xl cursor-pointer hover:border-primary transition-colors"
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

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-border text-[10px]">
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">Candidate / Contact</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">Demographics</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">AI Analysis</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">Assessment Score</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">Interview</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-6 font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-6">
                                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                        {candidate.batch_number || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-sm font-bold text-gray-900 leading-none">{candidate.name}</span>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] text-gray-500 font-medium">{candidate.email}</span>
                                            {candidate.phone && (
                                                <span className="text-[11px] text-primary font-bold flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3" />
                                                    {candidate.phone}
                                                </span>
                                            )}
                                            {candidate.cnic && (
                                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-0.5" title="CNIC">
                                                    <span className="px-1 bg-gray-100 rounded text-[9px]">CNIC</span>
                                                    {formatCNIC(candidate.cnic)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex flex-col gap-1 max-w-[200px]">
                                        {candidate.location && (
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">
                                                📍 {candidate.location}
                                            </span>
                                        )}
                                        {candidate.degree_field && (
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100/50">
                                                    {candidate.degree_field}
                                                </span>
                                                {candidate.graduation_year && (
                                                    <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded-sm">
                                                        '{candidate.graduation_year.slice(-2)}
                                                    </span>
                                                )}
                                                {candidate.education_status && candidate.education_status !== 'Graduated' && (
                                                    <span className="text-[10px] text-yellow-600 font-bold bg-yellow-50 px-1.5 py-0.5 rounded-sm">
                                                        Student
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {!candidate.location && !candidate.degree_field && (
                                            <span className="text-xs text-gray-400 italic">Not provided</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    {candidate.ai_score !== undefined ? (
                                        <div className="flex flex-col items-start gap-1">
                                            <div
                                                className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setSelectedAiReasoning(candidate)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm",
                                                        candidate.ai_score >= 80 ? "bg-green-100 text-green-700 border border-green-200" :
                                                            candidate.ai_score >= 50 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                                                                "bg-red-100 text-red-700 border border-red-200"
                                                    )}>
                                                        {candidate.ai_score}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-bold text-gray-700">
                                                                {candidate.ai_analysis_json?.verdict || 'Start Analyzing'}
                                                            </span>
                                                            <Sparkles className="w-2.5 h-2.5 text-primary animate-pulse" />
                                                        </div>
                                                        <p className="text-[9px] text-gray-400 truncate max-w-[100px]">
                                                            {candidate.ai_reasoning}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {candidate.resume_url && (
                                                <a
                                                    href={candidate.resume_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md hover:bg-primary/10 hover:text-primary transition-all border border-gray-200/50"
                                                >
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                    Resume
                                                </a>
                                            )}
                                        </div>
                                    ) : (canApprove && (candidate.resume_url)) ? (
                                        <div className="flex flex-col gap-2 items-start max-w-[200px]">
                                            <button
                                                onClick={() => handleAiAnalysis(candidate.id)}
                                                disabled={analyzingId === candidate.id}
                                                className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black rounded-xl border transition-all disabled:opacity-50 ${analysisStatus?.id === candidate.id && analysisStatus.status === 'success'
                                                        ? 'bg-emerald-500 text-white border-emerald-600'
                                                        : analysisStatus?.id === candidate.id && analysisStatus.status === 'error'
                                                            ? 'bg-rose-500 text-white border-rose-600'
                                                            : 'bg-primary/10 text-primary border-primary/10 hover:bg-primary hover:text-white'
                                                    }`}
                                            >
                                                {analyzingId === candidate.id ? (
                                                    <span className="w-3 h-3 border-2 border-primary/30 border-t-white rounded-full animate-spin" />
                                                ) : analysisStatus?.id === candidate.id && analysisStatus.status === 'success' ? (
                                                    <Check className="w-3.5 h-3.5" />
                                                ) : <Sparkles className="w-3.5 h-3.5" />}
                                                {analyzingId === candidate.id ? 'ANALYZING...' :
                                                    analysisStatus?.id === candidate.id && analysisStatus.status === 'success' ? 'DONE!' :
                                                        'RUN AI SCREENING'}
                                            </button>

                                            {analysisStatus?.id === candidate.id && analysisStatus.status === 'error' && (
                                                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                                                    <p className="text-[9px] text-rose-700 leading-tight">
                                                        <strong className="block uppercase tracking-widest text-[8px] mb-1">Diagnostic Report:</strong>
                                                        {analysisStatus.message}
                                                    </p>
                                                </div>
                                            )}

                                            {candidate.resume_url && (
                                                <a
                                                    href={candidate.resume_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md hover:bg-primary/10 hover:text-primary transition-all border border-gray-200/50"
                                                >
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                    Resume
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-[10px] text-gray-400 italic">
                                                {!candidate.resume_url ? 'No resume' : 'No analysis'}
                                            </span>
                                            {candidate.resume_url && (
                                                <a
                                                    href={candidate.resume_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md hover:bg-primary/10 hover:text-primary transition-all border border-gray-200/50"
                                                >
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                    Resume
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-6">
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
                                            <label className="cursor-pointer bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 flex items-center gap-2 transition-all">
                                                {uploadingScore === candidate.id ? (
                                                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                ) : <Upload className="w-3 h-3" />}
                                                Upload Score
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
                                <td className="px-6 py-6">
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
                                <td className="px-6 py-6">
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
                                <td className="px-6 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {candidate.status === 'Approved' && (isMaster || isHR) && (
                                            <button
                                                onClick={() => copyBookingLink(candidate.id)}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded hover:bg-primary/20 transition-all border border-primary/20"
                                                title="Copy booking link for candidate"
                                            >
                                                {copiedId === candidate.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiedId === candidate.id ? "Copied" : "Booking Link"}
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
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                    No candidates match your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >

            {/* Edit Candidate Modal */}
            {
                editingCandidate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingCandidate(null)} />
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">Edit Application: {editingCandidate.name}</h3>
                                <button onClick={() => setEditingCandidate(null)} className="text-gray-400 hover:text-gray-600">
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
            {
                selectedAiReasoning && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedAiReasoning(null)} />
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-8 border-b border-border flex justify-between items-start bg-gradient-to-br from-primary/10 via-white to-transparent">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-xl border-4 border-white",
                                        (selectedAiReasoning.ai_score || 0) >= 80 ? "bg-green-100 text-green-700 shadow-green-100" :
                                            (selectedAiReasoning.ai_score || 0) >= 50 ? "bg-yellow-100 text-yellow-700 shadow-yellow-100" :
                                                "bg-red-100 text-red-700 shadow-red-100"
                                    )}>
                                        {selectedAiReasoning.ai_score}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-gray-900 tracking-tight">{selectedAiReasoning.name}</h3>
                                        <p className="text-gray-500 font-medium text-sm mt-1">{selectedAiReasoning.position || 'Software Engineer'}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-primary/5">
                                                <Sparkles className="w-3 h-3" />
                                                AI Assessment: {selectedAiReasoning.ai_analysis_json?.verdict || 'Processed'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAiReasoning(null)} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-400 transition-all hover:rotate-90">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/50 backdrop-blur-sm">
                                <div className="space-y-8">
                                    {/* Criteria Used */}
                                    <div className="p-6 rounded-3xl bg-surface-alt border border-border relative overflow-hidden shadow-inner">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <Search className="w-16 h-16 text-primary" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Target Criteria Alignment</h4>
                                        <p className="text-sm text-heading leading-relaxed font-semibold italic">
                                            "{selectedAiReasoning.analysis_criteria || "Standard Technical Evaluation."}"
                                        </p>
                                    </div>

                                    {/* Skills Grid */}
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 mb-4 block">Core Expertise Extracted</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {selectedAiReasoning.ai_analysis_json?.extracted_skills && selectedAiReasoning.ai_analysis_json.extracted_skills.length > 0 ? (
                                                selectedAiReasoning.ai_analysis_json.extracted_skills.map((skill, i) => (
                                                    <span key={i} className="px-4 py-2 bg-white border border-border rounded-2xl text-[11px] font-bold text-heading shadow-sm hover:border-primary/40 hover:scale-105 transition-all cursor-default">
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="w-full text-center py-6 bg-surface-alt rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-2">
                                                    <span className="text-[11px] font-bold text-muted uppercase tracking-widest italic opacity-60">Insight Pending — Could not extract structured skills</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Profile Analysis Section */}
                                    <div className="p-8 rounded-[2rem] bg-heading text-white shadow-premium relative overflow-hidden">
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                                        <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-6 relative z-10">Candidate Blueprint (AI Summary)</h4>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6 relative z-10">
                                            {selectedAiReasoning.ai_analysis_json?.extracted_info && Object.entries(selectedAiReasoning.ai_analysis_json.extracted_info).map(([k, v]: [string, any]) => (
                                                <div key={k} className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">{k.replace(/_/g, " ")}</span>
                                                    <span className="text-xs font-black text-white truncate hover:overflow-visible transition-all" title={v || 'N/A'}>{v || 'N/A'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Experience Narratives */}
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1 mb-4 block">Professional Narrative</label>
                                        <div className="bg-primary-light p-6 rounded-[1.5rem] border border-primary/20 shadow-sm">
                                            <p className="text-sm text-heading leading-relaxed font-semibold">
                                                {selectedAiReasoning.ai_analysis_json?.experience_summary || "Candidate experience overview is being processed."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Matching Intelligence */}
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Compliance Check Intelligence</label>
                                            {selectedAiReasoning.ai_analysis_json?.hard_filter_failed && (
                                                <div className="px-3 py-1 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-500/20">
                                                    Critical Failure: {selectedAiReasoning.ai_analysis_json.hard_filter_failed}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedAiReasoning.ai_analysis_json?.matching_analysis && typeof selectedAiReasoning.ai_analysis_json.matching_analysis === 'object' ? (
                                                Object.entries(selectedAiReasoning.ai_analysis_json.matching_analysis).map(([key, val]: [string, any]) => (
                                                    <div key={key} className="bg-white p-5 rounded-3xl border border-border shadow-soft hover:shadow-hover hover:border-primary/20 transition-all duration-300 group">
                                                        <div className="flex justify-between items-start mb-3 gap-3">
                                                            <span className="text-[10px] font-black text-muted uppercase tracking-tight group-hover:text-primary transition-colors">
                                                                {key.replace(/_/g, " ")}
                                                            </span>
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm",
                                                                ["PASS", "STRONG", "HIGH"].includes(String(val.status).toUpperCase()) ? "bg-green-500 text-white" :
                                                                    ["FAIL", "WEAK", "NONE"].includes(String(val.status).toUpperCase()) ? "bg-red-500 text-white" :
                                                                        "bg-amber-500 text-white"
                                                            )}>
                                                                {val.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-body leading-relaxed font-bold">{val.detail}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-2 bg-surface-alt p-6 rounded-3xl border border-border border-dashed italic text-xs text-muted text-center font-black uppercase tracking-widest py-10 opacity-50">
                                                    Detailed matching analysis not generated for this profile
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Observation Flags */}
                                    {selectedAiReasoning.ai_analysis_json?.flags && selectedAiReasoning.ai_analysis_json.flags.length > 0 && (
                                        <div className="p-6 rounded-[1.5rem] bg-amber-50 border-2 border-amber-100 shadow-sm">
                                            <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] mb-4">Observation Flags & Inferences</h4>
                                            <ul className="space-y-3">
                                                {selectedAiReasoning.ai_analysis_json.flags.map((flag, idx) => (
                                                    <li key={idx} className="text-xs leading-relaxed font-bold text-amber-800 flex gap-3">
                                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                                                        {flag}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-8 bg-gray-50 border-t border-border flex gap-4">
                                <button
                                    onClick={() => setSelectedAiReasoning(null)}
                                    className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-700 text-sm font-black rounded-2xl hover:bg-gray-100 transition-all shadow-sm"
                                >
                                    Close Report
                                </button>
                                <button
                                    onClick={() => {
                                        handleAiAnalysis(selectedAiReasoning.id);
                                        setSelectedAiReasoning(null);
                                    }}
                                    className="flex-[2] btn-primary py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Re-Analyze with Current Criteria
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Interview Scores Modal */}
            {selectedInterviewScores && (
                <InterviewFeedbackModal
                    candidate={selectedInterviewScores}
                    onClose={() => setSelectedInterviewScores(null)}
                />
            )}
        </div >
    );
}
