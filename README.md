# 🎯 CareerMatch AI — AI-Powered Resume & Job Match Analyzer

**CareerMatch AI** helps students, recent graduates, and job applicants evaluate how well their resume aligns with target job descriptions using **Google Gemini AI**.

It extracts resume credentials in-memory, identifies matching vs. missing skills, provides honest resume suggestions, and generates tailored portfolio project ideas and a learning roadmap to bridge qualification gaps.

---

## 🚀 Key Features

- **In-Memory PDF Resume Processing:** Upload standard PDF resumes (up to 5 MB). Resumes are processed in RAM without permanent server storage.
- **Job Description Match Scoring:** Instant 0–100 match score with category alignment (Technical Skills, Experience, Education).
- **Three-Tier Skills Classification:**
  - 🟢 **Matching Skills:** Direct alignment supported by your resume.
  - 🔴 **Missing Skills:** Key employer requirements absent from your resume.
  - 🟡 **Skills to Strengthen:** Skills mentioned on your resume that need deeper proof or practical application.
- **Actionable Resume Suggestions:** Practical suggestions to improve bullet points and quantify impact without fabricating experience.
- **Targeted Portfolio Projects:** Concrete project ideas with tech stacks specifically chosen to bridge your missing skills.
- **Prioritized Learning Roadmap:** Phased step-by-step action items to master target requirements.
- **Privacy & Security Focused:** In-memory document parsing; transparent disclosure that resume text is analyzed via Google Gemini API.

---

## 📁 Project Architecture & Planning Docs

- [**`scope.md`**](scope.md) — Scope boundaries, in-scope features, and out-of-scope items.
- [**`prd.md`**](prd.md) — Product Requirements Document, persona, and user journey.
- [**`spec.md`**](spec.md) — Technical Specification, API contracts, and Gemini JSON schema.

---

## ⚡ Quick Start

### 1. Launch with One Click (PowerShell)
```powershell
.\run-dev.ps1
```
This automatically starts:
- **FastAPI Backend:** `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)
- **Next.js Frontend:** `http://localhost:3000`

---

### 2. Or Run Manually in Two Terminals

#### Terminal 1: Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python main.py
```

#### Terminal 2: Frontend (Next.js)
```powershell
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Configuring Your Google Gemini API Key

1. Obtain a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Open [`backend/.env`](backend/.env):
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Restart the backend server. The frontend header badge will immediately update to **"Gemini 2.5 Active"**!

> **Privacy Notice**: When AI analysis is executed, resume text and the job description are sent to Google's Gemini API over HTTPS. Resumes are processed in-memory and are not permanently saved to disk or databases.
