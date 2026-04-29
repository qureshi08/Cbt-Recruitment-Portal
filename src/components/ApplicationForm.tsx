"use client";

import { useState } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, FileCheck, Loader2 } from "lucide-react";
import { submitApplication } from "@/app/actions";
import { cn } from "@/lib/utils";

export default function ApplicationForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileName(file ? file.name : null);
    };

    const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5);
        if (value.length > 13) value = value.substring(0, 13) + '-' + value.substring(13, 14);
        e.target.value = value;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const hasPlus = value.startsWith('+');
        value = value.replace(/\D/g, '');
        if (hasPlus) value = '+' + value;
        e.target.value = value;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await submitApplication(formData);
            if (result.success) setIsSubmitted(true);
            else setError(result.error || "An error occurred");
        } catch (error: any) {
            setError(error.message || "A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-heading mb-3 italic">Application Received</h2>
                <p className="text-muted text-sm max-w-xs mx-auto mb-10 leading-relaxed font-medium">
                    Thank you for applying to the CGAP Academy. Our recruitment team will review your profile and contact you soon.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary h-14 w-full max-w-[240px] mx-auto rounded-2xl"
                >
                    Submit Another
                </button>
            </div>
        );
    }

    const Label = ({ children }: { children: React.ReactNode }) => (
        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1 mb-2 block">
            {children}
        </label>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <Label>Full Name</Label>
                    <input type="text" name="name" required className="input-field h-14" placeholder="e.g. Muhammad Anas" />
                </div>
                <div className="space-y-1">
                    <Label>Email Address</Label>
                    <input type="email" name="email" required className="input-field h-14" placeholder="name@company.com" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <Label>Phone Number</Label>
                    <input type="tel" name="phone" required className="input-field h-14" placeholder="+92 XXX XXXXXXX" onChange={handlePhoneChange} />
                </div>
                <div className="space-y-1">
                    <Label>City / Area</Label>
                    <input type="text" name="location" required className="input-field h-14" placeholder="e.g. Islamabad" />
                </div>
            </div>

            <div className="space-y-1">
                <Label>CNIC Number</Label>
                <input type="text" name="cnic" required className="input-field h-14" placeholder="XXXXX-XXXXXXX-X" onChange={handleCnicChange} maxLength={15} />
            </div>

            <div className="pt-4 border-t border-border/60">
                <h3 className="text-lg font-bold font-heading italic text-heading mb-6">Education Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label>Education Status</Label>
                        <select name="education_status" required className="input-field h-14 appearance-none hover:border-primary cursor-pointer">
                            <option value="">Select Status</option>
                            <option value="Graduated">Graduated</option>
                            <option value="Currently Enrolled">Currently Enrolled</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label>Graduation Year</Label>
                        <input type="text" name="graduation_year" required className="input-field h-14" placeholder="2024" pattern="^20[0-9]{2}$" maxLength={4} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <Label>Degree Field</Label>
                    <input type="text" name="degree_field" required className="input-field h-14" placeholder="e.g. Software Engineering" />
                </div>
                <div className="space-y-1">
                    <Label>University</Label>
                    <input type="text" name="university" required className="input-field h-14" placeholder="e.g. NUST" />
                </div>
            </div>

            <div className="space-y-1">
                <Label>Resume Attachment</Label>
                <div className={cn(
                    "relative border-2 border-dashed rounded-[1.5rem] p-8 text-center transition-all duration-300 group overflow-hidden",
                    fileName ? "border-primary bg-primary-light" : "border-border hover:border-primary hover:bg-white"
                )}>
                    <input type="file" name="resume" required className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <div className="flex flex-col items-center gap-2">
                        {fileName ? (
                            <>
                                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
                                    <FileCheck className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-sm font-bold text-heading truncate max-w-[200px]">{fileName}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Ready to upload</p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-surface-alt rounded-2xl flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                                    <Upload className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-sm font-bold text-heading">Click to upload your resume</p>
                                <p className="text-xs text-muted">Supports PDF or DOC up to 5MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input type="hidden" name="position" value="CGAP" />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-16 w-full text-lg shadow-elevated"
            >
                {isSubmitting ? (
                    <span className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Application...
                    </span>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Submit Application
                    </>
                )}
            </button>

            <p className="text-center text-[10px] text-muted font-bold tracking-[0.2em] uppercase pt-4 italic">
                Secure SSL Encrypted Application
            </p>
        </form>
    );
}
