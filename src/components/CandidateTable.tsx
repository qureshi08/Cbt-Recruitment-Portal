"use client";

import { useState, useMemo } from "react";
import { Candidate, CandidateStatus } from "@/types/database";
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
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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

export default function CandidateTable({ initialCandidates, userRoles }: CandidateTableProps) {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [batchFilter, setBatchFilter] = useState<string>("All");
    const [uploadingScore, setUploadingScore] = useState<string | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [selectedAiReasoning, setSelectedAiReasoning] = useState<{ name: string, reasoning: string, score: number } | null>(null);

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
            if (result.success) {
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? { ...c, ai_score: result.score, ai_reasoning: result.reasoning } : c
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
                        <tr className="bg-white border-b border-border">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate / Contact</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Batch</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Analysis</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Score</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                        {filteredCandidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-gray-900">{candidate.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">{candidate.email}</span>
                                            {candidate.phone && (
                                                <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {candidate.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                        #{candidate.batch_number || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {candidate.ai_score !== undefined ? (
                                        <div
                                            className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedAiReasoning({
                                                name: candidate.name,
                                                reasoning: candidate.ai_reasoning || "No reasoning provided.",
                                                score: candidate.ai_score!
                                            })}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black",
                                                    candidate.ai_score >= 80 ? "bg-green-100 text-green-700" :
                                                        candidate.ai_score >= 50 ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-red-100 text-red-700"
                                                )}>
                                                    {candidate.ai_score}
                                                </div>
                                                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                            </div>
                                            <p className="text-[9px] text-gray-400 truncate max-w-[100px]">
                                                {candidate.ai_reasoning}
                                            </p>
                                        </div>
                                    ) : (canApprove && candidate.resume_url) ? (
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
                                    ) : (
                                        <span className="text-[10px] text-gray-400 italic">
                                            {!candidate.resume_url ? 'No resume' : 'No analysis'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn("status-badge whitespace-nowrap", statusColors[candidate.status])}>
                                        {candidate.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
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
                                <td className="px-6 py-4 text-right">
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

                                        <a
                                            href={candidate.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary transition-colors"
                                            title="View Resume"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>

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

                                        {isMaster && (
                                            <button
                                                onClick={() => setEditingCandidate(candidate)}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary transition-colors"
                                                title="Edit Application"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(candidate.id)}
                                                className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                                                title="Delete Application"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedAiReasoning(null)} />
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-start bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner",
                                    selectedAiReasoning.score >= 80 ? "bg-green-100 text-green-700" :
                                        selectedAiReasoning.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                                            "bg-red-100 text-red-700"
                                )}>
                                    {selectedAiReasoning.score}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-xl text-gray-900 tracking-tight">{selectedAiReasoning.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            AI Assessment
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAiReasoning(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">AI Reasoning</h4>
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 relative">
                                        <p className="text-gray-700 leading-relaxed italic">
                                            "{selectedAiReasoning.reasoning}"
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-border bg-gray-50/50">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Fit Level</p>
                                        <p className="font-bold text-gray-900">
                                            {selectedAiReasoning.score >= 80 ? "Excellent" :
                                                selectedAiReasoning.score >= 50 ? "Moderate" : "Low"}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-gray-50/50">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status</p>
                                        <p className="font-bold text-primary flex items-center gap-1.5">
                                            Ready for Review
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button
                                    onClick={() => setSelectedAiReasoning(null)}
                                    className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-primary/20"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
