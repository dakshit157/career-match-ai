"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Code2, 
  Cpu, 
  ExternalLink,
  Lightbulb,
  Rocket
} from "lucide-react";

interface HealthState {
  status: "connected" | "disconnected" | "checking";
  serviceName?: string;
  geminiConfigured?: boolean;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [backendHealth, setBackendHealth] = useState<HealthState>({
    status: "checking",
  });

  const checkHealth = async () => {
    setBackendHealth({ status: "checking" });
    try {
      const res = await fetch("http://localhost:8000/health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBackendHealth({
          status: "connected",
          serviceName: data.service,
          geminiConfigured: data.gemini_configured,
        });
      } else {
        setBackendHealth({ status: "disconnected" });
      }
    } catch {
      setBackendHealth({ status: "disconnected" });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleGenerate = async (customPrompt?: string) => {
    const textToSubmit = (customPrompt || prompt).trim();
    if (!textToSubmit) return;

    setLoading(true);
    setResponse(null);
    setSource(null);

    try {
      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSubmit,
          system_instruction: showSystemPrompt && systemInstruction ? systemInstruction : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(errData.detail || "Error generating response");
      }

      const data = await res.json();
      setResponse(data.response);
      setSource(data.source);
    } catch (err: unknown) {
      setResponse(`Error: ${err instanceof Error ? err.message : "Failed to connect to backend"}`);
      setSource("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const presetIdeas = [
    "Brainstorm 3 winning features for our Devpost hackathon project",
    "Draft a compelling 2-sentence elevator pitch for our AI project",
    "Outline the architecture & tech stack highlights for our Devpost submission",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Devpost Starter Stack
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
          </div>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Backend:</span>
              {backendHealth.status === "checking" && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                </span>
              )}
              {backendHealth.status === "connected" && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live (:8000)
                </span>
              )}
              {backendHealth.status === "disconnected" && (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
              <button 
                onClick={checkHealth}
                title="Refresh Status"
                className="text-slate-400 hover:text-white transition-colors ml-1"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {backendHealth.status === "connected" && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400">Gemini SDK:</span>
                {backendHealth.geminiConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Active Key
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1" title="Set GEMINI_API_KEY in backend/.env">
                    Demo (Mock Mode)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Ready for your next Hackathon Submission
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Build Fast, Ship Faster with{" "}
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Next.js + FastAPI + Gemini
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            A production-ready full-stack template pre-wired with CORS, REST endpoints, and Google Gemini integration.
          </p>
        </div>

        {/* AI Playground Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-slate-100">Live AI Integration Playground</h2>
            </div>
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showSystemPrompt ? "Hide System Instruction" : "+ Add System Instruction"}
            </button>
          </div>

          {showSystemPrompt && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">System Instruction</label>
              <input
                type="text"
                placeholder="e.g. You are an expert hackathon mentor giving concise, practical advice."
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Prompt Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Quick Hackathon Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(idea);
                    handleGenerate(idea);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-all text-left"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Send Form */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Gemini or type a prompt for your project..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !prompt.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all text-white"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{loading ? "Generating..." : "Generate"}</span>
              </button>
            </div>
          </div>

          {/* AI Response Output */}
          {response && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                    {source === "gemini" ? "Gemini 2.5 Flash" : source === "mock" ? "Demo Mock Simulation" : "Output"}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                {response}
              </p>
            </div>
          )}
        </div>

        {/* Next Steps / Quick Checklist */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Configure Gemini API Key</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Obtain your free API key from Google AI Studio, then set <code className="text-indigo-300">GEMINI_API_KEY</code> in <code className="text-indigo-300">backend/.env</code>.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Build Your Feature Logic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add your custom endpoints in <code className="text-violet-300">backend/main.py</code> and design interactive UI components in <code className="text-violet-300">frontend/src/app</code>.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Submit to Devpost</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Push your code to GitHub, record a 2-3 minute demo video, and submit with pride on Devpost!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-400" />
            <span>Devpost Hackathon Project Template</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a 
              href="https://ai.google.dev" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://devpost.com" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              Devpost <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
