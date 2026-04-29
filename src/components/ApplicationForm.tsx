"use client";

import { useState } from "react";
import { Upload, Send, CheckCircle2, AlertCircle, FileCheck, Loader2, Sparkles, User, Mail, Phone as PhoneIcon, MapPin, Hash, GraduationCap } from "lucide-react";
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
            <div className="text-center py-20 animate-in fade-in zoom-in duration-1000">
                <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/20">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-heading mb-4 italic uppercase tracking-tight">Application Transmitted</h2>
                <p className="text-muted text-[15px] max-w-sm mx-auto mb-12 leading-relaxed font-medium">
                    The academy board has received your credentials. Your journey through the CGAP lifecycle begins now. Expect contact within 48 hours.
                </p>
                <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="px-8 py-4 bg-heading text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all shadow-xl shadow-heading/20"
                >
                    Submit Another Profile
                </button>
            </div>
        );
    }

    const Label = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
        <div className="flex items-center gap-1.5 mb-2 ml-1">
            {Icon && <Icon className="w-3 h-3 text-muted" />}
            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                {children}
            </label>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label icon={User}>Full Identification</Label>
                        <input type="text" name="name" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="e.g. Abdullah Qureshi" />
                    </div>
                    <div className="space-y-1">
                        <Label icon={Mail}>Email Endpoint</Label>
                        <input type="email" name="email" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="name@domain.com" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label icon={PhoneIcon}>Terminal Contact</Label>
                        <input type="tel" name="phone" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="+92 XXX XXXXXXX" onChange={handlePhoneChange} />
                    </div>
                    <div className="space-y-1">
                        <Label icon={MapPin}>Geographic Origin</Label>
                        <input type="text" name="location" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="e.g. Islamabad" />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label icon={Hash}>CNIC Registry</Label>
                    <input type="text" name="cnic" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="XXXXX-XXXXXXX-X" onChange={handleCnicChange} maxLength={15} />
                </div>
            </div>

            <div className="pt-10 border-t border-gray-100 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-heading text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-8 italic">
                    <GraduationCap className="w-3 h-3" />
                    Academic Pedigree
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label>Current Status</Label>
                        <div className="relative">
                            <select name="education_status" required className="input-field h-14 appearance-none hover:border-primary cursor-pointer !rounded-2xl shadow-sm pr-10">
                                <option value="">Select Protocol</option>
                                <option value="Graduated">Graduated / Alumni</option>
                                <option value="Currently Enrolled">In-Progress / Student</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label>Graduation Epoch</Label>
                        <input type="text" name="graduation_year" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="2024" pattern="^20[0-9]{2}$" maxLength={4} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-1">
                        <Label>Major Field</Label>
                        <input type="text" name="degree_field" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="e.g. Computer Architecture" />
                    </div>
                    <div className="space-y-1">
                        <Label>Institution</Label>
                        <input type="text" name="university" required className="input-field h-14 !rounded-2xl shadow-sm" placeholder="e.g. NUST" />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <Label icon={Upload}>Curriculum Vitae (PDF/DOCX)</Label>
                <div className={cn(
                    "relative border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-500 group overflow-hidden",
                    fileName ? "border-primary bg-primary/[0.03]" : "border-border hover:border-primary hover:bg-primary/[0.02] bg-gray-50/50"
                )}>
                    <input type="file" name="resume" required className="absolute inset-0 opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <div className="flex flex-col items-center gap-3">
                        {fileName ? (
                            <>
                                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-xl shadow-primary/30 animate-in zoom-in duration-300">
                                    <FileCheck className="w-7 h-7 text-white" />
                                </div>
                                <p className="text-sm font-black text-heading truncate max-w-[250px] uppercase tracking-tight">{fileName}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 bg-white px-3 py-1 rounded-full border border-primary/20">Validation Complete</p>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-white border border-border/50 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                    <Upload className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-sm font-black text-heading uppercase tracking-tight">Synchronize Resume</p>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest leading-none mt-1">Maximum Load: 5.0 MB</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <input type="hidden" name="position" value="CGAP" />

            {error && (
                <div className="flex items-center gap-4 p-5 bg-rose-50 border-2 border-rose-100 text-rose-700 rounded-2xl text-xs font-black uppercase tracking-tight animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>SYSTEM PROTOCOL ERROR: {error}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="group relative h-20 w-full overflow-hidden rounded-[2rem] bg-heading shadow-2xl transition-all hover:bg-primary disabled:opacity-50"
            >
                <div className="relative z-10 flex items-center justify-center gap-4 text-white">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm font-black uppercase tracking-[0.3em] italic">Transmitting...</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            <span className="text-sm font-black uppercase tracking-[0.3em] italic">Initiate Application</span>
                        </>
                    )}
                </div>
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </button>

            <div className="flex flex-col items-center gap-2 pt-6">
                <p className="text-[9px] text-muted font-black tracking-[0.4em] uppercase italic">
                    End-to-End Encrypted Verification
                </p>
                <div className="w-12 h-0.5 bg-gray-100 rounded-full" />
            </div>
        </form>
    );
}
