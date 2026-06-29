import * as XLSX from "xlsx";
import { Candidate, InterviewFeedbackJson } from "@/types/database";

// Computes the average of the five scored categories, ignoring any that are
// still zero (i.e. unevaluated). Returns null if there are no scored
// categories so blank cells stay blank in Excel instead of showing "0".
function calcAvg(fb?: InterviewFeedbackJson | null): number | null {
    if (!fb) return null;
    const scores = [
        fb.technical?.score,
        fb.communication?.score,
        fb.masters_plans?.score,
        fb.analytical?.score,
        fb.personality?.score,
    ].filter((s): s is number => typeof s === 'number' && s > 0);
    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Number(avg.toFixed(2));
}

function scoreOf(fb: InterviewFeedbackJson | null | undefined, key: keyof Omit<InterviewFeedbackJson, 'overall_notes'>): number | null {
    const s = fb?.[key]?.score;
    return typeof s === 'number' && s > 0 ? s : null;
}

function fmtDate(iso?: string | null): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('en-US', {
            timeZone: 'Asia/Karachi',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

// Column metadata — order here = column order in the spreadsheet. Each entry
// is { header, accessor } so the row builder stays declarative.
interface ColumnDef {
    header: string;
    accessor: (c: Candidate) => string | number | null;
    width: number;
}

const COLUMNS: ColumnDef[] = [
    { header: 'Batch', accessor: c => c.batch_number ?? '', width: 8 },
    { header: 'Name', accessor: c => c.name ?? '', width: 24 },
    { header: 'Email', accessor: c => c.email ?? '', width: 28 },
    { header: 'Phone', accessor: c => c.phone ?? '', width: 16 },
    { header: 'CNIC', accessor: c => (c as any).cnic ?? '', width: 18 },
    { header: 'University', accessor: c => (c as any).university ?? '', width: 22 },
    { header: 'Degree Field', accessor: c => c.degree_field ?? '', width: 24 },
    { header: 'Graduation Year', accessor: c => c.graduation_year ?? '', width: 14 },
    { header: 'Education Status', accessor: c => c.education_status ?? '', width: 18 },
    { header: 'Location', accessor: c => c.location ?? '', width: 18 },
    { header: 'Position', accessor: c => c.position ?? '', width: 20 },
    { header: 'Status', accessor: c => c.status ?? '', width: 20 },
    { header: 'AI Score', accessor: c => (c as any).ai_score ?? '', width: 10 },
    { header: 'Applied At (PKT)', accessor: c => fmtDate((c as any).created_at), width: 18 },

    // L1 round
    { header: 'L1 Interviewer', accessor: c => c.interview_scores?.l1_interviewer_name ?? '', width: 22 },
    { header: 'L1 Technical', accessor: c => scoreOf(c.interview_scores?.l1_feedback_json, 'technical') ?? '', width: 12 },
    { header: 'L1 Communication', accessor: c => scoreOf(c.interview_scores?.l1_feedback_json, 'communication') ?? '', width: 16 },
    { header: 'L1 Graduate Ambition', accessor: c => scoreOf(c.interview_scores?.l1_feedback_json, 'masters_plans') ?? '', width: 18 },
    { header: 'L1 Analytical', accessor: c => scoreOf(c.interview_scores?.l1_feedback_json, 'analytical') ?? '', width: 12 },
    { header: 'L1 Culture Alignment', accessor: c => scoreOf(c.interview_scores?.l1_feedback_json, 'personality') ?? '', width: 18 },
    { header: 'L1 Average', accessor: c => calcAvg(c.interview_scores?.l1_feedback_json) ?? '', width: 11 },
    { header: 'L1 Notes', accessor: c => c.interview_scores?.l1_feedback_json?.overall_notes ?? '', width: 45 },

    // L2 round
    { header: 'L2 Interviewer', accessor: c => c.interview_scores?.l2_interviewer_name ?? '', width: 22 },
    { header: 'L2 Technical', accessor: c => scoreOf(c.interview_scores?.l2_feedback_json, 'technical') ?? '', width: 12 },
    { header: 'L2 Communication', accessor: c => scoreOf(c.interview_scores?.l2_feedback_json, 'communication') ?? '', width: 16 },
    { header: 'L2 Graduate Ambition', accessor: c => scoreOf(c.interview_scores?.l2_feedback_json, 'masters_plans') ?? '', width: 18 },
    { header: 'L2 Analytical', accessor: c => scoreOf(c.interview_scores?.l2_feedback_json, 'analytical') ?? '', width: 12 },
    { header: 'L2 Culture Alignment', accessor: c => scoreOf(c.interview_scores?.l2_feedback_json, 'personality') ?? '', width: 18 },
    { header: 'L2 Average', accessor: c => calcAvg(c.interview_scores?.l2_feedback_json) ?? '', width: 11 },
    { header: 'L2 Notes', accessor: c => c.interview_scores?.l2_feedback_json?.overall_notes ?? '', width: 45 },

    { header: 'Final Decision', accessor: c => c.interview_scores?.decision ?? '', width: 20 },
];

export function exportCandidatesToExcel(candidates: Candidate[], filenameStem = 'CGAP_Candidates'): void {
    const headers = COLUMNS.map(col => col.header);
    const rows = candidates.map(c => COLUMNS.map(col => col.accessor(c)));

    // Build sheet from a 2D array. First row becomes the header row.
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Apply column widths.
    (ws as any)['!cols'] = COLUMNS.map(col => ({ wch: col.width }));

    // Freeze the header row so the user can scroll through hundreds of
    // candidates without losing the column labels.
    (ws as any)['!freeze'] = { xSplit: 0, ySplit: 1 };

    // Wrap the notes columns by setting alignment.wrapText = true. SheetJS
    // applies it at the cell level; we mark the whole column range.
    const NOTE_COL_LETTERS = ['V', 'AD']; // L1 Notes (22nd col, index 21) and L2 Notes
    for (const letter of NOTE_COL_LETTERS) {
        for (let r = 2; r <= rows.length + 1; r++) {
            const addr = `${letter}${r}`;
            if (ws[addr]) {
                (ws[addr] as any).s = { alignment: { wrapText: true, vertical: 'top' } };
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    // Stamp the export with today's PKT date so multiple downloads don't
    // collide in the user's Downloads folder.
    const todayPkt = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    const filename = `${filenameStem}_${todayPkt}.xlsx`;

    XLSX.writeFile(wb, filename);
}
