# CareerMatch AI — Project Scope

**Project Name:** CareerMatch AI — AI-Powered Resume and Job Match Analyzer  
**Target Audience:** Students, recent graduates, and career switchers applying for tech and professional jobs.

---

## 1. Problem Statement
Job seekers frequently struggle to gauge how closely their resumes align with target job descriptions:
- High rejection rates without constructive feedback on why an application failed.
- Ambiguity about which skills are truly missing vs. merely understated or missing proof.
- Lack of actionable next steps (projects and focused learning) to bridge identified qualification gaps.

## 2. Solution Overview
**CareerMatch AI** is a lightweight, high-impact web application that allows candidates to upload their PDF resume and paste any target job description. Powered by an advanced AI analysis engine, it extracts resume credentials in-memory, performs structured alignment analysis, and provides an objective match score, matching skills, missing skills, resume improvement suggestions, portfolio project recommendations, and a prioritized learning roadmap.

---

## 3. In-Scope for MVP
1. **Secure In-Memory PDF Processing**:
   - PDF file validation (max 5 MB limit).
   - In-memory text extraction using `pypdf`.
   - Strict handling of blank, scanned, or corrupted files with clear user feedback.
   - Zero permanent storage of resume documents on disk.

2. **Job Description Input**:
   - Text input supporting up to full multi-page job descriptions.
   - Quick-load sample option for testing (Junior Data Scientist role).

3. **AI Analysis Engine (`POST /api/analyze-match`)**:
   - Structured JSON response schema enforced via validated Pydantic models.
   - Grounded evaluation: strict prompt forbidding fabrication of credentials.
   - Categorized skills breakdown (`matching_skills`, `missing_skills`, `improvement_skills`).
   - Concrete project recommendations and step-by-step learning roadmap.

4. **Polished Results Dashboard**:
   - Visual match score card (0–100) with category breakdown.
   - Color-coded badges for validated vs. missing skills.
   - Truthful resume recommendations checklist.
   - One-click "Analyze Another Job" workflow without full page reload.

---

## 4. Out-of-Scope (Deferred Beyond MVP)
- User authentication, profiles, and password management.
- Persistent databases (SQLite/PostgreSQL) — keeping analysis instant, stateless, and private.
- Optical Character Recognition (OCR) for scanned image-only PDFs.
- Automatic resume rewriting or docx/pdf file export.
- Integration with third-party job boards (LinkedIn, Indeed API).

---

## 5. Technology Stack
- **Frontend:** Next.js (TypeScript, Tailwind CSS, Lucide React Icons)
- **Backend:** Python FastAPI (Pydantic v2, Uvicorn, pypdf, python-multipart)
- **AI Integration:** AI Analysis Engine (`google-genai` SDK backend integration)
- **Configuration:** `backend/.env`
