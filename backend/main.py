import os
import json
from datetime import datetime, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="StudyMate AI API",
    description="Intelligent Study Planner Backend powered by Google Gemini",
    version="1.0.0"
)

# Configure CORS
origins = [
    os.getenv("CORS_ORIGIN", "http://localhost:3000"),
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class SubjectInput(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the subject")
    exam_date: str = Field(..., description="Date of the exam (YYYY-MM-DD)")
    difficulty: Literal["Easy", "Medium", "Hard"] = Field("Medium", description="Subject difficulty")


class StudyPlanRequest(BaseModel):
    start_date: str = Field(..., description="Start date of study plan (YYYY-MM-DD)")
    daily_hours: float = Field(..., ge=1, le=16, description="Hours available to study per day")
    subjects: List[SubjectInput] = Field(..., min_items=1, description="List of subjects to study")


class StudySession(BaseModel):
    subject: str
    hours: float
    focus_topic: str
    session_type: str = Field("Deep Study", description="'Deep Study', 'Practice Questions', 'Revision', or 'Optional Final Revision'")


class DailySchedule(BaseModel):
    day_number: int
    date: str
    day_theme: str
    sessions: List[StudySession]
    daily_tip: Optional[str] = None


class SubjectDistribution(BaseModel):
    subject: str
    allocated_hours: float
    difficulty: str


class StudyPlanResponse(BaseModel):
    plan_summary: str
    warning: Optional[str] = None
    total_days: int
    total_hours: float
    subject_distribution: List[SubjectDistribution]
    daily_schedule: List[DailySchedule]
    source: str  # "gemini" or "mock"


class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_configured: bool


# --- Health Check ---

@app.get("/health", response_model=HealthResponse)
def health_check():
    api_key = os.getenv("GEMINI_API_KEY")
    is_gemini_configured = bool(api_key and api_key != "your_gemini_api_key_here" and len(api_key.strip()) > 5)
    return HealthResponse(
        status="ok",
        service="StudyMate AI Backend (FastAPI)",
        gemini_configured=is_gemini_configured
    )


# --- Intelligent Schedule Generator (Adhering strictly to exam proximity and realistic session rules) ---

def generate_mock_plan(payload: StudyPlanRequest) -> StudyPlanResponse:
    try:
        start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    except ValueError:
        start_dt = datetime.now()

    # Parse and sort subjects by exam date
    parsed_subjects = []
    warnings = []
    
    for s in payload.subjects:
        try:
            e_dt = datetime.strptime(s.exam_date, "%Y-%m-%d")
            parsed_subjects.append({
                "name": s.name.strip(),
                "exam_date": s.exam_date,
                "exam_dt": e_dt,
                "difficulty": s.difficulty
            })
            if e_dt == start_dt:
                warnings.append(
                    f"Plan starts on the exam date for '{s.name}' ({s.exam_date}). Insufficient preparation time! Only optional morning review is scheduled."
                )
            elif e_dt < start_dt:
                warnings.append(
                    f"Exam date for '{s.name}' ({s.exam_date}) has already passed before the start date ({payload.start_date})."
                )
        except ValueError:
            pass

    if not parsed_subjects:
        raise HTTPException(status_code=400, detail="Invalid subject dates.")

    # Sort parsed subjects by exam date (earliest first), then difficulty
    diff_order = {"Hard": 3, "Medium": 2, "Easy": 1}
    parsed_subjects.sort(key=lambda x: (x["exam_dt"], -diff_order.get(x["difficulty"], 2)))

    last_exam_dt = max(s["exam_dt"] for s in parsed_subjects)
    
    # Calculate days to schedule: from start_dt to last_exam_dt
    days_span = (last_exam_dt - start_dt).days + 1
    total_days = max(1, min(45, days_span))

    daily_schedule: List[DailySchedule] = []
    subject_hours_accum = {s["name"]: 0.0 for s in parsed_subjects}

    for d in range(total_days):
        current_dt = start_dt + timedelta(days=d)
        date_str = current_dt.strftime("%Y-%m-%d")

        # 1. Check if any subject has its exam TODAY
        exam_today = next((s for s in parsed_subjects if s["exam_dt"] == current_dt), None)

        # 2. Find eligible subjects for preparation (exam_dt > current_dt)
        # Note: strictly NO preparation after exam date!
        upcoming_subjects = [s for s in parsed_subjects if s["exam_dt"] > current_dt]
        # Sort upcoming subjects by proximity to exam date
        upcoming_subjects.sort(key=lambda x: (x["exam_dt"], -diff_order.get(x["difficulty"], 2)))

        sessions: List[StudySession] = []
        remaining_hours = payload.daily_hours

        # Handle exam day: optional final revision only
        if exam_today:
            optional_rev_hours = min(1.5, remaining_hours)
            sessions.append(StudySession(
                subject=exam_today["name"],
                hours=optional_rev_hours,
                focus_topic=f"High-yield formula sheet, key definitions, and quick concept glance before entering the exam hall",
                session_type="Optional Final Revision"
            ))
            subject_hours_accum[exam_today["name"]] += optional_rev_hours
            remaining_hours = round(remaining_hours - optional_rev_hours, 1)

            if not upcoming_subjects:
                # Last day of exams!
                day_theme = f"Final Exam Day: {exam_today['name']}"
                tip = f"Best of luck on your {exam_today['name']} exam! All exams are now complete."
                daily_schedule.append(DailySchedule(
                    day_number=d + 1,
                    date=date_str,
                    day_theme=day_theme,
                    sessions=sessions,
                    daily_tip=tip
                ))
                continue
            else:
                day_theme = f"Exam Day: {exam_today['name']} & Prep for {upcoming_subjects[0]['name']}"
                tip = f"After completing your {exam_today['name']} exam, take a 1-hour rest before starting your next prep."
        else:
            if upcoming_subjects:
                next_sub = upcoming_subjects[0]
                days_to_next = (next_sub["exam_dt"] - current_dt).days
                if days_to_next == 1:
                    day_theme = f"Intensive Final Revision: {next_sub['name']} (Exam Tomorrow)"
                    tip = f"Exam tomorrow for {next_sub['name']}! Solve 1 mock paper and sleep at least 7-8 hours tonight."
                else:
                    day_theme = f"Priority Focus: {next_sub['name']} (Exam in {days_to_next} days)"
                    tip = "Use the 50/10 Pomodoro rule: 50 minutes study, 10 minutes break. Stay hydrated!"
            else:
                day_theme = "General Review & Catch-up"
                tip = "Review your notes and summarize key points."

        # Allocate remaining hours to upcoming subjects in realistic, smaller blocks (max 2.0 to 2.5 hours per session)
        if upcoming_subjects and remaining_hours > 0:
            primary_sub = upcoming_subjects[0]
            days_until_primary_exam = (primary_sub["exam_dt"] - current_dt).days
            secondary_sub = upcoming_subjects[1] if len(upcoming_subjects) > 1 else None

            # If primary exam is tomorrow (1 day away), dedicate primary focus (approx 70-100% of remaining hours)
            if days_until_primary_exam == 1 or not secondary_sub:
                # Divide primary subject into realistic blocks with practice questions & revision
                if remaining_hours >= 6.0:
                    b1 = round(remaining_hours * 0.35, 1)  # ~2.5h
                    b2 = round(remaining_hours * 0.35, 1)  # ~2.5h
                    b3 = round(remaining_hours - b1 - b2, 1) # ~2.0h
                    
                    sessions.append(StudySession(
                        subject=primary_sub["name"],
                        hours=b1,
                        focus_topic=f"Core concept review, high-weightage topics ({primary_sub['difficulty']} focus)",
                        session_type="Revision" if days_until_primary_exam == 1 else "Deep Study"
                    ))
                    sessions.append(StudySession(
                        subject=primary_sub["name"],
                        hours=b2,
                        focus_topic="Practice questions: previous years' exam problems & code exercises",
                        session_type="Practice Questions"
                    ))
                    sessions.append(StudySession(
                        subject=primary_sub["name"],
                        hours=b3,
                        focus_topic="Self-test: timed questions, weak spot clarification & cheat sheet summary",
                        session_type="Revision"
                    ))
                    subject_hours_accum[primary_sub["name"]] += remaining_hours
                elif remaining_hours >= 3.5:
                    b1 = round(remaining_hours * 0.55, 1)
                    b2 = round(remaining_hours - b1, 1)
                    sessions.append(StudySession(
                        subject=primary_sub["name"],
                        hours=b1,
                        focus_topic=f"Focused module coverage & theory ({primary_sub['difficulty']} level)",
                        session_type="Revision" if days_until_primary_exam == 1 else "Deep Study"
                    ))
                    sessions.append(StudySession(
                        subject=primary_sub["name"],
                        hours=b2,
                        focus_topic="Practice questions and problem-solving exercises",
                        session_type="Practice Questions"
                    ))
                    subject_hours_accum[primary_sub["name"]] += remaining_hours
                else:
                    sessions.append(StudySession(
                        subject=primary_sub["name"],
                        hours=remaining_hours,
                        focus_topic=f"Targeted review & key problem sets",
                        session_type="Revision" if days_until_primary_exam == 1 else "Deep Study"
                    ))
                    subject_hours_accum[primary_sub["name"]] += remaining_hours
            else:
                # Two upcoming subjects: balance between nearest exam (approx 60%) and secondary exam (approx 40%)
                primary_hours = round(remaining_hours * 0.6, 1)
                secondary_hours = round(remaining_hours - primary_hours, 1)

                # Divide primary subject into 2 realistic blocks
                p_b1 = round(primary_hours * 0.5, 1)
                p_b2 = round(primary_hours - p_b1, 1)
                sessions.append(StudySession(
                    subject=primary_sub["name"],
                    hours=p_b1,
                    focus_topic=f"Primary exam focus: core theory & fundamental concepts",
                    session_type="Deep Study"
                ))
                sessions.append(StudySession(
                    subject=primary_sub["name"],
                    hours=p_b2,
                    focus_topic=f"Primary exam practice: textbook exercises & past questions",
                    session_type="Practice Questions"
                ))
                subject_hours_accum[primary_sub["name"]] += primary_hours

                # Divide secondary subject into realistic block(s)
                if secondary_hours >= 3.0:
                    s_b1 = round(secondary_hours * 0.6, 1)
                    s_b2 = round(secondary_hours - s_b1, 1)
                    sessions.append(StudySession(
                        subject=secondary_sub["name"],
                        hours=s_b1,
                        focus_topic=f"Secondary exam foundation: syllabus overview & key notes",
                        session_type="Deep Study"
                    ))
                    sessions.append(StudySession(
                        subject=secondary_sub["name"],
                        hours=s_b2,
                        focus_topic="Concept checkpoint & practice problems",
                        session_type="Practice Questions"
                    ))
                else:
                    sessions.append(StudySession(
                        subject=secondary_sub["name"],
                        hours=secondary_hours,
                        focus_topic=f"Early preparation: key formulas and introductory practice",
                        session_type="Deep Study"
                    ))
                subject_hours_accum[secondary_sub["name"]] += secondary_hours

        daily_schedule.append(DailySchedule(
            day_number=d + 1,
            date=date_str,
            day_theme=day_theme,
            sessions=sessions,
            daily_tip=tip
        ))

    # Calculate actual total hours and distributions
    total_hours_sum = round(sum(sum(s.hours for s in day.sessions) for day in daily_schedule), 1)

    distributions = [
        SubjectDistribution(
            subject=s["name"],
            allocated_hours=round(subject_hours_accum.get(s["name"], 0.0), 1),
            difficulty=s["difficulty"]
        )
        for s in parsed_subjects
    ]

    warning_str = " | ".join(warnings) if warnings else None

    summary = (
        f"Smart {total_days}-day study roadmap prioritizing upcoming exams and balancing study blocks with breaks. "
        f"Subjects are never scheduled after their exam dates, and pre-exam practice is built in."
    )
    if warning_str:
        summary = f"[Warning: {warning_str}] " + summary

    return StudyPlanResponse(
        plan_summary=summary,
        warning=warning_str,
        total_days=total_days,
        total_hours=total_hours_sum,
        subject_distribution=distributions,
        daily_schedule=daily_schedule,
        source="mock"
    )


# --- Core AI Study Plan Endpoint ---

@app.post("/api/study-plan", response_model=StudyPlanResponse)
def create_study_plan(payload: StudyPlanRequest):
    # Validation
    if not payload.subjects:
        raise HTTPException(status_code=400, detail="At least one subject is required.")
    if payload.daily_hours < 1 or payload.daily_hours > 16:
        raise HTTPException(status_code=400, detail="Daily study hours must be between 1 and 16.")

    # Check for start date on or after exam dates to warn
    start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    warning_notes = []
    for s in payload.subjects:
        try:
            e_dt = datetime.strptime(s.exam_date, "%Y-%m-%d")
            if e_dt == start_dt:
                warning_notes.append(
                    f"Plan starts on the exam date for '{s.name}' ({s.exam_date}). Insufficient preparation time! Only optional morning review is scheduled."
                )
            elif e_dt < start_dt:
                warning_notes.append(
                    f"Exam date for '{s.name}' ({s.exam_date}) has already passed before the start date ({payload.start_date})."
                )
        except ValueError:
            pass

    api_key = os.getenv("GEMINI_API_KEY")
    is_gemini_configured = bool(api_key and api_key != "your_gemini_api_key_here" and len(api_key.strip()) > 5)

    if not is_gemini_configured:
        # Fallback cleanly to built-in smart schedule generator
        return generate_mock_plan(payload)

    # Prompt Gemini AI using official google-genai SDK
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        subjects_desc = "\n".join([
            f"- {s.name}: Exam Date={s.exam_date}, Difficulty={s.difficulty}"
            for s in payload.subjects
        ])

        warning_context = ""
        if warning_notes:
            warning_context = f"\nCRITICAL WARNING CONTEXT:\n" + "\n".join([f"- {w}" for w in warning_notes])

        system_instruction = (
            "You are an expert academic tutor and university study strategist.\n"
            "Your task is to generate a personalized, realistic, day-by-day study schedule for a college student preparing for exams.\n\n"
            "STRICT RULES YOU MUST NEVER BREAK:\n"
            "1. NEVER schedule a subject on dates AFTER its exam date. Once an exam date passes, that subject MUST NEVER appear again.\n"
            "2. On the exam date itself, DO NOT schedule normal preparation. Only schedule an 'Optional Final Revision' session (maximum 1.0 to 1.5 hours in the morning). The remainder of the day's study hours must be devoted to upcoming exams.\n"
            "3. If the plan starts on the exam date for a subject, you MUST provide a warning in the 'warning' field stating there is insufficient preparation time.\n"
            "4. NEVER assign a single large 8-hour block to one subject! Break daily study time into realistic sessions (1.5 to 2.5 hours each) separated by breaks.\n"
            "5. Always prioritize subjects with the closest upcoming exam dates.\n"
            "6. Always include 'Practice Questions' and 'Revision' sessions in the days immediately prior to an exam.\n"
            "7. The sum of session hours for any day MUST NOT exceed the student's daily study hours limit.\n"
            "8. Output MUST strictly match the requested JSON schema."
        )

        user_prompt = f"""
Student Study Plan Request:
- Start Date: {payload.start_date}
- Daily Study Hours Available: {payload.daily_hours} hours/day
- Subjects:
{subjects_desc}
{warning_context}

Generate a complete day-by-day study schedule starting from {payload.start_date} up to the final exam date.
Output must be a valid JSON object matching this exact schema:
{{
  "plan_summary": "string summarizing the overall strategy",
  "warning": "string or null (include warning if any exam date <= start date)",
  "total_days": number,
  "total_hours": number,
  "subject_distribution": [
    {{
      "subject": "string",
      "allocated_hours": number,
      "difficulty": "Easy" | "Medium" | "Hard"
    }}
  ],
  "daily_schedule": [
    {{
      "day_number": number,
      "date": "YYYY-MM-DD",
      "day_theme": "string",
      "sessions": [
        {{
          "subject": "string",
          "hours": number,
          "focus_topic": "string",
          "session_type": "Deep Study" | "Practice Questions" | "Revision" | "Optional Final Revision"
        }}
      ],
      "daily_tip": "string"
    }}
  ]
}}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2
            )
        )

        raw_text = response.text.strip()
        data = json.loads(raw_text)

        # Parse into Pydantic models for validation
        plan_resp = StudyPlanResponse(
            plan_summary=data.get("plan_summary", "Personalized study plan generated by Gemini AI."),
            warning=data.get("warning") or (" | ".join(warning_notes) if warning_notes else None),
            total_days=int(data.get("total_days", len(data.get("daily_schedule", [])))),
            total_hours=float(data.get("total_hours", 0.0)),
            subject_distribution=[SubjectDistribution(**item) for item in data.get("subject_distribution", [])],
            daily_schedule=[DailySchedule(**item) for item in data.get("daily_schedule", [])],
            source="gemini"
        )
        return plan_resp

    except Exception as e:
        # If Gemini call fails (e.g. rate limit or network issue), fall back to smart mock generator gracefully
        mock_result = generate_mock_plan(payload)
        mock_result.plan_summary = f"[Gemini Notice: {str(e)[:100]}...] Showing local algorithmic study plan:"
        return mock_result


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
