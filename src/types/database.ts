export interface InterviewScoreCategory {
    score: number;
    notes: string;
}

export interface InterviewFeedbackJson {
    technical: InterviewScoreCategory;
    communication: InterviewScoreCategory;
    masters_plans: InterviewScoreCategory;
    analytical: InterviewScoreCategory;
    personality: InterviewScoreCategory;
    overall_notes: string;
}

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
    | 'L2 Interview Required'
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
    location?: string;
    education_status?: string;
    graduation_year?: string;
    degree_field?: string;
    cnic?: string;
    batch_number?: string;
    assessment_score_url?: string;
    ai_score?: number;
    ai_reasoning?: string;
    analysis_criteria?: string;
    ai_analysis_json?: {
        extracted_skills: string[];
        experience_summary: string;
        matching_analysis: string;
        education_match: boolean;
        verdict: string;
    };
    created_at: string;
    updated_at: string;
    last_action_by?: string | null;
    // Interview scores (joined from interviews table)
    interview_scores?: {
        decision?: string | null;
        l1_feedback_json?: InterviewFeedbackJson | null;
        l2_feedback_json?: InterviewFeedbackJson | null;
        l1_interviewer_name?: string | null;
        l2_interviewer_name?: string | null;
    };
}

export interface Application {
    id: string;
    candidate_id: string;
    applied_at: string;
    status: CandidateStatus;
}
