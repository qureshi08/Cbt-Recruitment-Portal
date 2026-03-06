"use client";

import { useState } from "react";
import { updateAiCriteria } from "@/app/actions";
import { Sparkles, Save } from "lucide-react";

export default function AiCriteriaManager({ initialCriteria }: { initialCriteria: string }) {
    const [criteria, setCriteria] = useState(initialCriteria);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateAiCriteria(criteria);
            if (result.success) {
                alert("AI Analysis Criteria updated successfully!");
            } else {
                alert("Failed to update criteria: " + result.error);
            }
        } catch (error: any) {
            alert("Error saving criteria: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card space-y-4">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">AI Analysis Criteria</h3>
                    <p className="text-xs text-gray-500">Gemini will use this subjective criteria to score and reason about candidates across the portal.</p>
                </div>
            </div>

            <textarea
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] shadow-inner"
                placeholder="Describe what you are looking for (e.g. 'Senior React dev with at least 5 years exp, MUST have cloud exposure...')"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
            />

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading || criteria === initialCriteria}
                    className="btn-primary flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Criteria"}
                </button>
            </div>
        </div>
    );
}
