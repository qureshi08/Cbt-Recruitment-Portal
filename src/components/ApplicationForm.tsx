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
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-heading tracking-tight mb-3">
                    Application Received.
                </h2>
                <p className="text-body text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                    The board will review your credentials. Expect communication within 48 hours.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary !px-8 mx-auto"
                >
                    Apply for another role
                </button>
            </div>
        );
    }

    const Label = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
        <label className="flex items-center gap-2 mb-2 text-[10px] font-bold text-muted uppercase tracking-widest cursor-pointer leading-none">
            {Icon && <Icon className="w-3 h-3 text-primary/60" />}
            {children}
        </label>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <Label icon={User}>Full Name</Label>
                    <input type="text" name="name" required className="input-field" placeholder="Abdullah Qureshi" />
                </div>
                <div className="space-y-1">
                    <Label icon={Mail}>Email Address</Label>
                    <input type="email" name="email" required className="input-field" placeholder="name@email.com" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <Label icon={Smartphone}>Mobile</Label>
                    <input type="tel" name="phone" required className="input-field" placeholder="+92 XXX XXXXXXX" onChange={handlePhoneChange} />
                </div>
                <div className="space-y-1">
                    <Label icon={MapPin}>City</Label>
                    <input type="text" name="location" required className="input-field" placeholder="Islamabad" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-border">
                <div className="space-y-1">
                    <Label icon={CreditCard}>CNIC</Label>
                    <input type="text" name="cnic" required className="input-field" placeholder="XXXXX-XXXXXXX-X" onChange={handleCnicChange} maxLength={15} />
                </div>
                <div className="space-y-1">
                    <Label icon={GraduationCap}>Institution</Label>
                    <input type="text" name="university" required className="input-field" placeholder="e.g. NUST" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                    <Label>Major</Label>
                    <input type="text" name="degree_field" required className="input-field" placeholder="Computer Science" />
                </div>
                <div className="space-y-1">
                    <Label>Graduation Year</Label>
                    <input type="text" name="graduation_year" required className="input-field" placeholder="2024" pattern="^20[0-9]{2}$" maxLength={4} />
                </div>
            </div>

            <div className="space-y-1">
                <Label>Education Status</Label>
                <div className="relative">
                    <select name="education_status" required className="input-field appearance-none pr-10 cursor-pointer">
                        <option value="">Select phase</option>
                        <option value="Graduated">Graduated / Alumni</option>
                        <option value="Currently Enrolled">In-Progress / Student</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted w-3.5 h-3.5" />
                </div>
            </div>

            <div className="space-y-1 pt-4">
                <Label icon={Upload}>Resume / CV (PDF)</Label>
                <div className={cn(
                    "relative border border-dashed rounded-sm p-8 text-center transition-all duration-300 bg-surface/50",
                    fileName ? "border-primary bg-primary-light" : "border-border hover:border-primary/40"
                )}>
                    <input type="file" name="resume" required className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <div className="flex flex-col items-center gap-2">
                        {fileName ? (
                            <>
                                <FileCheck className="w-8 h-8 text-primary animate-in zoom-in" />
                                <p className="text-xs font-bold text-heading">{fileName}</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-muted/50" />
                                <p className="text-xs font-bold text-heading">Click to upload</p>
                                <p className="text-[9px] text-muted font-bold uppercase tracking-widest">PDF • MAX 5MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input type="hidden" name="position" value="CGAPCandidate" />

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-sm text-[11px] font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-12 !text-[12px] !tracking-[0.2em] shadow-premium disabled:opacity-50"
            >
                {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <span>Submit Application →</span>
                )}
            </button>
        </form>
    );
}
