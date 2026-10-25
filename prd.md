# Product Requirements Document (PRD)

## Project Title: StudyMate AI – Smart Study Planner
**Event:** Devpost Build With AI: Basics Hackathon  
**Target Completion:** Single working MVP feature  
**Author:** B.Tech IT Student / Antigravity Pair  

---

## 1. Objective & Value Proposition
StudyMate AI eliminates the anxiety and cognitive fatigue of study scheduling. By analyzing exam dates, subject difficulty, and daily study capacity, it automatically generates a personalized, realistic study roadmap using Google Gemini AI.

---

## 2. User Persona
- **Name:** Rahul Verma
- **Role:** 3rd Year B.Tech IT Student
- **Scenario:** Semester exams start in 12 days. Rahul has 4 subjects: Operating Systems (Hard), Computer Networks (Medium), Software Engineering (Easy), and Web Tech (Medium). He can study 6 hours a day.
- **Pain Point:** He doesn't know how to split his 6 hours without burning out or neglecting the hardest subject before its exam.
- **Goal:** Input his exam timetable once, click "Generate Schedule", and get an immediate daily plan with revision built in.

---

## 3. User Journey
1. **Landing & Form Entry**: Rahul opens StudyMate AI. He sees a clean, welcoming interface.
2. **Subject Input**: Rahul selects his daily study hours (e.g. 6 hrs/day), enters each subject name, selects its exam date, and tags the difficulty level.
3. **Generation**: Rahul clicks **"Generate Study Roadmap"**. A loading indicator shows Gemini analyzing his schedule.
4. **Roadmap Review**: Within seconds, the day-by-day plan appears:
   - Summary statistics (Total days, total hours, subject distribution).
   - Card for each calendar day listing specific study blocks, focus topics, and revision milestones.
5. **Action**: Rahul copies the schedule to his notes with a single click.

---

## 4. Functional Requirements

### FR-1: Student Input Form
- **FR-1.1**: User can input `daily_hours` (numeric slider or number input, between 1 and 16).
- **FR-1.2**: User can select a `start_date` (defaults to current date).
- **FR-1.3**: User can add 1 to 8 subjects.
- **FR-1.4**: Each subject requires:
  - Subject Name (string, 2–50 chars).
  - Exam Date (ISO date, must be on or after `start_date`).
  - Difficulty Level (dropdown / pills: `Easy`, `Medium`, `Hard`).
- **FR-1.5**: User can remove a subject row (minimum 1 subject retained).

### FR-2: Client-side & Server-side Validation
- **FR-2.1**: Ensure at least one subject is added.
- **FR-2.2**: Ensure exam dates are in the future relative to `start_date`.
- **FR-2.3**: Prevent submission with blank subject names.

### FR-3: AI Schedule Generation (Google Gemini 2.5 Flash)
- **FR-3.1**: The FastAPI backend formats a specialized prompt including the student's constraints.
- **FR-3.2**: Prompt requires Gemini to:
  - Allocate more hours to "Hard" subjects and subjects with earlier exam dates.
  - Dedicate the day immediately prior to an exam to full revision of that subject.
  - Balance daily hours to strictly match the student's stated `daily_hours`.
  - Include quick study tips for key days.
- **FR-3.3**: Enforce JSON output mode from Gemini to guarantee structured rendering.

### FR-4: Roadmap Visualization
- **FR-4.1**: Display executive summary banner (Total days, total study hours, subject badges).
- **FR-4.2**: Display chronologically sorted Day Cards.
- **FR-4.3**: Each Day Card displays:
  - Date and Day Number (e.g., "Day 1 - Monday, Oct 26").
  - Study sessions with subject name, assigned hours, and focus objective.
  - Visual badges (`Revision`, `Core Study`, `Exam Day`).
  - Helpful AI motivational tip.

### FR-5: Copy & Export
- **FR-5.1**: Provide a "Copy Schedule" button that formats the plan into clean plain text for pasting into WhatsApp, Notion, or Notes.

---

## 5. Non-Functional Requirements
- **Simplicity:** Zero external logins or database configuration required for judges to run and evaluate.
- **Speed:** Response delivered within 5–8 seconds.
- **Mobile Responsive:** Modern responsive layout across smartphones, tablets, and laptops.
- **Error Handling:** Helpful error messages if the Gemini API key is missing or invalid.
