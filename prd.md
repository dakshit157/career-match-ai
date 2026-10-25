# Product Requirements Document (PRD)

## Project Title: CareerMatch AI — AI-Powered Resume & Job Match Analyzer
**Target User:** Students, recent college graduates, and job applicants  
**Status:** MVP Implemented  

---

## 1. Executive Summary
CareerMatch AI empowers job applicants to demystify job postings. By matching candidate credentials against employer requirements using advanced AI analysis, it delivers an objective evaluation and a concrete action plan to optimize application success.

---

## 2. User Persona
- **Name:** Priya Sharma
- **Background:** Recent B.Tech IT graduate aspiring to enter the data analytics & data science field.
- **Pain Point:** Applies to numerous Junior Data Scientist roles on career portals and job boards without hearing back. Unsure whether her resume lacks key keywords, needs stronger projects, or is genuinely misaligned.
- **Goal:** Upload her existing resume, paste a target job description, and get instant, honest feedback on missing qualifications and recommended bridge projects.

---

## 3. User Journey
1. **Landing:** Priya opens CareerMatch AI. She sees a clean, professional dashboard and a privacy notice ensuring her document is processed in-memory.
2. **Input:**
   - She clicks to upload her PDF resume (e.g. `priya_sharma_resume.pdf`). The UI validates the file format and displays its file size.
   - She pastes the target job description (or uses the sample button to test).
3. **Trigger:** She clicks **"Analyze My Match"**. The button animates with a loading indicator while the AI analyzes the text.
4. **Results Review:** Within seconds, the comprehensive dashboard renders:
   - Overall match score (e.g. 78/100) with category alignment bars.
   - Objective summary of candidate strengths.
   - Skill badges: matching skills (green), missing skills (red), and skills needing improvement (amber).
   - Specific, truthful suggestions to refine her resume bullet points.
   - Portfolio project recommendations with tech stacks.
   - Prioritized learning roadmap (Phase 1, Phase 2, etc.).
5. **Next Actions:** Priya clicks **"Analyze Another Job"** to test a different posting without refreshing the app.

---

## 4. Functional Requirements

### FR-1: Document Ingestion & Validation
- **FR-1.1**: Accept files with `.pdf` extension or `application/pdf` MIME type.
- **FR-1.2**: Enforce maximum file size limit of 5 MB.
- **FR-1.3**: Extract text in-memory using `pypdf`.
- **FR-1.4**: Reject empty, scanned, or unreadable PDFs with a clear error prompt.
- **FR-1.5**: Prohibit permanent disk persistence of uploaded resume files.

### FR-2: Job Description Ingestion
- **FR-2.1**: Large multiline text area accepting target job description.
- **FR-2.2**: Enforce minimum character threshold (30 characters) to prevent empty analysis.
- **FR-2.3**: One-click "Load Sample" button for testing.

### FR-3: AI Analysis Engine
- **FR-3.1**: Secure backend endpoint: `POST /api/analyze-match`.
- **FR-3.2**: Prompt instructions enforce strict truthfulness (no fabricated experience).
- **FR-3.3**: Distinguish between absent skills and true deficiencies.
- **FR-3.4**: Return validated structured JSON matching the Pydantic schema:
  - `match_score` (0–100)
  - `score_breakdown` (technical, experience, education)
  - `summary`
  - `matching_skills`
  - `missing_skills`
  - `improvement_skills`
  - `resume_suggestions`
  - `project_recommendations`
  - `learning_roadmap`
  - `disclaimer`

### FR-4: Results Visualization
- **FR-4.1**: Prominent match score indicator with dynamic color thresholds.
- **FR-4.2**: Categorized skill pills with distinct status icons.
- **FR-4.3**: Actionable resume suggestions checklist.
- **FR-4.4**: Project recommendation cards showing title, overview, and skills demonstrated.
- **FR-4.5**: Step-by-step roadmap cards.
- **FR-4.6**: Explicit legal/methodology disclaimer that the score is an algorithmic estimate, not a hiring guarantee.

---

## 5. Non-Functional & Security Requirements
- **Privacy:** Resume text and job description are sent in-memory over HTTPS to the AI service; no documents are stored in local databases or logs.
- **Performance:** End-to-end extraction and AI analysis returned in 3–6 seconds.
- **Reliability:** Handles malformed AI output, network failures, and temporary API unavailability with retry backoff and clear user guidance.
- **Usability:** Fully responsive layout across mobile and desktop devices.
