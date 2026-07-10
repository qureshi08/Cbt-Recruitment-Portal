// Types for the Academy (post-selection) system — deliberately separate from
// src/types/database.ts's recruiting types. A Fellow originates from a
// Candidate (source_candidate_id) but nothing here extends or modifies the
// recruiting types; the two domains only meet through that one foreign key.

export type BatchStatus = 'Pending Orientation' | 'Active' | 'Completed' | 'Paused';

export interface Batch {
    id: string;
    batch_number: string;
    orientation_date: string;
    curriculum_version: string;
    status: BatchStatus;
    expected_count?: number | null;
    notes?: string | null;
    created_at: string;
    // Enriched fields (joined in, not columns)
    mentor_name?: string | null;
    fellow_count?: number;
}

export type OnboardingStatus = 'Pending' | 'Verified' | 'Rejected';

export interface Fellow {
    id: string;
    source_candidate_id: string;
    batch_id: string;
    auth_user_id: string;
    onboarding_status: OnboardingStatus;
    dropped_out_at?: string | null;
    created_at: string;
    // Enriched fields (joined in from candidates, read-only)
    name?: string;
    email?: string;
}

export interface MentorAssignment {
    id: string;
    mentor_user_id: string;
    batch_id: string;
    assigned_at: string;
    // Enriched fields
    mentor_name?: string;
    mentor_email?: string;
    batch_number?: string;
}

export const CHECKLIST_ITEMS = [
    { key: 'welcome_emails', label: 'Welcome emails sent', auto: true },
    { key: 'pamphlets', label: 'Individual pamphlets prepared', auto: false },
    { key: 'food_order', label: 'Food order confirmed', auto: false },
    { key: 'venue', label: 'Venue / room booked', auto: false },
    { key: 'teams_onedrive', label: 'Teams channel + OneDrive created', auto: false },
    { key: 'whatsapp_group', label: 'WhatsApp group created', auto: false },
    { key: 'onboarding_docs', label: 'Onboarding documents collected', auto: false },
    { key: 'mentor_briefed', label: 'Mentor briefed', auto: false },
] as const;

export type ChecklistItemKey = typeof CHECKLIST_ITEMS[number]['key'];

export interface ChecklistItem {
    id: string;
    batch_id: string;
    item_key: ChecklistItemKey;
    done_at?: string | null;
    done_by?: string | null;
}

export const ONBOARDING_DOC_TYPES = [
    { key: 'transcript', label: "Degree final transcript" },
    { key: 'pseb_screenshot', label: 'Screenshot of PSEB profile' },
    { key: 'pseb_email', label: 'PSEB confirmation email' },
    { key: 'undertaking', label: 'Signed undertaking' },
] as const;

export type OnboardingDocType = typeof ONBOARDING_DOC_TYPES[number]['key'];

export interface OnboardingDocument {
    id: string;
    fellow_id: string;
    doc_type: OnboardingDocType;
    file_url?: string | null;
    uploaded_at?: string | null;
    verified_at?: string | null;
    rejected_reason?: string | null;
}
