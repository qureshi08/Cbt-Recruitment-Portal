"use client";

import { useState, useMemo } from "react";
import { Candidate, CandidateStatus } from "@/types/database";
import { updateCandidateStatus, deleteCandidate } from "@/app/actions";
import {
    MoreHorizontal,
    ExternalLink,
    CheckCircle,
    XCircle,
    Copy,
    Check,
    Search,
    Filter,
    Phone,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateTableProps {
    initialCandidates: Candidate[];
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
};

export default function CandidateTable({ initialCandidates }: CandidateTableProps) {
    const [candidates, setCandidates] = useState(initialCandidates);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;

        const result = await deleteCandidate(id);
        if (result.success) {
            setCandidates(prev => prev.filter(c => c.id !== id));
        } else {
            alert("Failed to delete application: " + result.error);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: CandidateStatus) => {
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

            return matchesSearch && matchesStatus;
        });
    }, [candidates, searchQuery, statusFilter]);

    const statuses = ["All", ...Object.keys(statusColors)];

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
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        className="input-field h-10 text-sm min-w-[150px] py-1"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-border">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate / Contact</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
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
                                <td className="px-6 py-4">
                                    <span className={cn("status-badge whitespace-nowrap", statusColors[candidate.status])}>
                                        {candidate.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(candidate.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {candidate.status === 'Approved' && (
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

                                        {candidate.status === 'Applied' && (
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

                                        <button
                                            onClick={() => handleDelete(candidate.id)}
                                            className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                                            title="Delete Application"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCandidates.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                    No candidates match your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
