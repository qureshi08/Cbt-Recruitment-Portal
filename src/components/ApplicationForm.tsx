"use client";

import { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, FileCheck, Loader2, GraduationCap, ChevronDown, User, Mail, Smartphone, MapPin, CreditCard } from "lucide-react";
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
            else setError(result.error || "Submission error. Check your data.");
        } catch (error: any) {
            setError(error.message || "A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-primary-muted rounded-[10px] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h2
                    className="font-bold text-heading mb-2"
                    style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", letterSpacing: "-0.02em" }}
                >
                    Application received.
                </h2>
                <p className="text-body text-[13px] max-w-sm mx-auto mb-6 leading-relaxed">
                    The board will review your credentials. Expect communication within 48 hours.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary mx-auto"
                >
                    Apply for another role
                </button>
            </div>
        );
    }

    const Label = ({ children }: { children: React.ReactNode }) => (
        <label className="block mb-1 text-[10px] font-semibold text-muted uppercase tracking-[0.1em] cursor-pointer leading-none">
            {children}
        </label>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                    <Label>Full Name</Label>
                    <input type="text" name="name" required className="input-field !py-2" placeholder="Full Name" />
                </div>
                <div>
                    <Label>Email Address</Label>
                    <input type="email" name="email" required className="input-field !py-2" placeholder="name@email.com" />
                </div>
                <div>
                    <Label>Mobile</Label>
                    <input type="tel" name="phone" required className="input-field !py-2" placeholder="+92 XXX XXXXXXX" onChange={handlePhoneChange} />
                </div>
                <div>
                    <Label>City</Label>
                    <input type="text" name="location" required className="input-field !py-2" placeholder="Islamabad" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-border">
                <div>
                    <Label>CNIC</Label>
                    <input type="text" name="cnic" required className="input-field !py-2" placeholder="XXXXX-XXXXXXX-X" onChange={handleCnicChange} maxLength={15} />
                </div>
                <div>
                    <Label>Institution</Label>
                    <input type="text" name="university" required className="input-field !py-2" placeholder="e.g. NUST" />
                </div>
                <div>
                    <Label>Major</Label>
                    <input type="text" name="degree_field" required className="input-field !py-2" placeholder="Computer Science" />
                </div>
                <div>
                    <Label>Graduation Year</Label>
                    <input type="text" name="graduation_year" required className="input-field !py-2" placeholder="2024" pattern="^20[0-9]{2}$" maxLength={4} />
                </div>
                <div className="md:col-span-2">
                    <Label>Education Status</Label>
                    <div className="relative">
                        <select name="education_status" required className="input-field appearance-none pr-9 cursor-pointer !py-2">
                            <option value="">Select phase</option>
                            <option value="Graduated">Graduated / Alumni</option>
                            <option value="Currently Enrolled">In-Progress / Student</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            <div className="pt-1">
                <Label>Resume / CV (PDF)</Label>
                <div className={cn(
                    "relative border border-dashed rounded-md p-3 text-center transition-all duration-300",
                    fileName ? "border-primary bg-primary-muted" : "border-border hover:border-primary/50 bg-surface/50"
                )}>
                    <input type="file" name="resume" required className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <div className="flex flex-col items-center gap-1">
                        {fileName ? (
                            <>
                                <FileCheck className="w-5 h-5 text-primary animate-in zoom-in" strokeWidth={1.5} />
                                <p className="text-[11px] font-semibold text-heading truncate max-w-xs">{fileName}</p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-muted" strokeWidth={1.5} />
                                    <p className="text-[11px] font-semibold text-heading">Click to upload</p>
                                </div>
                                <p className="text-[9px] text-muted font-semibold uppercase tracking-[0.12em]">PDF · MAX 5MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input type="hidden" name="position" value="CGAP Candidate" />

            {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-md text-[12px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span>{error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full !py-2.5 !text-[12.5px] disabled:opacity-50 mt-1"
                style={{ boxShadow: "var(--shadow-premium)" }}
            >
                {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                ) : (
                    <span>Submit Application →</span>
                )}
            </button>
        </form>
    );
}
