# 🚀 Full-Stack AI Devpost Hackathon Project

A full-stack, hackathon-ready template powered by **Next.js (React / TypeScript / Tailwind CSS)** on the frontend and **FastAPI (Python / Uvicorn)** on the backend, with out-of-the-box integration with the **Google Gemini API** (`google-genai`).

---

## 📁 Project Structure

```text
Devpost Project/
├── backend/
│   ├── .venv/                 # Python virtual environment
│   ├── .env                   # Backend environment variables (Gemini API Key)
│   ├── .env.example           # Example environment variables
│   ├── main.py                # FastAPI application & AI endpoints
│   └── requirements.txt       # Python dependencies (FastAPI, google-genai, etc.)
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── layout.tsx     # App layout & styling
│   │       ├── page.tsx       # Interactive AI Dashboard & health checks
│   │       └── globals.css    # Tailwind CSS
│   ├── package.json           # Frontend dependencies (Next.js, Tailwind, Lucide)
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## ⚡ Getting Started

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```

2. Activate the Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```

3. Configure your API key:
   - Open `backend/.env`
   - Set your `GEMINI_API_KEY`:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
   *(Get your free API key at [Google AI Studio](https://aistudio.google.com/))*

   > **Note**: Even without an API key, the backend has a simulation mode enabled so you can test frontend-to-backend communication immediately!

4. Start the FastAPI server:
   ```bash
   python main.py
   ```
   Backend will run at: **`http://localhost:8000`**  
   Interactive API Docs (Swagger): **`http://localhost:8000/docs`**

---

### 2. Frontend Setup (Next.js)

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at **`http://localhost:3000`**.

---

## 🛠 Features

- **Next.js 16 + React 19 + TypeScript**: Modern React App Router architecture.
- **Tailwind CSS**: Sleek dark-mode aesthetic with Lucide icons.
- **FastAPI Backend**: Asynchronous, high-performance Python API.
- **Preconfigured CORS**: Ready for seamless cross-origin requests between port 3000 and 8000.
- **Google GenAI SDK**: Ready for `gemini-2.5-flash` or custom models.
- **Graceful Fallback Mode**: Works instantly out of the box even before adding API keys.
- **Live Health Status**: Frontend automatically checks backend connectivity and Gemini status.

---

## 🏆 Devpost Submission Checklist

1. [ ] **Title & Elevator Pitch**: Concise summary of what problem your project solves.
2. [ ] **Video Demo**: 2–3 minute video demonstrating user workflow and AI responses.
3. [ ] **Architecture Diagram**: Visual diagram of your frontend, backend, and Gemini models.
4. [ ] **Public GitHub Repo**: Push code and ensure no secret `.env` keys are committed!
