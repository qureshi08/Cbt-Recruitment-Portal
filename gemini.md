# 🚀 CBT Recruitment Portal: Master Project Documentation

This is the master documentation for the **CBT Recruitment Portal**, a high-fidelity web application built to manage applications for the **Convergent Graduate Academy Program (CGAP)**.

---

## 🌟 Executive Summary
The portal streamlines the recruitment lifecycle: from candidate application and AI-driven resume screening to assessment scheduling and interview management. It provides a secure admin dashboard with granular Role-Based Access Control (RBAC).

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **AI Analysis**: [Google Gemini Pro](https://ai.google.dev/) (via `@google/generative-ai`)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Email**: [Nodemailer](https://nodemailer.com/)

---

## 🏗️ Project Structure
```text
/src
  /app
    /admin          # Dashboard, application management, settings
    /book-slot      # Candidate-facing scheduling interface
    /login          # Admin authentication
    /actions.ts     # Centralized Server Actions (Business Logic)
    /layout.tsx     # Root layout & providers
    /page.tsx       # Landing page (Minimalist Apply page)
  /components       # Reusable UI components (Shared)
  /lib              # Core utilities (Supabase, Email, Auth)
  /types            # TypeScript definitions
/public             # Static assets
schema.sql          # Database schema (Postgres)
tailwind.config.ts  # Theme configuration
```

---

## 🔄 Core Workflows

### 1. Application Submission
- Candidates provide details and upload a resume (PDF/DOCX).
- **Logic**: Stored in `candidates` table; resume uploaded to `resumes` bucket in Supabase Storage.
- **Rules**: Automatic checking for re-application using **CNIC** (limits re-entry within 3-6 months depending on previous status).

### 2. AI Screening (Gemini)
- Upon submission, the `analyzeCandidateWithAi` action is triggered.
- **Process**: Extracts text from the resume, compares it against criteria defined in `roles` table (hidden `_SYSTEM_AI_CRITERIA_`), and calculates an `ai_score` and `ai_reasoning`.

### 3. Application Approval & Booking
- Admins (Approver/HR) review candidates.
- Changing status to `Approved` sends an email with a unique booking link.
- Candidates select an available `assessment_slot`.

### 4. Interview Phase
- Once assessment is completed, candidates move to "To Be Interviewed".
- L1 Interview records feedback. If needed, requests L2 Interview.
- Final decision: `Recommended` or `Rejected`.

---

## 🔐 Admin Roles & Permissions
Managed via the `user_roles` and `roles` tables:
- **Master**: System settings, manual user creation/deletion, full data access.
- **HR**: Manage candidates, slots, and view dashboards.
- **Approver**: View candidates and approve for assessments.
- **Interviewer**: Access to interview feedback forms.

---

## 🗄️ Database Schema Highlights

### `public.candidates`
- Core applicant data, status tracking, and AI analysis results.
- `cnic`: Used for unique identification and re-application logic.

### `public.assessment_slots`
- Managed by HR. Linked to `candidates` when booked.
- `is_locked`: Prevents concurrent booking of the same slot.

### `public.interviews`
- Feedback storage for L1 and L2 interview rounds.

---

## ⚙️ Environment Variables (`.env.local`)
Required keys for development and production:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
NEXT_PUBLIC_APP_URL=...
```

---

## 🚀 Deployment
- **Platform**: Vercel
- **Database**: Supabase
- **GitHub**: [qureshi08/Cbt-Recruitment-Portal](https://github.com/qureshi08/Cbt-Recruitment-Portal)

---

## 🤖 AI Master Context (Gemini/Antigravity)
This file serves as the primary context for AI agents working on this project. When modifying code:
1. Prefer **Server Actions** in `src/app/actions.ts` for database operations.
2. Maintain the **Tailwind 4** design tokens (specifically the `primary` green `#009245`).
3. Ensure **CNIC re-application logic** is respected in any form modifications.
4. Always update `updated_at` timestamps on candidate record changes.

---
*Created on: 2026-04-02 | Version: 1.1.0*
