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

# Configure CORS (allow frontend in dev and deployed environments)
cors_origins_env = os.getenv("CORS_ORIGIN", "http://localhost:3000")
origins = [
    origin.strip() for origin in cors_origins_env.split(",") if origin.strip()
]
# Default local origins
for local_origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
    if local_origin not in origins:
        origins.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
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
    is_demo: bool = Field(default=False, description="Flag indicating if this is sample demo data")
    demo_badge: Optional[str] = Field(default=None, description="Display label for demo data")
    disclaimer: str = Field(
        default="This match score is an algorithmic estimate based on the provided text, not a probability or guarantee of employment."
    )


# --- Demo Data Generator (For Judges & Evaluation without Gemini API Key) ---

def get_sample_demo_analysis() -> AnalyzeMatchResponse:
    """Returns a realistic pre-computed analysis for the sample Junior Data Scientist profile."""
    return AnalyzeMatchResponse(
        match_score=78,
        score_breakdown=ScoreBreakdown(
            technical_skills=84,
            experience_alignment=72,
            education_foundations=88
        ),
        summary=(
            "Candidate Priya Sharma demonstrates strong alignment with core Python programming, SQL querying, "
            "and exploratory data analysis using Pandas and Matplotlib. Her B.Tech coursework provides a solid foundation "
            "in statistics, probability, and database management. To become an even stronger candidate for this Junior Data Scientist role, "
            "she should bridge the gap in model deployment, expand her practical machine learning portfolio, "
            "and acquire hands-on experience with A/B testing and containerization."
        ),
        matching_skills=[
            "Python Programming",
            "Relational Database Querying (SQL)",
            "NumPy & Pandas",
            "Exploratory Data Analysis (EDA)",
            "Data Visualization (Matplotlib & Seaborn)",
            "Probability & Statistics Fundamentals",
            "Supervised Machine Learning Concepts"
        ],
        missing_skills=[
            "A/B Testing & Online Experimentation",
            "Docker Containerization",
            "Cloud Data Ingestion (AWS/GCP)"
        ],
        improvement_skills=[
            "End-to-End ML Pipeline Deployment (Needs production API proof)",
            "Model Evaluation Metrics (ROC-AUC, Precision-Recall curve trade-offs)"
        ],
        resume_suggestions=[
            "Quantify the business impact of your customer churn project (e.g., 'Processed 50,000 customer records with an 84% classification accuracy').",
            "Add a dedicated 'Technical Skills' summary highlighting Scikit-Learn, Pandas, and SQL window functions near the top.",
            "Include links to your public GitHub repositories showcasing your exploratory data analysis notebooks.",
            "Explicitly mention statistical hypothesis testing techniques applied during academic coursework."
        ],
        project_recommendations=[
            ProjectRecommendation(
                title="End-to-End Customer Churn API with FastAPI & Scikit-Learn",
                description="Upgrade your churn analysis model into a production REST API that accepts customer attributes and serves real-time predictions with automated model evaluation metrics.",
                skills_demonstrated=["Python", "Machine Learning", "FastAPI", "Scikit-Learn"]
            ),
            ProjectRecommendation(
                title="E-Commerce A/B Testing & Conversion Analytics Simulation",
                description="Simulate and analyze an e-commerce user conversion experiment using Python (SciPy/Statsmodels), computing two-sample t-tests, p-values, and visualizing statistical significance.",
                skills_demonstrated=["Statistics", "A/B Testing", "Pandas", "Data Visualization"]
            )
        ],
        learning_roadmap=[
            RoadmapPhase(
                phase="Phase 1: High Priority (Week 1–2)",
                focus="Statistical Hypothesis Testing & A/B Experimentation",
                action_items=[
                  "Study two-sample t-tests, chi-squared tests, and confidence intervals in Python with SciPy.",
                  "Implement an A/B testing evaluation notebook comparing conversion rates on simulated user cohorts."
                ]
            ),
            RoadmapPhase(
                phase="Phase 2: Moderate Priority (Week 3–4)",
                focus="Model Evaluation Depth & Basic Docker Containerization",
                action_items=[
                  "Master cross-validation, precision-recall trade-offs, and confusion matrices.",
                  "Package a Python data processing script into a lightweight Docker container."
                ]
            )
        ],
        is_demo=True,
        demo_badge="Demo Data — Not a live AI analysis",
        disclaimer="Demo Data — Not a live AI analysis. This match score is an illustrative estimate based on the sample job requirements, not a guarantee of employment."
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
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_gemini_configured = bool(api_key and api_key != "your_actual_api_key" and api_key != "your_gemini_api_key_here" and len(api_key) > 5)
    return HealthResponse(
        status="ok",
        service="CareerMatch AI Backend (FastAPI)",
        gemini_configured=is_gemini_configured
    )


@app.get("/api/demo-analysis", response_model=AnalyzeMatchResponse)
def get_demo_analysis():
    """Returns instant sample demo data so hackathon judges can explore the complete analysis without needing an API key."""
    return get_sample_demo_analysis()


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

    # 5. Check Gemini API Key (configured by the application owner on the backend host)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_gemini_configured = bool(api_key and api_key != "your_actual_api_key" and api_key != "your_gemini_api_key_here" and len(api_key) > 5)
    if not is_gemini_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Google Gemini API is not configured on this server instance. "
                "The application owner can set GEMINI_API_KEY in the backend host environment. "
                "You can click 'Try Demo Analysis' to explore the complete results dashboard."
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

        # Primary model requested: gemini-3.8-flash (with robust fallbacks for temporary 503 high-demand spikes)
        primary_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        candidate_models = [primary_model, "gemini-3.5-flash", "gemini-3-flash-preview"]
        # Remove duplicates while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        response = None
        last_error = None
        used_model = None

        for model_candidate in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_candidate,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                used_model = model_candidate
                break
            except Exception as model_err:
                last_error = model_err
                # Continue to next model if model is unavailable or in high-demand spike
                continue

        if response is None:
            raise last_error or Exception("Failed to generate analysis with candidate models.")

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
            is_demo=False,
            demo_badge=None,
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
            detail=f"Gemini API request failed: {str(e)}. You can click 'Try Demo Analysis' to explore the evaluation dashboard."
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
