import io
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))
import main
from fastapi import HTTPException, UploadFile

# Read valid sample resume PDF
with open(os.path.join(os.path.dirname(__file__), "sample_resume.pdf"), "rb") as f:
    SAMPLE_RESUME_PDF = f.read()

SAMPLE_JOB_DESC = """
Job Title: Junior Data Scientist
Requirements:
- Strong proficiency in Python and SQL for data analysis.
- Experience with NumPy, Pandas, and data visualization (Matplotlib/Seaborn).
- Foundational understanding of Machine Learning algorithms (regression, classification).
- Solid grasp of statistics and probability.
- Familiarity with A/B testing and Docker is a plus.
"""

def test_health():
    h = main.health_check()
    assert h.status == "ok"
    assert "CareerMatch AI" in h.service
    print("[PASS] 1. Health check endpoint reports live status and service name.")

def test_demo_analysis():
    demo = main.get_demo_analysis()
    assert demo.is_demo is True
    assert demo.demo_badge == "Demo Data — Not a live AI analysis"
    assert demo.match_score == 78
    assert len(demo.matching_skills) >= 5
    assert len(demo.missing_skills) >= 2
    assert len(demo.project_recommendations) >= 2
    assert len(demo.learning_roadmap) >= 2
    print("[PASS] 2. Demo analysis endpoint returns complete judge-friendly sample data.")

def test_pdf_extraction():
    text = main.extract_text_from_pdf_bytes(SAMPLE_RESUME_PDF)
    assert "Priya Sharma" in text
    assert "Python" in text
    assert "SQL" in text
    assert len(text) > 200
    print(f"[PASS] 3. In-memory PDF text extraction succeeded ({len(text)} characters).")

def test_corrupted_pdf_rejection():
    try:
        main.extract_text_from_pdf_bytes(b"garbage content not a pdf")
        assert False, "Should raise HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        print("[PASS] 4. Corrupted / unreadable PDF is rejected with HTTP 400.")

def test_short_job_desc():
    mock_file = UploadFile(filename="resume.pdf", file=io.BytesIO(SAMPLE_RESUME_PDF))
    try:
        main.analyze_match(resume=mock_file, job_description="too short")
        assert False, "Should raise HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        assert "job description is too short" in e.detail.lower()
        print("[PASS] 5. Short / empty job description (<30 chars) is rejected with HTTP 400.")

def test_non_pdf_rejection():
    mock_file = UploadFile(filename="resume.docx", file=io.BytesIO(b"word document text"))
    try:
        main.analyze_match(resume=mock_file, job_description=SAMPLE_JOB_DESC)
        assert False, "Should raise HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        assert "only pdf" in e.detail.lower()
        print("[PASS] 6. Non-PDF file upload is rejected with HTTP 400.")

def test_oversized_file_rejection():
    big_bytes = b"X" * (6 * 1024 * 1024)
    mock_file = UploadFile(filename="oversized.pdf", file=io.BytesIO(big_bytes))
    try:
        main.analyze_match(resume=mock_file, job_description=SAMPLE_JOB_DESC)
        assert False, "Should raise HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        assert "exceeds the 5 mb limit" in e.detail.lower()
        print("[PASS] 7. File exceeding 5 MB limit is rejected with HTTP 400.")

def test_missing_api_key_handling():
    mock_file = UploadFile(filename="resume.pdf", file=io.BytesIO(SAMPLE_RESUME_PDF))
    if not os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") in ["your_actual_api_key", "your_gemini_api_key_here"]:
        try:
            main.analyze_match(resume=mock_file, job_description=SAMPLE_JOB_DESC)
            assert False, "Should raise HTTPException"
        except HTTPException as e:
            assert e.status_code == 503
            assert "ai service is not configured" in e.detail.lower() or "gemini api is not configured" in e.detail.lower()
            print("[PASS] 8. Unset backend API key returns clear HTTP 503 configuration error.")
    else:
        print("[INFO] 8. Backend API key is configured in environment.")

def test_response_schema_validation():
    sample_response = main.AnalyzeMatchResponse(
        match_score=82,
        score_breakdown=main.ScoreBreakdown(
            technical_skills=85,
            experience_alignment=75,
            education_foundations=90
        ),
        summary="Candidate possesses solid foundations in Python, SQL, and data analysis.",
        matching_skills=["Python", "SQL", "NumPy", "Pandas", "Matplotlib"],
        missing_skills=["Docker", "A/B Testing"],
        improvement_skills=["Machine Learning Deployment"],
        resume_suggestions=["Quantify customer churn model metrics and business impact."],
        project_recommendations=[
            main.ProjectRecommendation(
                title="Customer Churn Prediction Pipeline",
                description="End-to-end classification pipeline using Scikit-Learn and SQL.",
                skills_demonstrated=["Machine Learning", "SQL", "Scikit-Learn"]
            )
        ],
        learning_roadmap=[
            main.RoadmapPhase(
                phase="Phase 1: High Priority",
                focus="Statistical A/B Testing & Hypothesis Testing",
                action_items=["Complete A/B testing tutorials", "Simulate two-sample hypothesis test"]
            )
        ]
    )
    dumped = sample_response.model_dump()
    assert dumped["match_score"] == 82
    assert len(dumped["matching_skills"]) == 5
    assert len(dumped["missing_skills"]) == 2
    assert "algorithmic estimate" in dumped["disclaimer"].lower()
    print("[PASS] 9. Full response schema validates and serializes correctly.")

if __name__ == "__main__":
    print("--- Starting CareerMatch AI Backend Test Suite ---")
    test_health()
    test_demo_analysis()
    test_pdf_extraction()
    test_corrupted_pdf_rejection()
    test_short_job_desc()
    test_non_pdf_rejection()
    test_oversized_file_rejection()
    test_missing_api_key_handling()
    test_response_schema_validation()
    print("--- ALL 9 TESTS PASSED WITH ZERO VIOLATIONS ---")
