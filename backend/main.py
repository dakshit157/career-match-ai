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
    session_type: str = Field("Deep Study", description="'Deep Study', 'Revision', or 'Practice / Questions'")


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


# --- Mock Plan Generator (Fallback when API key is not configured) ---

def generate_mock_plan(payload: StudyPlanRequest) -> StudyPlanResponse:
    try:
        start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    except ValueError:
        start_dt = datetime.now()

    # Find maximum exam date
    exam_dates = []
    for s in payload.subjects:
        try:
            exam_dates.append(datetime.strptime(s.exam_date, "%Y-%m-%d"))
        except ValueError:
            pass

    last_exam = max(exam_dates) if exam_dates else start_dt + timedelta(days=10)
    total_days = max(1, min(28, (last_exam - start_dt).days + 1))
    total_hours = round(total_days * payload.daily_hours, 1)

    # Calculate hours distribution
    weights = {"Hard": 3.0, "Medium": 2.0, "Easy": 1.0}
    total_weight = sum(weights.get(s.difficulty, 2.0) for s in payload.subjects) or 1.0

    distributions = []
    for s in payload.subjects:
        w = weights.get(s.difficulty, 2.0)
        alloc = round((w / total_weight) * total_hours, 1)
        distributions.append(SubjectDistribution(subject=s.name, allocated_hours=alloc, difficulty=s.difficulty))

    # Build daily schedule
    daily_schedule = []
    num_subjects = len(payload.subjects)

    for d in range(total_days):
        current_date = start_dt + timedelta(days=d)
        date_str = current_date.strftime("%Y-%m-%d")

        # Pick 1 or 2 subjects for the day
        s1 = payload.subjects[d % num_subjects]
        s2 = payload.subjects[(d + 1) % num_subjects] if num_subjects > 1 and payload.daily_hours >= 4 else None

        sessions = []
        # Check if tomorrow is exam day for any subject
        tomorrow_str = (current_date + timedelta(days=1)).strftime("%Y-%m-%d")
        exam_tomorrow = next((s for s in payload.subjects if s.exam_date == tomorrow_str), None)

        if exam_tomorrow:
            day_theme = f"Final Exam Revision for {exam_tomorrow.name}"
            sessions.append(StudySession(
                subject=exam_tomorrow.name,
                hours=payload.daily_hours,
                focus_topic="Formula sheets, previous year exam questions, and weak-spot review",
                session_type="Revision"
            ))
            tip = f"Rest early tonight! You've prepared well for {exam_tomorrow.name}."
        elif s2:
            h1 = round(payload.daily_hours * 0.6, 1)
            h2 = round(payload.daily_hours - h1, 1)
            day_theme = f"Deep Dive: {s1.name} & Practice: {s2.name}"
            sessions.append(StudySession(
                subject=s1.name,
                hours=h1,
                focus_topic=f"Core conceptual foundations & textbook problems ({s1.difficulty} focus)",
                session_type="Deep Study"
            ))
            sessions.append(StudySession(
                subject=s2.name,
                hours=h2,
                focus_topic=f"Problem solving and quick concept notes",
                session_type="Practice / Questions"
            ))
            tip = "Use the 50/10 Pomodoro technique: study 50 minutes, break for 10 minutes."
        else:
            day_theme = f"Deep Work on {s1.name}"
            sessions.append(StudySession(
                subject=s1.name,
                hours=payload.daily_hours,
                focus_topic=f"Intensive module coverage and notes synthesis",
                session_type="Deep Study"
            ))
            tip = "Summarize the key algorithms/formulas in your own words at the end of the day."

        daily_schedule.append(DailySchedule(
            day_number=d + 1,
            date=date_str,
            day_theme=day_theme,
            sessions=sessions,
            daily_tip=tip
        ))

    summary = (
        f"[Demo Simulation] Generated a balanced {total_days}-day study plan covering {num_subjects} subjects "
        f"across {total_hours} total hours. Add your GEMINI_API_KEY to backend/.env for AI-personalized insights!"
    )

    return StudyPlanResponse(
        plan_summary=summary,
        total_days=total_days,
        total_hours=total_hours,
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

    api_key = os.getenv("GEMINI_API_KEY")
    is_gemini_configured = bool(api_key and api_key != "your_gemini_api_key_here" and len(api_key.strip()) > 5)

    if not is_gemini_configured:
        # Fallback cleanly to built-in smart mock generator
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

        system_instruction = (
            "You are an expert academic tutor and university study strategist. "
            "Your task is to generate a personalized, realistic, day-by-day study schedule for a college student preparing for exams.\n"
            "Guidelines:\n"
            "1. Proximity: Prioritize subjects with earlier exam dates.\n"
            "2. Difficulty: Allocate more hours and earlier focus to 'Hard' subjects.\n"
            "3. Revision: The day immediately prior to an exam should focus heavily on revision for that subject.\n"
            "4. Daily balance: Daily session hours must add up to the student's daily available study hours.\n"
            "5. Topics: Provide realistic, actionable academic topic focus for each session.\n"
            "6. Output format: You MUST return strictly valid JSON matching the requested schema."
        )

        user_prompt = f"""
Student Study Plan Request:
- Start Date: {payload.start_date}
- Daily Study Hours Available: {payload.daily_hours} hours/day
- Subjects:
{subjects_desc}

Generate a complete day-by-day study schedule from the start date up to the final exam date.
Output must be a valid JSON object with these exact keys:
{{
  "plan_summary": "string summarizing the overall strategy",
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
          "session_type": "Deep Study" | "Revision" | "Practice / Questions"
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
                temperature=0.3
            )
        )

        raw_text = response.text.strip()
        data = json.loads(raw_text)

        # Parse into Pydantic models for validation
        return StudyPlanResponse(
            plan_summary=data.get("plan_summary", "Personalized study plan generated by Gemini AI."),
            total_days=int(data.get("total_days", len(data.get("daily_schedule", [])))),
            total_hours=float(data.get("total_hours", 0.0)),
            subject_distribution=[SubjectDistribution(**item) for item in data.get("subject_distribution", [])],
            daily_schedule=[DailySchedule(**item) for item in data.get("daily_schedule", [])],
            source="gemini"
        )

    except Exception as e:
        # If Gemini call fails (e.g. rate limit or network issue), fall back to mock gracefully with error note
        mock_result = generate_mock_plan(payload)
        mock_result.plan_summary = f"[Gemini Notice: {str(e)[:100]}...] Showing local algorithmic study plan:"
        return mock_result


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
