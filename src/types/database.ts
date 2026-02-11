export type CandidateStatus =
    | 'Applied'
    | 'Rejected'
    | 'Approved'
    | 'Assessment Scheduled'
    | 'Confirmed'
    | 'Rescheduled'
    | 'Not Coming'
    | 'Assessment Completed'
    | 'To Be Interviewed'
    | 'Interview Scheduled'
    | 'Recommended'
    | 'Not Recommended';

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    resume_url: string;
    cover_letter: string;
    status: CandidateStatus;
    created_at: string;
}

export interface Application {
    id: string;
    candidate_id: string;
    applied_at: string;
    status: CandidateStatus;
}
