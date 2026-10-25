# StudyMate AI – Project Scope

**Hackathon:** Devpost Build With AI: Basics  
**Track / Project:** Project 2 – StudyMate AI (Smart Study Planner)  
**Target Audience:** College and university students preparing for semester exams (1–4 weeks preparation horizon).

---

## 1. Problem Statement
College students often struggle to organize their study time before semester exams. With multiple subjects of varying difficulty, competing deadlines, and limited daily hours, students either:
- Spend too much time on easy subjects and run out of time for difficult ones.
- Procrastinate due to overwhelming workloads and lack of a concrete daily plan.
- Fail to allocate sufficient time for revision before exam dates.

## 2. Solution Overview
**StudyMate AI** is a lightweight, beginner-friendly web application that takes a student's subjects, exam dates, difficulty levels, and daily available study hours, and uses **Google Gemini AI** to produce an intelligent, day-by-day study roadmap with built-in revision cycles.

---

## 3. In-Scope for MVP (One Core Working Feature)

### ✅ Core Feature: Intelligent Study Schedule Generation
1. **Student Input Form**:
   - Start Date (defaults to tomorrow or today).
   - Available study hours per day (e.g., 2 to 12 hours).
   - Dynamic subject list:
     - Subject Name (e.g., "Data Structures", "Database Management").
     - Exam Date (date picker).
     - Perceived Difficulty (`Easy`, `Medium`, `Hard`).
   - Add/Remove subject rows dynamically.

2. **AI Study Engine (FastAPI + Google Gemini 2.5 Flash)**:
   - Validates user input (dates in the future, positive hours, exam order).
   - Constructs a structured system prompt instructing Gemini to allocate study hours proportionately based on difficulty and exam proximity.
   - Enforces a strict JSON response schema from Gemini.

3. **Roadmap Display & Interaction**:
   - High-level overview: Total study days, total planned hours, and difficulty breakdown.
   - Day-by-day schedule cards showing morning/afternoon/evening sessions or time allocations.
   - Visual badges for session types (`Deep Study`, `Revision`, `Exam Day`).
   - One-click "Copy Schedule to Clipboard".

---

## 4. Out-of-Scope (Deferred Beyond MVP)
To keep the application simple, reliable, and strictly hackathon-compliant:
- ❌ User authentication (login / signup / passwords).
- ❌ Database storage (SQLite / Postgres) — the MVP is stateless, instant, and clean.
- ❌ External calendar syncing (Google Calendar, Outlook).
- ❌ Push notifications and SMS study reminders.
- ❌ PDF file exports (copy-to-clipboard is provided instead).
- ❌ Multi-language localization.

---

## 5. Technology Stack
- **Frontend:** Next.js (TypeScript, Tailwind CSS, Lucide React Icons)
- **Backend:** Python FastAPI (Pydantic v2, Uvicorn)
- **AI Model:** Google Gemini 2.5 Flash (`google-genai` SDK)
- **Storage:** None (Stateless architecture for MVP)
