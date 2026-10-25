# Technical Specification (Spec)

## Project Title: StudyMate AI – Smart Study Planner
**Stack:** Next.js (Frontend) + FastAPI (Backend) + Google Gemini API (AI)

---

## 1. System Architecture

```text
[ Browser / Next.js Client ]
             │
             │ HTTP POST /api/study-plan
             ▼
[ FastAPI Backend (Python) ]
             │
             │ 1. Validate inputs (Pydantic)
             │ 2. Formulate prompt & schema
             ▼
[ Google Gemini 2.5 Flash API ]
             │
             │ Return Structured JSON
             ▼
[ FastAPI Backend (Python) ]
             │
             │ Enriched JSON Response
             ▼
[ Browser / Next.js Client ]
  -> Renders Interactive Day-by-Day Roadmap
```

---

## 2. API Contract Specification

### Endpoint: `POST /api/study-plan`

#### Request Payload Schema
```json
{
  "start_date": "2026-10-26",
  "daily_hours": 6.0,
  "subjects": [
    {
      "name": "Operating Systems",
      "exam_date": "2026-11-04",
      "difficulty": "Hard"
    },
    {
      "name": "Computer Networks",
      "exam_date": "2026-11-08",
      "difficulty": "Medium"
    }
  ]
}
```

#### Response Payload Schema
```json
{
  "plan_summary": "Comprehensive 14-day study plan emphasizing Operating Systems concepts and early Networks review.",
  "total_days": 14,
  "total_hours": 84.0,
  "subject_distribution": [
    {
      "subject": "Operating Systems",
      "allocated_hours": 48.0,
      "difficulty": "Hard"
    },
    {
      "subject": "Computer Networks",
      "allocated_hours": 36.0,
      "difficulty": "Medium"
    }
  ],
  "daily_schedule": [
    {
      "day_number": 1,
      "date": "2026-10-26",
      "day_theme": "Core Concepts & Deep Work",
      "sessions": [
        {
          "subject": "Operating Systems",
          "hours": 3.5,
          "focus_topic": "Process Synchronization & Semaphores",
          "session_type": "Deep Study"
        },
        {
          "subject": "Computer Networks",
          "hours": 2.5,
          "focus_topic": "OSI & TCP/IP Reference Models",
          "session_type": "Deep Study"
        }
      ],
      "daily_tip": "Focus on visual diagrams for process states."
    }
  ]
}
```

---

## 3. Gemini Prompt Engineering

### Prompt Strategy
1. **Model:** `gemini-2.5-flash`
2. **System Instruction:**
   > "You are an expert academic study strategist and college tutor. Your job is to construct a balanced, realistic, day-by-day study schedule for university students preparing for semester exams.
   > Rules:
   > 1. Prioritize subjects with earlier exam dates and higher difficulty ratings.
   > 2. Ensure each day's total study session hours sum exactly or closely to the student's daily available hours.
   > 3. Mark the day before each exam as 'Final Revision' for that specific subject.
   > 4. Ensure spaced repetition across multiple days for retention.
   > 5. Output valid, parseable JSON conforming strictly to the requested schema."
3. **Response Schema Enforcement:**
   Using Gemini `response_mime_type="application/json"` with Pydantic JSON schema or typed instructions.

---

## 4. Frontend Component Structure

- `frontend/src/app/page.tsx`:
  - `Header`: App title, badge, backend live connection status.
  - `PlanForm`:
    - Daily study hours slider/number input.
    - Start date input.
    - Subject row repeater (Subject name, exam date, difficulty selector: Easy/Medium/Hard, delete button).
    - "Add Subject" button & "Generate Study Plan" button with loading spinner.
  - `RoadmapView`:
    - Summary banner (Total days, total hours, subject pills).
    - "Copy to Clipboard" button.
    - Chronological list of daily cards.
    - Session item tags (`Deep Study`, `Revision`, `Exam Day`).

---

## 5. Directory Organization

```text
d:\Devpost Project\
├── scope.md               # Scope and MVP boundaries
├── prd.md                 # Product Requirements Document
├── spec.md                # Technical Specification
├── backend/
│   ├── .env               # API keys (GEMINI_API_KEY)
│   ├── .env.example
│   ├── main.py            # FastAPI endpoints & Gemini integration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx
│   │       └── page.tsx   # StudyMate AI Frontend interface
│   └── package.json
└── README.md
```
