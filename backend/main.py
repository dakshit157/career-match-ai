import io
import os
import json
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import pypdf

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CareerMatch AI API",
    description="AI-Powered Resume and Job Match Analyzer Backend powered by Google Gemini",
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

MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


# --- Schemas ---

class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_configured: bool


class ProjectRecommendation(BaseModel):
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Short overview of what to build")
    skills_demonstrated: List[str] = Field(default_factory=list, description="Skills highlighted by this project")


class RoadmapPhase(BaseModel):
    phase: str = Field(..., description="e.g. Phase 1: High Priority (Week 1-2)")
    focus: str = Field(..., description="Focus area or technology")
    action_items: List[str] = Field(default_factory=list, description="Specific learning actions")


class ScoreBreakdown(BaseModel):
    technical_skills: int = Field(..., ge=0, le=100)
    experience_alignment: int = Field(..., ge=0, le=100)
    education_foundations: int = Field(..., ge=0, le=100)


class AnalyzeMatchResponse(BaseModel):
    match_score: int = Field(..., ge=0, le=100, description="Overall match score from 0 to 100")
    score_breakdown: Optional[ScoreBreakdown] = None
    summary: str = Field(..., description="Concise assessment of candidate fit and strengths")
    matching_skills: List[str] = Field(default_factory=list, description="Skills validated by resume")
    missing_skills: List[str] = Field(default_factory=list, description="Required job skills missing from resume")
    improvement_skills: List[str] = Field(default_factory=list, description="Skills to strengthen or provide more proof for")
    resume_suggestions: List[str] = Field(default_factory=list, description="Actionable, truthful resume improvements")
    project_recommendations: List[ProjectRecommendation] = Field(default_factory=list)
    learning_roadmap: List[RoadmapPhase] = Field(default_factory=list)
    disclaimer: str = Field(
        default="This match score is an algorithmic estimate based on the provided text, not a probability or guarantee of employment."
    )


# --- Helper: In-memory PDF text extraction ---

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        if len(reader.pages) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF contains no pages."
            )

        extracted_text = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_text.append(page_text.strip())

        full_text = "\n\n".join(extracted_text).strip()
        if len(full_text) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Could not extract readable text from the uploaded PDF. "
                    "The file might be scanned, image-only, password-protected, or blank. "
                    "Please upload a standard text-based PDF resume."
                )
            )
        return full_text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read PDF file: {str(e)}. Please ensure the file is an uncorrupted PDF document."
        )


# --- Endpoints ---

@app.get("/health", response_model=HealthResponse)
def health_check():
    api_key = os.getenv("GEMINI_API_KEY", "")
    is_gemini_configured = bool(api_key and api_key != "your_actual_api_key" and len(api_key.strip()) > 5)
    return HealthResponse(
        status="ok",
        service="CareerMatch AI Backend (FastAPI)",
        gemini_configured=is_gemini_configured
    )


