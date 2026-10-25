# Technical Specification (Spec)

## Project Title: CareerMatch AI — AI-Powered Resume & Job Match Analyzer
**Stack:** Next.js (Frontend) + FastAPI (Backend) + Google Gemini API (AI)

---

## 1. System Architecture

```text
[ Browser / Next.js Client ]
             │
             │ multipart/form-data:
             │  • resume (PDF file)
             │  • job_description (string)
             ▼
[ FastAPI Backend (Python) ]
             │
             │ 1. Validate file size (<= 5 MB) & mime type
             │ 2. Extract text in-memory via pypdf
             │ 3. Formulate structured prompt & JSON schema
             ▼
[ Google Gemini 3.8 Flash API ]
             │
             │ Validated JSON Output
             ▼
[ FastAPI Backend (Python) ]
             │
             │ Validated Pydantic Response (AnalyzeMatchResponse)
             ▼
[ Browser / Next.js Client ]
  -> Interactive Results Dashboard
```

---

## 2. API Contract Specification

### Endpoint: `POST /api/analyze-match`
- **Content-Type:** `multipart/form-data`

#### Request Parameters
- `resume`: `UploadFile` (Required, binary PDF document, <= 5 MB)
- `job_description`: `str` (Required, text of target job posting, >= 30 chars)

#### Response Schema (`AnalyzeMatchResponse`)
```json
{
  "match_score": 82,
  "score_breakdown": {
    "technical_skills": 85,
    "experience_alignment": 75,
    "education_foundations": 90
  },
  "summary": "The candidate presents strong foundations in Python and SQL with verified coursework and basic machine learning projects...",
  "matching_skills": [
    "Python",
    "SQL",
    "NumPy & Pandas",
    "Exploratory Data Analysis"
  ],
  "missing_skills": [
    "A/B Testing Methodologies",
    "Cloud Data Ingestion (AWS/GCP)"
  ],
  "improvement_skills": [
    "Machine Learning Deployment (Need end-to-end API demonstration)"
  ],
  "resume_suggestions": [
    "Add quantitative metrics to your Python data pipeline project (e.g., records processed, performance gain).",
    "Include links to your GitHub repositories highlighting SQL queries and EDA notebooks."
  ],
  "project_recommendations": [
    {
      "title": "E-Commerce Customer Churn Analysis Pipeline",
      "description": "Develop an end-to-end classification pipeline predicting customer churn using SQL for extraction and Pandas/Scikit-learn for modeling.",
      "skills_demonstrated": ["Python", "SQL", "Scikit-Learn", "Data Visualization"]
    }
  ],
  "learning_roadmap": [
    {
      "phase": "Phase 1: High Priority (Week 1-2)",
      "focus": "A/B Testing & Hypothesis Testing Fundamentals",
      "action_items": [
        "Study two-sample t-tests and p-value interpretation.",
        "Implement an A/B test simulation in Python with Pandas."
      ]
    }
  ],
  "disclaimer": "This match score is an algorithmic estimate based on the provided text, not a probability or guarantee of employment."
}
```

---

## 3. Gemini Prompt Engineering

### Prompt Strategy
1. **Model:** `gemini-3.8-flash`
2. **System Instruction:**
   - Enforce rigorous adherence to the text provided in the resume.
   - Forbid inventing credentials, certificates, or prior employment.
   - Separate missing skills (not mentioned at all) from skills that need improvement (mentioned but lacking depth).
   - Require actionable, honest resume refinement suggestions and project ideas.
3. **Response Schema Enforcement:**
   - Configured with `response_mime_type="application/json"` and `temperature=0.2` for deterministic, structured output.

---

## 4. Privacy & In-Memory Processing Guarantees
- Uploaded PDFs are read into `io.BytesIO` streams in RAM.
- No files are written to the local filesystem or a database.
- Text is sent securely to Google's Gemini API over TLS/HTTPS.
- Memory buffers are released immediately after request completion.
