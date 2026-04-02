"use client";

import { useState } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, FileCheck } from "lucide-react";
import { submitApplication } from "@/app/actions";

export default function ApplicationForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
        } else {
            setFileName(null);
        }
    };

    const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5);
        }
        if (value.length > 13) {
            value = value.substring(0, 13) + '-' + value.substring(13, 14);
        }
        e.target.value = value;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const hasPlus = value.startsWith('+');
        value = value.replace(/\D/g, '');
        if (hasPlus) {
            value = '+' + value;
        }
        e.target.value = value;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await submitApplication(formData);

            if (result.success) {
                setIsSubmitted(true);
            } else {
                setError(result.error || "An error occurred");
            }
        } catch (error: any) {
            setError(error.message || "A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-2">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-heading mb-1">Success!</h2>
                <p className="text-text-muted text-[13px] px-6">
                    Application submitted. We'll be in touch soon.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-4 text-primary hover:underline text-xs font-semibold"
                >
                    Submit another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3.5 max-w-2xl mx-auto card !p-5 md:!p-6 border border-border shadow-lg shadow-primary/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Full Name</label>
                    <input type="text" name="name" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        required
                        className="input-field !py-2 !px-3 !text-[13px]"
                        placeholder="john@example.com"
                        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Please enter a valid email address')}
                        onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Phone Number</label>
                    <input type="tel" name="phone" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="+923001234567" pattern="^((\+92)?(0092)?(0)?)(3[0-9]{2})[0-9]{7}$" onChange={handlePhoneChange} minLength={11} maxLength={15} />
                </div>
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">City/Area</label>
                    <input type="text" name="location" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="e.g. Rawalpindi" />
                </div>
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">CNIC Number</label>
                    <input type="text" name="cnic" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="XXXXX-XXXXXXX-X" pattern="^\d{5}-\d{7}-\d{1}$" onChange={handleCnicChange} maxLength={15} />
                </div>
            </div>

            <div className="space-y-2 pt-1">
                <h3 className="text-base font-bold font-heading text-heading pb-1 border-b border-border/40">Educational Background</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Education Status</label>
                    <select name="education_status" required className="input-field !py-2 !px-3 !text-[13px] min-h-[38px]">
                        <option value="">Select Status...</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Currently Enrolled">Currently Enrolled</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Graduation Year</label>
                    <input type="text" name="graduation_year" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="e.g. 2024" pattern="^20[0-9]{2}$" maxLength={4} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Degree Field</label>
                    <input type="text" name="degree_field" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="Computer Science" />
                </div>
                <div className="space-y-1">
                    <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">University</label>
                    <input type="text" name="university" required className="input-field !py-2 !px-3 !text-[13px]" placeholder="e.g. NUST" />
                </div>
            </div>

            <div className="space-y-1 font-medium text-text-muted bg-surface p-2.5 rounded-md border border-border flex items-center gap-2.5 mt-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted/50">Post:</span>
                <span className="text-primary font-bold text-[13px]">CGAP Graduate Academy</span>
                <input type="hidden" name="position" value="CGAP" />
            </div>

            <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Cover Letter</label>
                <textarea
                    name="coverLetter"
                    required
                    className="input-field !py-2 !px-3 !text-[13px] min-h-[80px] resize-none"
                    placeholder="Why us? (Briefly)"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[11.5px] font-bold text-heading uppercase tracking-wide opacity-80">Resume</label>
                <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer group relative ${fileName ? 'border-primary bg-primary/5' : 'border-border hover:border-primary bg-surface/50 hover:bg-white'}`}>
                    <input
                        type="file"
                        name="resume"
                        required
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                    />
                    <div className="pointer-events-none">
                        {fileName ? (
                            <>
                                <FileCheck className="w-6 h-6 text-primary mx-auto mb-1" />
                                <p className="text-[12px] font-bold text-heading truncate px-3">{fileName}</p>
                            </>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Upload className="w-5 h-5 text-text-muted/40 group-hover:text-primary transition-colors" />
                                <p className="text-[13px] text-text-muted">Upload Resume (PDF/DOC)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-md text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 shadow-md shadow-primary/5 hover:shadow-primary/10 mt-1"
            >
                {isSubmitting ? (
                    <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                    </span>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        <span className="text-[14px]">Submit Application</span>
                    </>
                )}
            </button>
        </form>
    );
}
