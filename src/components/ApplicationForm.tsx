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
        let value = e.target.value.replace(/\D/g, ''); // Extract only numbers
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5);
        }
        if (value.length > 13) {
            value = value.substring(0, 13) + '-' + value.substring(13, 14);
        }
        e.target.value = value;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Keep '+' sign at start, extract numbers
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
            setError(error.message || "A network error occurred while uploading. The file might be corrupted or too large.");
        } finally {
            setIsSubmitting(false);
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
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto card !p-5 md:!p-6">
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
                    <input type="tel" name="phone" required className="input-field" placeholder="+923001234567 or 03001234567" pattern="^((\+92)?(0092)?(0)?)(3[0-9]{2})[0-9]{7}$" title="Enter a valid Pakistani phone number e.g. 03001234567 or +923001234567" onChange={handlePhoneChange} minLength={11} maxLength={15} />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Current Location (City/Area)</label>
                    <input type="text" name="location" required className="input-field" placeholder="e.g. Rawalpindi, Gulberg Greens" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">CNIC Number</label>
                    <input type="text" name="cnic" required className="input-field" placeholder="XXXXX-XXXXXXX-X" pattern="^\d{5}-\d{7}-\d{1}$" title="CNIC must be in the format XXXXX-XXXXXXX-X" onChange={handleCnicChange} maxLength={15} />
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-800 pb-2 border-b">Educational Background</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Education Status</label>
                    <select name="education_status" required className="input-field min-h-[42px] py-0">
                        <option value="">Select Status...</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Currently Enrolled">Currently Enrolled</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Graduation Year</label>
                    <input type="text" name="graduation_year" required className="input-field" placeholder="e.g. 2024" pattern="^20[0-9]{2}$" title="Enter a valid graduation year e.g. 2024" maxLength={4} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Degree Field</label>
                    <input type="text" name="degree_field" required className="input-field" placeholder="e.g. Computer Science" />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">University</label>
                    <input type="text" name="university" required className="input-field" placeholder="e.g. NUST, FAST" />
                </div>
            </div>



            <div className="space-y-1 font-medium text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 flex items-center gap-2 mt-4">
                <span className="text-sm">Applying For:</span>
                <span className="text-primary font-bold">Convergent Graduate Academy Program (CGAP)</span>
                <input type="hidden" name="position" value="CGAP" />
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
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer group relative ${fileName ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}>
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
                                <FileCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                                <p className="text-sm font-bold text-primary">{fileName}</p>
                                <p className="text-xs text-primary/60 mt-1">Click to change file</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                            </>
                        )}
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
