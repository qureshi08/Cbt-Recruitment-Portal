"use client";

import { useRef, useState } from "react";
import { ONBOARDING_DOC_TYPES, OnboardingDocType, OnboardingDocument } from "@/types/academy";
import { uploadOnboardingDocument } from "@/app/program/actions";
import { withLoading } from "@/lib/loading";
import { cn } from "@/lib/utils";
import { Check, Upload, RotateCcw } from "lucide-react";

interface FellowOnboardingProps {
    fellowId: string;
    initialDocuments: OnboardingDocument[];
    onboardingStatus?: string;
}

export default function FellowOnboarding({ fellowId, initialDocuments, onboardingStatus }: FellowOnboardingProps) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [uploadingType, setUploadingType] = useState<OnboardingDocType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const docFor = (type: OnboardingDocType) => documents.find(d => d.doc_type === type);
    const allUploaded = ONBOARDING_DOC_TYPES.every(t => docFor(t.key)?.verified_at || docFor(t.key)?.uploaded_at);
    // The page-level completion card already covers the fully-Verified case —
    // this banner is only for "still uploading," not "still awaiting review."
    const showIncompleteBanner = !allUploaded && onboardingStatus !== "Verified";

    const handleFileChange = async (docType: OnboardingDocType, file: File | null) => {
        if (!file) return;
        setError(null);
        setUploadingType(docType);

        const formData = new FormData();
        formData.append("file", file);

        const result = await withLoading(() => uploadOnboardingDocument(fellowId, docType, formData));
        setUploadingType(null);

        if (result.error) {
            setError(result.error);
            return;
        }
        setDocuments(prev => {
            const others = prev.filter(d => d.doc_type !== docType);
            return [...others, {
                id: docType,
                fellow_id: fellowId,
                doc_type: docType,
                file_url: result.publicUrl,
                uploaded_at: new Date().toISOString(),
                verified_at: null,
                rejected_reason: null,
            }];
        });
    };

    return (
        <div className="bg-white border border-border rounded-[12px] shadow-soft overflow-hidden">
            {showIncompleteBanner && (
                <div className="mx-5 mt-5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                    Upload all {ONBOARDING_DOC_TYPES.length} documents — your Program Admin will review and verify them.
                </div>
            )}
            {error && (
                <div className="mx-5 mt-4 flex items-center justify-between gap-3 text-[11px] px-3 py-2 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 font-medium">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 font-bold shrink-0">Dismiss</button>
                </div>
            )}

            <div className="p-5 space-y-3">
                {ONBOARDING_DOC_TYPES.map(docType => {
                    const doc = docFor(docType.key);
                    const isRejected = !!doc?.rejected_reason;
                    const isVerified = !!doc?.verified_at;
                    const isUploaded = !!doc?.uploaded_at && !isVerified;

                    return (
                        <div
                            key={docType.key}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-sm border",
                                isVerified ? "border-primary/30 bg-primary/5" :
                                    isRejected ? "border-rose-200 bg-rose-50" :
                                        isUploaded ? "border-border bg-surface" : "border-dashed border-border"
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 rounded-sm flex items-center justify-center shrink-0",
                                isVerified ? "bg-primary text-white" : "bg-white border border-border text-muted"
                            )}>
                                {isVerified ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12.5px] font-bold text-heading">{docType.label}</p>
                                {isRejected && (
                                    <p className="text-[10.5px] text-rose-700 mt-0.5">Rejected: {doc?.rejected_reason} — please re-upload</p>
                                )}
                                {!isRejected && isUploaded && (
                                    <p className="text-[10.5px] text-muted mt-0.5">Uploaded — awaiting review</p>
                                )}
                                {isVerified && (
                                    <p className="text-[10.5px] text-primary mt-0.5">Verified</p>
                                )}
                                {!doc && (
                                    <p className="text-[10.5px] text-muted mt-0.5">PDF or image · Max 5MB</p>
                                )}
                            </div>
                            <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                ref={el => { fileInputRefs.current[docType.key] = el; }}
                                onChange={e => handleFileChange(docType.key, e.target.files?.[0] ?? null)}
                            />
                            <button
                                onClick={() => fileInputRefs.current[docType.key]?.click()}
                                disabled={uploadingType === docType.key || isVerified}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10.5px] font-bold rounded-sm shadow-soft hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
                            >
                                {uploadingType === docType.key ? (
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : doc ? (
                                    <RotateCcw className="w-3 h-3" />
                                ) : (
                                    <Upload className="w-3 h-3" />
                                )}
                                <span>{doc ? "Replace" : "Upload"}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
