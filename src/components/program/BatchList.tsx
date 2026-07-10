"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Batch, BatchStatus } from "@/types/academy";

const STATUS_COLORS: Record<BatchStatus, string> = {
    "Pending Orientation": "bg-amber-50 text-amber-700 border-amber-200",
    Active: "bg-primary text-white border-primary",
    Completed: "bg-emerald-700 text-white border-emerald-800",
    Paused: "bg-surface text-muted border-border",
};

interface BatchListProps {
    initialBatches: Batch[];
}

export default function BatchList({ initialBatches }: BatchListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | BatchStatus>("All");

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return initialBatches.filter(b => {
            const matchesSearch = !q ||
                b.batch_number.toLowerCase().includes(q) ||
                (b.mentor_name ?? "").toLowerCase().includes(q);
            const matchesStatus = statusFilter === "All" || b.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [initialBatches, searchQuery, statusFilter]);

    return (
        <div className="space-y-3">
            <div className="bg-white border border-border rounded-sm px-4 py-2 flex flex-col sm:flex-row gap-2.5 items-center shadow-soft">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input
                        type="text"
                        placeholder="Filter by batch number or mentor..."
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
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        >
                            {(["All", "Pending Orientation", "Active", "Completed", "Paused"] as const).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <Link
                        href="/program/batches/new"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-3 h-3" strokeWidth={2} />
                        <span>New Batch</span>
                    </Link>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white border border-border rounded-sm p-10 text-center text-[12px] text-muted shadow-soft">
                    {initialBatches.length === 0
                        ? "No batches yet — create your first one to get started."
                        : "No batches match the current filters."}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map(batch => (
                        <Link
                            key={batch.id}
                            href={`/program/batches/${batch.id}`}
                            className="bg-white border border-border rounded-[12px] shadow-soft hover:shadow-premium hover:border-primary/40 transition-all p-4 flex flex-col gap-2.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold text-heading">Batch #{batch.batch_number}</span>
                                <span className={cn("text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border", STATUS_COLORS[batch.status])}>
                                    {batch.status}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted">
                                {batch.mentor_name ? `Mentor: ${batch.mentor_name}` : "No mentor assigned yet"} · {batch.fellow_count ?? 0} fellow{batch.fellow_count === 1 ? "" : "s"}
                            </p>
                            <p className="text-[10.5px] text-muted">
                                Orientation: {new Date(batch.orientation_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
