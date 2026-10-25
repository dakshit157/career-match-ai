import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Devpost Hackathon API",
    description="Backend API powered by FastAPI and Google Gemini",
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

# Schemas
class GenerateRequest(BaseModel):
    prompt: str
    system_instruction: Optional[str] = None

class GenerateResponse(BaseModel):
    response: str
    source: str  # "gemini" or "mock"

class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_configured: bool


@app.get("/health", response_model=HealthResponse)
def health_check():
    api_key = os.getenv("GEMINI_API_KEY")
    is_gemini_configured = bool(api_key and api_key != "your_gemini_api_key_here" and len(api_key.strip()) > 5)
    return HealthResponse(
        status="ok",
        service="Devpost Hackathon Backend (FastAPI)",
        gemini_configured=is_gemini_configured
    )


@app.post("/api/generate", response_model=GenerateResponse)
def generate_ai(payload: GenerateRequest):
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    api_key = os.getenv("GEMINI_API_KEY")
    is_gemini_configured = bool(api_key and api_key != "your_gemini_api_key_here" and len(api_key.strip()) > 5)

    if is_gemini_configured:
        try:
            # Using Google GenAI SDK
            from google import genai
            client = genai.Client(api_key=api_key)
            
            kwargs = {}
            if payload.system_instruction:
                kwargs["config"] = {"system_instruction": payload.system_instruction}

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=payload.prompt,
                **kwargs
            )
            return GenerateResponse(response=response.text, source="gemini")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
    else:
        # Fallback simulation response when GEMINI_API_KEY is not configured yet
        mock_reply = (
            f"[Simulated AI Response - Add GEMINI_API_KEY to backend/.env to connect to Gemini 2.5]\n\n"
            f"Echoing your prompt: '{payload.prompt}'\n\n"
            f"Your full-stack Devpost hackathon template is working properly end-to-end!"
        )
        return GenerateResponse(response=mock_reply, source="mock")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
