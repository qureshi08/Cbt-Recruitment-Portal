"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

interface LogRow {
    id: string;
    user_name: string | null;
    action: string;
    entity_id: string;
    entity_type: string;
    details: any;
    created_at: string;
}

const EVENT_TYPES = ["All", "batch", "fellow", "mentor_assignment", "onboarding_document"] as const;

export default function ActivityLog({ initialLogs }: { initialLogs: LogRow[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<typeof EVENT_TYPES[number]>("All");

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return initialLogs.filter(log => {
            const matchesType = typeFilter === "All" || log.entity_type === typeFilter;
            const matchesSearch = !q ||
                log.action.toLowerCase().includes(q) ||
                (log.user_name ?? "").toLowerCase().includes(q) ||
                JSON.stringify(log.details ?? {}).toLowerCase().includes(q);
            return matchesType && matchesSearch;
        });
    }, [initialLogs, searchQuery, typeFilter]);

    return (
        <div className="space-y-3">
            <div className="bg-white border border-border rounded-sm px-4 py-2 flex flex-col sm:flex-row gap-2.5 items-center shadow-soft">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input
                        type="text"
                        placeholder="Search by action or actor..."
                        className="w-full bg-surface border border-border rounded-sm pl-9 pr-3 py-1.5 text-[11px] font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 placeholder:text-muted outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-black text-muted uppercase tracking-wider">Type</span>
                    <select
                        className="border border-border bg-surface rounded-sm px-2 py-1 text-[10px] font-bold cursor-pointer hover:border-primary transition-colors outline-none text-heading"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as typeof EVENT_TYPES[number])}
                    >
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-10 text-center text-[12px] text-muted">No activity yet.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {filtered.map(log => (
                            <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                                <span className="text-[10px] font-mono text-muted w-[130px] shrink-0 pt-0.5">
                                    {new Date(log.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-heading">
                                        {log.action.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-[10.5px] text-muted truncate">
                                        {log.user_name ?? "System"} · {log.entity_type}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
