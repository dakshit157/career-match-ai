"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  GraduationCap,
  Lightbulb,
  Layers,
  Flame,
  ArrowRight
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  exam_date: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface StudySession {
  subject: string;
  hours: number;
  focus_topic: string;
  session_type: string;
}

interface DailySchedule {
  day_number: number;
  date: string;
  day_theme: string;
  sessions: StudySession[];
  daily_tip?: string;
}

interface SubjectDistribution {
  subject: string;
  allocated_hours: number;
  difficulty: string;
}

interface StudyPlanResponse {
  plan_summary: string;
  warning?: string;
  total_days: number;
  total_hours: number;
  subject_distribution: SubjectDistribution[];
  daily_schedule: DailySchedule[];
  source: string;
}

export default function Home() {
  // Form State
  const [startDate, setStartDate] = useState<string>("");
  const [dailyHours, setDailyHours] = useState<number>(6);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "Operating Systems", exam_date: "", difficulty: "Hard" },
    { id: "2", name: "Computer Networks", exam_date: "", difficulty: "Medium" },
  ]);

  // Loading & Plan State
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Health State
  const [backendStatus, setBackendStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [geminiConfigured, setGeminiConfigured] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await fetch("http://localhost:8000/health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBackendStatus("connected");
        setGeminiConfigured(data.gemini_configured);
      } else {
        setBackendStatus("disconnected");
      }
    } catch {
      setBackendStatus("disconnected");
    }
  };

  useEffect(() => {
    // Initialize default dates safely on client mount
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0];
    const exam1 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const exam2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    setStartDate(todayFormatted);
    setSubjects([
      { id: "1", name: "Operating Systems", exam_date: exam1, difficulty: "Hard" },
      { id: "2", name: "Computer Networks", exam_date: exam2, difficulty: "Medium" },
    ]);

    checkHealth();
  }, []);

  // Subject Handlers
  const addSubject = () => {
    const nextDate = new Date(Date.now() + (12 + subjects.length * 3) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    setSubjects((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: "",
        exam_date: nextDate,
        difficulty: "Medium",
      },
    ]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Generate Plan Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const emptySubject = subjects.find((s) => !s.name.trim());
    if (emptySubject) {
      setError("Please fill in names for all subjects.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          daily_hours: Number(dailyHours),
          subjects: subjects.map(({ name, exam_date, difficulty }) => ({
            name: name.trim(),
            exam_date,
            difficulty,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Failed to generate plan" }));
        throw new Error(err.detail || "Server error");
      }

      const data = await res.json();
      setPlan(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not connect to backend server");
    } finally {
      setLoading(false);
    }
  };

  // Copy Plan Text
  const handleCopy = () => {
    if (!plan) return;
    let text = `📅 StudyMate AI Plan\n${plan.plan_summary}\n\nTotal: ${plan.total_days} Days | ${plan.total_hours} Hours\n\n`;
    plan.daily_schedule.forEach((day) => {
      text += `--- Day ${day.day_number} (${day.date}) ---\n`;
      text += `Theme: ${day.day_theme}\n`;
      day.sessions.forEach((s) => {
        text += `• [${s.session_type}] ${s.subject}: ${s.hours}h - ${s.focus_topic}\n`;
      });
      if (day.daily_tip) text += `Tip: ${day.daily_tip}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
                StudyMate AI
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Smart Study Planner
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
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live
                </span>
              )}
              {backendStatus === "disconnected" && (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
              <button onClick={checkHealth} title="Refresh connection" className="text-slate-400 hover:text-white">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {backendStatus === "connected" && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span className={geminiConfigured ? "text-emerald-400" : "text-amber-400"}>
                  {geminiConfigured ? "Gemini 2.5 Flash" : "Demo Mode"}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Devpost Build With AI: Basics
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop Guessing, Start Studying with{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              AI Precision
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            Enter your subjects, exam dates, and daily study capacity. Gemini AI balances your schedule, priorities, and revision cycles.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-400" /> Plan Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              {/* Daily Hours Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-400" /> Available Daily Study Hours
                  </label>
                  <span className="text-sm font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/20">
                    {dailyHours} hrs / day
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>1 hr (Light review)</span>
                  <span>6 hrs (Recommended)</span>
                  <span>14 hrs (Intensive)</span>
                </div>
              </div>
            </div>

            {/* Subjects List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-400" /> Your Exam Subjects & Deadlines
                </label>
                <button
                  type="button"
                  onClick={addSubject}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map((sub, index) => (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <span className="text-xs font-bold text-slate-500 w-6">#{index + 1}</span>

                    {/* Subject Name */}
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Subject name (e.g., Operating Systems)"
                        value={sub.name}
                        onChange={(e) => updateSubject(sub.id, "name", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>

                    {/* Exam Date */}
                    <div className="w-full sm:w-44">
                      <input
                        type="date"
                        value={sub.exam_date}
                        onChange={(e) => updateSubject(sub.id, "exam_date", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>

                    {/* Difficulty Pill Selector */}
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {(["Easy", "Medium", "Hard"] as const).map((lvl) => {
                        const active = sub.difficulty === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => updateSubject(sub.id, "difficulty", lvl)}
                            className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                              active
                                ? lvl === "Hard"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : lvl === "Medium"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      disabled={subjects.length <= 1}
                      onClick={() => removeSubject(sub.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                      title="Remove subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition-all text-white cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI is analyzing exam dates & generating schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Personalized Study Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Generated Roadmap Display */}
        {plan && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Summary Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {plan.source === "gemini" ? "Gemini 2.5 Flash Generated" : "Demo Simulation Generated"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {plan.total_days} Days Plan • {plan.total_hours} Total Hours
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mt-1 text-slate-100">Study Roadmap Overview</h2>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Schedule"}</span>
                </button>
              </div>

              {plan.warning && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{plan.warning}</span>
                </div>
              )}

              <p className="text-sm text-slate-300 leading-relaxed">{plan.plan_summary}</p>

              {/* Subject Distribution Pills */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" /> Target Subject Allocation:
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {plan.subject_distribution.map((sd, i) => (
                    <div
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2"
                    >
                      <span className="font-semibold text-slate-200">{sd.subject}</span>
                      <span className="text-teal-400 font-mono font-bold">{sd.allocated_hours} hrs</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          sd.difficulty === "Hard"
                            ? "bg-rose-500/10 text-rose-400"
                            : sd.difficulty === "Medium"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {sd.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Schedule Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" /> Day-by-Day Study Schedule
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {plan.daily_schedule.map((day) => (
                  <div
                    key={day.day_number}
                    className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 shadow-sm transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                          Day {day.day_number}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{day.date}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-300 italic">{day.day_theme}</span>
                    </div>

                    {/* Sessions */}
                    <div className="space-y-2">
                      {day.sessions.map((sess, sidx) => (
                        <div
                          key={sidx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-100">{sess.subject}</span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  sess.session_type === "Optional Final Revision"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : sess.session_type === "Revision"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : sess.session_type === "Practice Questions"
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : sess.session_type === "Deep Study"
                                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                                }`}
                              >
                                {sess.session_type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{sess.focus_topic}</p>
                          </div>
                          <div className="sm:text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded border border-teal-500/20">
                              {sess.hours} hrs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Daily Tip */}
                    {day.daily_tip && (
                      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{day.daily_tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>StudyMate AI • Built for Devpost Build With AI: Basics Hackathon</p>
        <p className="text-slate-600 mt-1">Next.js • FastAPI • Google Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
}
