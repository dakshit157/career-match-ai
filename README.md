# 🎓 StudyMate AI – Smart Study Planner

> **Devpost Hackathon:** Build With AI: Basics  
> **Project:** Project 2 – StudyMate AI  
> **Built with:** Next.js (TypeScript + Tailwind CSS) • Python FastAPI • Google Gemini 2.5 Flash

---

## 💡 About StudyMate AI
StudyMate AI is a smart, beginner-friendly academic study planner designed for college and university students.

Students enter their subjects, exam dates, difficulty levels, and available daily study hours. **Google Gemini AI** analyzes exam deadlines and subject complexity to generate a personalized, day-by-day study roadmap with built-in revision cycles.

---

## 📁 Project Architecture & Planning Docs

- [**`scope.md`**](scope.md) – Project Scope and MVP boundaries
- [**`prd.md`**](prd.md) – Product Requirements Document
- [**`spec.md`**](spec.md) – Technical Specification & JSON API Contracts

---

## ⚡ Quick Start

### 1. Launch Everything with One Click (PowerShell)
```powershell
.\run-dev.ps1
```
This automatically opens:
- **FastAPI Backend:** `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **Next.js Frontend:** `http://localhost:3000`

---

### 2. Or Run Separately in Two Terminals

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

---

## 🔑 Adding Your Google Gemini API Key

StudyMate AI includes a **smart demo simulation mode**, allowing anyone (or hackathon judges) to test the app immediately even without an API key!

To enable real-time **Gemini 2.5 Flash** generation:
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Open [`backend/.env`](backend/.env):
   ```env
   GEMINI_API_KEY=your_actual_gemini_key_here
   ```
3. Restart the backend server. The frontend header will update to show **"Gemini 2.5 Flash"** active!

---

## 🏆 Devpost Submission Details
- **Clean Single-Feature Focus:** High-quality schedule generation without bloat.
- **Stateless & Instant:** No database or authentication barriers for judges to test.
- **Copy-to-Clipboard:** Students can export their study plan directly into notes or calendar apps.
