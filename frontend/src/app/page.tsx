"use client";

import { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Award,
  FileCheck,
  RotateCcw,
  Code2,
  PlayCircle,
  Info
} from "lucide-react";

interface ProjectRecommendation {
  title: string;
  description: string;
  skills_demonstrated: string[];
}

interface RoadmapPhase {
  phase: string;
  focus: string;
  action_items: string[];
}

interface ScoreBreakdown {
  technical_skills: number;
  experience_alignment: number;
  education_foundations: number;
}

interface AnalyzeMatchResponse {
  match_score: number;
  score_breakdown?: ScoreBreakdown;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  improvement_skills: string[];
  resume_suggestions: string[];
  project_recommendations: ProjectRecommendation[];
  learning_roadmap: RoadmapPhase[];
  is_demo?: boolean;
  demo_badge?: string;
  disclaimer: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SAMPLE_JOB_DESCRIPTION = `Job Title: Junior Data Scientist
Location: Remote / Hybrid

About the Role:
We are seeking an enthusiastic Junior Data Scientist to join our analytics and machine learning team. You will work on real-world datasets, build predictive models, and communicate data-driven insights to product stakeholders.

Key Responsibilities:
- Write clean, maintainable Python code for data ingestion, cleaning, and transformation.
- Query and aggregate large relational datasets using SQL.
- Perform exploratory data analysis (EDA) using NumPy, Pandas, Matplotlib, and Seaborn.
- Develop, evaluate, and tune baseline machine learning models (Regression, Random Forests, Classification).
- Apply statistical methods (hypothesis testing, probability distributions, A/B testing fundamentals).
- Create intuitive data visualizations and dashboards to present analytical findings to non-technical teams.

Qualifications:
- Bachelor's degree in Computer Science, Information Technology, Statistics, or related technical field.
- Demonstrated hands-on proficiency in Python and SQL through coursework, internships, or personal projects.
- Familiarity with core ML concepts, Scikit-Learn, and statistical analysis.
- Eager to learn, solve complex data problems, and collaborate in an agile environment.`;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalyzeMatchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Backend Health Status
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBackendStatus("connected");
        setGeminiConfigured(Boolean(data.gemini_configured));
      } else {
        setBackendStatus("disconnected");
      }
    } catch {
      setBackendStatus("disconnected");
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setFileError("Please upload a PDF document (.pdf).");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size exceeds 5 MB. Please choose a smaller PDF resume.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const loadSampleJob = () => {
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
  };

  // Run Real AI Analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage("Please select a PDF resume to analyze.");
      return;
    }

    if (jobDescription.trim().length < 30) {
      setErrorMessage("Please paste a job description with at least 30 characters.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);
      formData.append("job_description", jobDescription.trim());

      const res = await fetch(`${API_BASE_URL}/api/analyze-match`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Analysis request failed." }));
        throw new Error(errorData.detail || `Server responded with error status ${res.status}`);
      }

      const data: AnalyzeMatchResponse = await res.json();
      setAnalysis(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Run Demo Analysis (No Key Required for Judges)
  const handleRunDemo = async () => {
    setErrorMessage(null);
    setDemoLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/demo-analysis`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not retrieve sample demo analysis.");
      }
      const data: AnalyzeMatchResponse = await res.json();
      setAnalysis(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load sample demo data.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setErrorMessage(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                CareerMatch AI
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Resume & Job Analyzer
              </span>
            </div>
          </div>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Backend:</span>
              {backendStatus === "checking" && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                </span>
              )}
              {backendStatus === "connected" && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              )}
              {backendStatus === "disconnected" && (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
              <button onClick={checkHealth} title="Refresh connection" className="text-slate-400 hover:text-white ml-1">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {backendStatus === "connected" && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className={geminiConfigured ? "text-emerald-400" : "text-amber-400"}>
                  {geminiConfigured ? "Gemini AI Active" : "Demo Mode"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Devpost Build With AI: Basics Hackathon
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Bridge the Gap Between Your Resume and{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Your Target Job
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Upload your PDF resume and paste any job description to discover matching vs. missing skills, actionable resume bullet-point tips, and a prioritized learning roadmap.
          </p>

          {/* Quick Demo Action for Judges */}
          {!analysis && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRunDemo}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-500/50 text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                {demoLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <PlayCircle className="w-4 h-4 text-indigo-400" />
                )}
                <span>Try Demo Analysis (Instant Sample — No Key Required)</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">Analysis Notice</p>
                <p className="text-rose-300/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {selectedFile && jobDescription.trim().length >= 30 && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? "Retrying..." : "Retry Analysis"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRunDemo}
                disabled={demoLoading}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Try Demo Instead
              </button>
            </div>
          </div>
        )}

        {/* Form View (when no analysis is displayed) */}
        {!analysis ? (
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PDF Resume Upload Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> 1. Upload Resume (PDF)
                    </label>
                    <span className="text-xs text-slate-500">Max size: 5 MB</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Upload your standard text-based PDF resume. Resumes are processed in-memory and never permanently stored.
                  </p>
                </div>

                {/* Dropzone container */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    selectedFile
                      ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-400"
                      : "border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 hover:bg-slate-950"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-100">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium underline transition-colors"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          Click to browse or drop your PDF resume
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Accepts .pdf format up to 5 MB</p>
                      </div>
                    </>
                  )}
                </div>

                {fileError && (
                  <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 shrink-0" /> {fileError}
                  </p>
                )}

                {/* Privacy Badge */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>In-Memory Processing: Your resume text is parsed in RAM and not stored on disk.</span>
                </div>
              </div>

              {/* Job Description Input Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" /> 2. Paste Job Description
                    </label>
                    <button
                      type="button"
                      onClick={loadSampleJob}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      + Load Junior Data Scientist Sample
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Paste the target job requirements, qualifications, and role responsibilities.
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    rows={9}
                    placeholder="Paste job posting text here (responsibilities, required skills, tools, qualifications)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed"
                    required
                  />
                  <div className="text-right text-[11px] text-slate-500 mt-1">
                    {jobDescription.length} characters (min 30)
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !selectedFile || jobDescription.trim().length < 30}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/25 transition-all text-white cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Extracting resume text & analyzing match with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze My Match</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRunDemo}
                disabled={demoLoading}
                className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {demoLoading ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <PlayCircle className="w-4 h-4 text-indigo-400" />}
                <span>Try Demo Analysis</span>
              </button>
            </div>
          </form>
        ) : (
          /* Results Dashboard View */
          <div className="space-y-8 animate-fadeIn">
            {/* Top Bar with Demo Indicator & Reset Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {analysis.is_demo ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5 text-amber-400" /> Demo Data — Not a live AI analysis
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Live Gemini AI Analysis
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-100">Resume Alignment Overview</h2>
              </div>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Analyze Another Job</span>
              </button>
            </div>

            {/* Score & Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Match Score Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Match</span>
                  <Award className="w-5 h-5 text-indigo-400" />
                </div>

                {/* Big Score Display */}
                <div className="text-center py-2">
                  <div
                    className={`inline-flex items-baseline justify-center px-6 py-4 rounded-2xl border ${getScoreColor(
                      analysis.match_score
                    )} font-extrabold`}
                  >
                    <span className="text-5xl sm:text-6xl tracking-tight">{analysis.match_score}</span>
                    <span className="text-xl sm:text-2xl text-slate-400 ml-1">/100</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 font-medium">
                    {analysis.match_score >= 75
                      ? "High Match — Strong alignment with core qualifications"
                      : analysis.match_score >= 50
                      ? "Moderate Match — Foundational overlap with actionable skill gaps"
                      : "Developing Match — Significant gaps in stated job requirements"}
                  </p>
                </div>

                {/* Score Breakdown Bars */}
                {analysis.score_breakdown && (
                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                    <span className="font-semibold text-slate-300 block">Category Alignment:</span>
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Technical Skills</span>
                        <span className="font-mono">{analysis.score_breakdown.technical_skills}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreBarColor(analysis.score_breakdown.technical_skills)}`}
                          style={{ width: `${analysis.score_breakdown.technical_skills}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Experience Alignment</span>
                        <span className="font-mono">{analysis.score_breakdown.experience_alignment}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreBarColor(analysis.score_breakdown.experience_alignment)}`}
                          style={{ width: `${analysis.score_breakdown.experience_alignment}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Education & Fundamentals</span>
                        <span className="font-mono">{analysis.score_breakdown.education_foundations}%</span>
                      </div>
                      <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreBarColor(analysis.score_breakdown.education_foundations)}`}
                          style={{ width: `${analysis.score_breakdown.education_foundations}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment Summary Card */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-slate-100">Candidate Strength & Alignment Assessment</h3>
                  </div>
                  <div className="mt-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {analysis.summary}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Disclaimer: </span>
                  {analysis.disclaimer}
                </div>
              </div>
            </div>

            {/* Skills Alignment Breakdown (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Matching Skills */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Matching Skills</h4>
                    <p className="text-[11px] text-slate-400">Validated by your resume</p>
                  </div>
                </div>

                {analysis.matching_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.matching_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct matching skills detected.</p>
                )}
              </div>

              {/* 2. Missing Skills */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Missing / Unproven</h4>
                    <p className="text-[11px] text-slate-400">Required by job description</p>
                  </div>
                </div>

                {analysis.missing_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No critical missing skills found.</p>
                )}
              </div>

              {/* 3. Skills to Improve */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Skills to Strengthen</h4>
                    <p className="text-[11px] text-slate-400">Needs deeper project proof</p>
                  </div>
                </div>

                {analysis.improvement_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.improvement_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5"
                      >
                        <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Skills demonstrated appear sufficient.</p>
                )}
              </div>
            </div>

            {/* Resume Improvement Suggestions */}
            {analysis.resume_suggestions.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-100">Actionable Resume Suggestions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.resume_suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Projects to Demonstrate Skills */}
            {analysis.project_recommendations.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-100">Recommended Portfolio Projects</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.project_recommendations.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          {proj.title}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                      </div>

                      {proj.skills_demonstrated.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900">
                          {proj.skills_demonstrated.map((sk, sidx) => (
                            <span
                              key={sidx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-500/20"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized Learning Roadmap */}
            {analysis.learning_roadmap.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-100">Prioritized Learning Roadmap</h3>
                </div>

                <div className="space-y-3">
                  {analysis.learning_roadmap.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {step.phase}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{step.focus}</span>
                        </div>
                        {step.action_items.length > 0 && (
                          <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5 mt-1">
                            {step.action_items.map((action, aidx) => (
                              <li key={aidx}>{action}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>CareerMatch AI • Devpost Build With AI: Basics Hackathon Submission</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-slate-600">FastAPI • Next.js • Google Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
