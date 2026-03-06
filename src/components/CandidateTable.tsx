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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-start shrink-0">
                    <div>
                        <h3 className="font-black text-gray-900 text-lg">Interview Scorecard</h3>
                        <p className="text-sm text-gray-500">{candidate.name}</p>
                        {s.decision && (
                            <span className={cn(
                                "mt-2 inline-block text-xs font-black px-2.5 py-1 rounded-full",
                                s.decision === 'Recommended' ? "bg-green-100 text-green-700" :
                                    s.decision === 'Not Recommended' ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                            )}>
                                {s.decision}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-5 space-y-4 flex-1">
                    {/* Summary row */}
                    {(l1Avg !== null || l2Avg !== null) && (
                        <div className="flex gap-3 flex-wrap">
                            {l1Avg !== null && (
                                <div className="flex-1 min-w-[120px] bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">L1 Average</p>
                                    <p className="text-2xl font-black text-blue-700">{l1Avg.toFixed(1)}<span className="text-sm text-blue-400">/5</span></p>
                                </div>
                            )}
                            {l2Avg !== null && (
                                <div className="flex-1 min-w-[120px] bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">L2 Average</p>
                                    <p className="text-2xl font-black text-purple-700">{l2Avg.toFixed(1)}<span className="text-sm text-purple-400">/5</span></p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Per-category breakdown */}
                    {[{ label: 'L1 Feedback', fb: l1, color: 'blue' }, { label: 'L2 Feedback', fb: l2, color: 'purple' }].map(({ label, fb, color }) => {
                        if (!fb) return null;
                        const palette = color === 'blue'
                            ? { header: 'bg-blue-50 border-blue-100 text-blue-700', sub: 'text-blue-600', bar: 'border-blue-200' }
                            : { header: 'bg-purple-50 border-purple-100 text-purple-700', sub: 'text-purple-600', bar: 'border-purple-200' };
                        return (
                            <div key={label} className={cn("rounded-xl border p-4 space-y-3", palette.header)}>
                                <p className={cn("text-[11px] font-black uppercase tracking-widest", palette.sub)}>{label}</p>
                                {SCORE_CATS.map(cat => {
                                    const d = fb[cat.key];
                                    if (!d || d.score === 0) return null;
                                    return (
                                        <div key={cat.key} className="space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black text-gray-700">{cat.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <ScoreBar score={d.score} />
                                                    <span className="text-[10px] font-bold text-gray-500 w-6 text-right">{d.score}/5</span>
                                                </div>
                                            </div>
                                            {d.notes && (
                                                <p className={cn("text-xs text-gray-500 leading-relaxed pl-2 border-l-2", palette.bar)}>{d.notes}</p>
                                            )}
                                        </div>
                                    );
                                })}
                                {fb.overall_notes && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Overall Notes</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{fb.overall_notes}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
    Applied: "bg-gray-100 text-gray-800",
    Rejected: "bg-red-100 text-red-800",
    Approved: "bg-green-100 text-green-800 border border-green-200",
    "Assessment Scheduled": "bg-blue-100 text-blue-800 border border-blue-200",
    Confirmed: "bg-emerald-100 text-emerald-800",
    Rescheduled: "bg-yellow-100 text-yellow-800",
    "Not Coming": "bg-orange-100 text-orange-800",
    "Assessment Completed": "bg-teal-100 text-teal-800",
    "To Be Interviewed": "bg-indigo-100 text-indigo-800",
    "Interview Scheduled": "bg-purple-100 text-purple-800",
    Recommended: "bg-green-600 text-white shadow-sm",
    "Not Recommended": "bg-red-600 text-white shadow-sm",
    "L2 Interview Required": "bg-blue-600 text-white shadow-sm",
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
    const [selectedAiReasoning, setSelectedAiReasoning] = useState<Candidate | null>(null);
    const [selectedInterviewScores, setSelectedInterviewScores] = useState<Candidate | null>(null);

    const isMaster = userRoles.includes('Master');
    const isApprover = userRoles.includes('Approver');
    const isHR = userRoles.includes('HR');
    const isInterviewer = userRoles.includes('Interviewer');

    const canApprove = isMaster || isApprover;
    const canDelete = isMaster;
    const canViewOnly = isHR || isInterviewer;

    const handleAiAnalysis = async (candidateId: string) => {
        setAnalyzingId(candidateId);
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
            } else {
                alert("AI Analysis failed: " + result.error);
            }
        } catch (err: any) {
            alert("AI Analysis error: " + err.message);
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
                prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
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
                    c.id === candidateId ? { ...c, assessment_score_url: result.publicUrl } : c
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
                c.id === editingCandidate.id ? { ...c, ...updates } : c
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
            <div className="p-4 bg-gray-50 border-b border-border flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        className="input-field pl-10 h-10 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] uppercase font-bold text-gray-400">Status</span>
                        <select
                            className="input-field h-9 text-xs min-w-[120px] py-1"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Batch</span>
                        <select
                            className="input-field h-9 text-xs min-w-[100px] py-1"
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
                                        <div className="flex flex-col gap-2 items-start">
                                            <button
                                                onClick={() => handleAiAnalysis(candidate.id)}
                                                disabled={analyzingId === candidate.id}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-bold rounded-lg border border-primary/10 hover:bg-primary/10 transition-all disabled:opacity-50"
                                            >
                                                {analyzingId === candidate.id ? (
                                                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                ) : <Sparkles className="w-3 h-3" />}
                                                AI Analysis
                                            </button>
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
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-black text-blue-500 uppercase">L1</span>
                                                    <ScoreBar score={Math.round(calcAvg(candidate.interview_scores.l1_feedback_json))} />
                                                    <span className="text-[10px] font-black text-blue-700">{calcAvg(candidate.interview_scores.l1_feedback_json).toFixed(1)}</span>
                                                </div>
                                            )}
                                            {candidate.interview_scores.l2_feedback_json && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-black text-purple-500 uppercase">L2</span>
                                                    <ScoreBar score={Math.round(calcAvg(candidate.interview_scores.l2_feedback_json))} />
                                                    <span className="text-[10px] font-black text-purple-700">{calcAvg(candidate.interview_scores.l2_feedback_json).toFixed(1)}</span>
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
                                    <span className={cn("status-badge whitespace-nowrap", statusColors[candidate.status])}>
                                        {candidate.status}
                                    </span>
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
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-8">
                                    {/* Criteria Used */}
                                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3 opacity-5">
                                            <Search className="w-12 h-12 text-primary" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Analysis Criteria Used</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                            {selectedAiReasoning.analysis_criteria || "Software Engineer with technical excellence."}
                                        </p>
                                    </div>

                                    {/* Skills Grid */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Extracted Key Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAiReasoning.ai_analysis_json?.extracted_skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 shadow-sm hover:border-primary/30 transition-colors">
                                                    {skill}
                                                </span>
                                            )) || <span className="text-xs italic text-gray-400">None extracted</span>}
                                        </div>
                                    </div>

                                    {/* Detailed Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Experience Summary</h4>
                                            <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {selectedAiReasoning.ai_analysis_json?.experience_summary || "No manual extraction available."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 text-primary">Matching Analysis</h4>
                                            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                                                <p className="text-sm text-gray-800 leading-relaxed italic">
                                                    "{selectedAiReasoning.ai_analysis_json?.matching_analysis || "No specific match details."}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reasoning Footer */}
                                    <div className="p-5 rounded-2xl bg-gray-900 text-white shadow-xl shadow-gray-200">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Final Reasoning</h4>
                                        <p className="text-sm leading-relaxed text-gray-200">
                                            {selectedAiReasoning.ai_reasoning}
                                        </p>
                                    </div>
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