@app.post("/api/analyze-match", response_model=AnalyzeMatchResponse)
def analyze_match(
    resume: UploadFile = File(..., description="PDF Resume file (max 5 MB)"),
    job_description: str = Form(..., description="Text of the job description")
):
    # 1. Validate Job Description
    clean_job_desc = job_description.strip()
    if len(clean_job_desc) < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The job description is too short. Please provide at least 30 characters of the target job description."
        )

    # 2. Validate Resume File Metadata
    filename = resume.filename or ""
    if not (filename.lower().endswith(".pdf") or resume.content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported. Please upload a .pdf resume."
        )

    # 3. Read File Bytes into Memory & Validate Size
    pdf_bytes = resume.file.read()
    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume file size exceeds the 5 MB limit. Please upload a smaller PDF."
        )

    # 4. Extract Resume Text in-memory
    resume_text = extract_text_from_pdf_bytes(pdf_bytes)

    # 5. Check Gemini API Key
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_gemini_configured = bool(api_key and api_key != "your_actual_api_key" and len(api_key) > 5)
    if not is_gemini_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Google Gemini API key is not configured. "
                "To enable real AI resume analysis, add your GEMINI_API_KEY to backend/.env and restart the backend."
            )
        )

    # 6. Analyze via Google Gemini 2.5 Flash
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        system_instruction = (
            "You are an objective, professional career coach and technical talent acquisition expert.\n"
            "Your task is to analyze a candidate's resume text against a target job description with rigorous accuracy, truthfulness, and constructive guidance.\n\n"
            "STRICT RULES YOU MUST FOLLOW:\n"
            "1. TRUTHFULNESS: Do NOT invent qualifications, certificates, past companies, or projects that are not present in the resume.\n"
            "2. ABSENCE VS INCAPACITY: Distinguish between a skill that is simply not mentioned on the resume and a skill the candidate definitely lacks.\n"
            "3. MATCH SCORE (0 to 100): Calculate an objective score based purely on the alignment between the job requirements and the credentials in the resume. "
            "Explain that this score is an estimate based on the text provided, NOT a probability of being hired.\n"
            "4. SKILLS BREAKDOWN:\n"
            "   - matching_skills: Specific tools, skills, or concepts demonstrated by the resume that match the job description.\n"
            "   - missing_skills: Core requirements from the job description that have zero proof or mention in the resume.\n"
            "   - improvement_skills: Skills mentioned on the resume that need deeper proof, recent usage, or practical project demonstration.\n"
            "5. RESUME SUGGESTIONS: Provide honest, actionable suggestions to improve the resume (e.g. quantifying metrics, highlighting existing relevant coursework or projects) without fabricating experience.\n"
            "6. PROJECT RECOMMENDATIONS: Recommend 2-3 specific portfolio projects designed to bridge the missing skills, each with a clear title, description, and list of skills demonstrated.\n"
            "7. LEARNING ROADMAP: Provide a prioritized step-by-step learning path (Phase 1, Phase 2, etc.) to master the missing requirements.\n"
            "8. SUMMARY: Concise, honest 2-3 paragraph summary of the candidate's alignment and strengths for this specific role.\n"
            "9. OUTPUT FORMAT: Return strictly valid JSON adhering to the specified schema."
        )

        user_prompt = f"""
Candidate Resume Text:
\"\"\"
{resume_text}
\"\"\"

Target Job Description:
\"\"\"
{clean_job_desc}
\"\"\"

Analyze the resume against this job description and output a valid JSON object matching this exact structure:
{{
  "match_score": number, // integer 0-100
  "score_breakdown": {{
    "technical_skills": number, // 0-100
    "experience_alignment": number, // 0-100
    "education_foundations": number // 0-100
  }},
  "summary": "concise objective assessment string",
  "matching_skills": ["string", "string"],
  "missing_skills": ["string", "string"],
  "improvement_skills": ["string", "string"],
  "resume_suggestions": ["string", "string"],
  "project_recommendations": [
    {{
      "title": "string",
      "description": "string",
      "skills_demonstrated": ["string"]
    }}
  ],
  "learning_roadmap": [
    {{
      "phase": "string",
      "focus": "string",
      "action_items": ["string"]
    }}
  ],
  "disclaimer": "This match score is an algorithmic estimate based on the provided text, not a probability or guarantee of employment."
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

        # Parse into validated Pydantic model
        score = int(data.get("match_score", 50))
        score = max(0, min(100, score))

        breakdown_data = data.get("score_breakdown") or {}
        score_breakdown = ScoreBreakdown(
            technical_skills=max(0, min(100, int(breakdown_data.get("technical_skills", score)))),
            experience_alignment=max(0, min(100, int(breakdown_data.get("experience_alignment", score)))),
            education_foundations=max(0, min(100, int(breakdown_data.get("education_foundations", score))))
        )

        project_recs = [
            ProjectRecommendation(**p) for p in data.get("project_recommendations", [])
        ]
        learning_roadmap = [
            RoadmapPhase(**r) for r in data.get("learning_roadmap", [])
        ]

        return AnalyzeMatchResponse(
            match_score=score,
            score_breakdown=score_breakdown,
            summary=data.get("summary", "Analysis completed based on the provided resume and job description."),
            matching_skills=data.get("matching_skills", []),
            missing_skills=data.get("missing_skills", []),
            improvement_skills=data.get("improvement_skills", []),
            resume_suggestions=data.get("resume_suggestions", []),
            project_recommendations=project_recs,
            learning_roadmap=learning_roadmap,
            disclaimer=data.get(
                "disclaimer",
                "This match score is an algorithmic estimate based on the provided text, not a probability or guarantee of employment."
            )
        )

    except json.JSONDecodeError as jde:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI model returned malformed output: {str(jde)}. Please retry the analysis."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API request failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
