"use client";

import { useState } from "react";
import { Upload, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitApplication } from "@/app/actions";

export default function ApplicationForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await submitApplication(formData);

        setIsSubmitting(false);
        if (result.success) {
            setIsSubmitted(true);
        } else {
            setError(result.error || "An error occurred");
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-4">
                    <CheckCircle2 className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
                <p className="text-gray-600">
                    Thank you for applying. We will review your application and get back to you soon.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-6 text-primary hover:underline"
                >
                    Submit another application
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto card">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-800">Apply for a Position</h1>
                <p className="text-sm text-gray-500">Please fill out the form below to join CBT.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="name" required className="input-field" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" name="email" required className="input-field" placeholder="john@example.com" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" name="phone" required className="input-field" placeholder="+92 3XX XXXXXXX" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Applying For</label>
                    <div className="input-field bg-gray-50 flex items-center font-medium text-gray-600">
                        Convergent Graduate Academy Program (CGAP)
                        <input type="hidden" name="position" value="CGAP" />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Cover Letter</label>
                <textarea
                    name="coverLetter"
                    required
                    className="input-field min-h-[120px] resize-none"
                    placeholder="Briefly tell us why you are a good fit..."
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Resume (PDF/DOC)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer group relative">
                    <input type="file" name="resume" required className="absolute inset-0 opacity-0 cursor-pointer" id="resume-upload" accept=".pdf,.doc,.docx" />
                    <div className="pointer-events-none">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
                {isSubmitting ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                    </span>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Apply for CGAP
                    </>
                )}
            </button>
        </form>
    );
}
