"use client";

import { useState } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, FileCheck, Loader2, GraduationCap, ChevronDown, Monitor, User, Mail, Smartphone, MapPin, CreditCard } from "lucide-react";
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
            else setError(result.error || "Submission failed. Please check your data.");
        } catch (error: any) {
            setError(error.message || "A network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center py-16 animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl font-bold text-heading tracking-tight mb-4 italic">
                    Great choice.<br />Application received.
                </h2>
                <p className="text-body text-base max-w-sm mx-auto mb-10 leading-relaxed">
                    Our team will review your profile. Expect to hear from us within 48 hours via the email provided.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="btn-secondary !px-10 mx-auto"
                >
                    Apply for another role
                </button>
            </div>
        );
    }

    const Label = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
        <label className="flex items-center gap-2 mb-2 ml-0.5 text-[11px] font-bold text-muted uppercase tracking-widest cursor-pointer leading-none">
            {Icon && <Icon className="w-3.5 h-3.5 stroke-[2.5]" />}
            {children}
        </label>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-12">

            {/* Identity Group */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label icon={User}>Full Name</Label>
                        <input type="text" name="name" required className="input-field h-12" placeholder="Abdullah Qureshi" />
                    </div>
                    <div className="space-y-1">
                        <Label icon={Mail}>Email Address</Label>
                        <input type="email" name="email" required className="input-field h-12" placeholder="name@email.com" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label icon={Smartphone}>Mobile Number</Label>
                        <input type="tel" name="phone" required className="input-field h-12" placeholder="+92 XXX XXXXXXX" onChange={handlePhoneChange} />
                    </div>
                    <div className="space-y-1">
                        <Label icon={MapPin}>Current City</Label>
                        <input type="text" name="location" required className="input-field h-12" placeholder="e.g. Islamabad" />
                    </div>
                </div>

                <div className="space-y-1 md:w-1/2">
                    <Label icon={CreditCard}>CNIC Number</Label>
                    <input type="text" name="cnic" required className="input-field h-12" placeholder="XXXXX-XXXXXXX-X" onChange={handleCnicChange} maxLength={15} />
                </div>
            </div>

            {/* Academic Pedigree Group */}
            <div className="pt-8 border-t border-border space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-4">Academic Background</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label icon={GraduationCap}>Institution</Label>
                        <input type="text" name="university" required className="input-field h-12" placeholder="e.g. NUST / FAST" />
                    </div>
                    <div className="space-y-1">
                        <Label icon={Monitor}>Degree Major</Label>
                        <input type="text" name="degree_field" required className="input-field h-12" placeholder="e.g. Computer Science" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label>Current Status</Label>
                        <div className="relative">
                            <select name="education_status" required className="input-field h-12 appearance-none pr-10 cursor-pointer">
                                <option value="">Select current phase</option>
                                <option value="Graduated">Graduated / Alumni</option>
                                <option value="Currently Enrolled">In-Progress / Student</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted w-4 h-4" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Graduation Year</Label>
                        <input type="text" name="graduation_year" required className="input-field h-12" placeholder="2024" pattern="^20[0-9]{2}$" maxLength={4} />
                    </div>
                </div>
            </div>

            {/* Asset Upload */}
            <div className="pt-8 border-t border-border">
                <Label icon={Upload}>Curriculum Vitae / Resume (PDF)</Label>
                <div className={cn(
                    "mt-2 relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300",
                    fileName ? "border-primary bg-primary-light" : "border-border hover:border-primary/50 bg-surface-alt"
                )}>
                    <input type="file" name="resume" required className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <div className="flex flex-col items-center gap-3">
                        {fileName ? (
                            <>
                                <FileCheck className="w-10 h-10 text-primary animate-in zoom-in" />
                                <p className="text-sm font-bold text-heading">{fileName}</p>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">File Attached</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-muted/60" />
                                <p className="text-sm font-bold text-heading">Click or drag to upload document</p>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Max file size: 5MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input type="hidden" name="position" value="CGAPCandidate" />

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-bold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-16 !text-lg !tracking-tight font-bold !rounded-lg disabled:opacity-50"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Sending Application...</span>
                    </>
                ) : (
                    <>
                        <span>Apply to CGAP 2026 →</span>
                    </>
                )}
            </button>

            <p className="text-center text-[10px] text-muted font-bold uppercase tracking-[0.3em]">
                Strict Data Privacy Protocol
            </p>
        </form>
    );
}
