import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, X, Send, FileText, BookOpen, ChevronDown,
  Loader2, Bot, RotateCcw, Copy, Check, Mic, MicOff, Maximize2, Minimize2,
  FileQuestion, List, Lightbulb, AlignLeft, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/apiFetch";

// ── Types ──────────────────────────────────────────────────────────────────
type Msg = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  suggestions?: string[];
};

type Resource = { id: number; title: string; subject: string; url: string; year?: string };
type Resources = { pdfs: Resource[]; books: Resource[]; notes: Resource[] };
type SelectedResource = Resource & { type: "pdf" | "book" | "note" };
type DocStats = { pages: number; chars: number };

// ── Helpers ────────────────────────────────────────────────────────────────
function renderContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let tableLines: string[] = [];

  const flushTable = (key: string) => {
    if (tableLines.length < 2) {
      tableLines.forEach((l, li) => elements.push(<p key={`${key}-pre-${li}`} className="text-sm font-mono text-white/70">{l}</p>));
      tableLines = [];
      return;
    }
    const headers = tableLines[0].split("|").map(h => h.trim()).filter(Boolean);
    const rows = tableLines.slice(2).map(r => r.split("|").map(c => c.trim()).filter(Boolean));
    elements.push(
      <div key={key} className="overflow-x-auto my-2 rounded-lg border border-white/10">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/10">
              {headers.map((h, hi) => <th key={hi} className="px-3 py-2 text-left font-semibold text-violet-300">{formatInline(h)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white/3" : "bg-transparent"}>
                {row.map((cell, ci) => <td key={ci} className="px-3 py-1.5 text-white/80 border-t border-white/5">{formatInline(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableLines = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes("|") && line.trim().startsWith("|")) {
      tableLines.push(line);
      i++;
      continue;
    } else if (tableLines.length > 0) {
      flushTable(`table-${i}`);
    }

    if (line.startsWith("### ")) {
      elements.push(<p key={i} className="font-bold text-primary mt-3 mb-1 text-sm flex items-center gap-1.5">{formatInline(line.slice(4))}</p>);
    } else if (line.startsWith("## ")) {
      elements.push(<p key={i} className="font-bold text-violet-300 mt-3 mb-1 text-sm">{formatInline(line.slice(3))}</p>);
    } else if (line.startsWith("**Q") && line.includes(".**")) {
      elements.push(<p key={i} className="font-semibold text-sm mt-3 mb-1 text-white">{formatInline(line)}</p>);
    } else if (line.match(/^[✅❌🔍📄❓🧠🗺️💡📚🎯⚠️]/)) {
      elements.push(<p key={i} className="text-sm leading-relaxed mt-1">{formatInline(line)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm leading-relaxed">
          <span className="text-primary shrink-0 mt-0.5">•</span>
          <span className="flex-1">{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm leading-relaxed">
          <span className="text-primary shrink-0 font-medium w-5">{num}.</span>
          <span className="flex-1">{formatInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (line.startsWith("  - ") || line.startsWith("    - ")) {
      const content = line.replace(/^\s+- /, "");
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm leading-relaxed pl-4">
          <span className="text-white/40 shrink-0 mt-0.5">◦</span>
          <span className="flex-1">{formatInline(content)}</span>
        </div>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={i} className="border-white/10 my-2" />);
    } else if (line === "") {
      if (i > 0 && elements.length > 0) elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>);
    }
    i++;
  }

  if (tableLines.length > 0) flushTable("table-end");
  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Bold, italic, inline code
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="bg-white/10 text-violet-300 px-1 py-0.5 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i} className="text-violet-200">{p.slice(1, -1)}</em>;
    return p;
  });
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      title="Copy response"
      className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors mt-2"
    >
      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

// ── Resource icon ──────────────────────────────────────────────────────────
function ResIcon({ type }: { type: string }) {
  if (type === "book") return <BookOpen size={12} className="text-emerald-400 shrink-0" />;
  if (type === "pyq") return <ClipboardList size={12} className="text-amber-400 shrink-0" />;
  if (type === "note") return <StickyNote size={12} className="text-blue-400 shrink-0" />;
  return <FileText size={12} className="text-violet-400 shrink-0" />;
}

// ── Dot typing indicator ───────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 0.18, 0.36].map((delay, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400/70"
          style={{ animation: `meddy-bounce 1.2s ease-in-out ${delay}s infinite` }}
        />
      ))}
    </div>
  );
}

// ── Fuzzy-match a resource from user's query ───────────────────────────────
const STOP_WORDS = new Set(["the", "and", "with", "for", "from", "of", "a", "an", "in", "on", "at", "to", "by", "its", "my"]);

function findBestMatch(query: string, resources: SelectedResource[]): SelectedResource | null {
  if (!resources.length) return null;
  const q = query.toLowerCase();

  // Only trigger on queries that seem to be asking about content
  const contentTriggers = [
    "what's in", "whats in", "what is in", "what does", "what do",
    "contents of", "content of", "topics in", "chapters in", "chapter in",
    "table of contents", "show me", "tell me about", "summarize",
    "about this book", "cover", "index of", "what topics", "what chapters",
    "in the book", "in this", "show topics",
  ];
  const isContentQuery = contentTriggers.some(t => q.includes(t));
  // Also match bare-name queries: "Gray's Anatomy?" or "BD Chaurasia topics"
  const seemsLikeNameQuery = /^[\w''\s\-\.]+\??\s*$/.test(query.trim()) && query.trim().length < 60;

  if (!isContentQuery && !seemsLikeNameQuery) return null;

  // 1. Exact full-title substring match
  for (const r of resources) {
    if (q.includes(r.title.toLowerCase())) return r;
  }

  // 2. Multi-word title overlap (≥2 significant words match)
  for (const r of resources) {
    const titleWords = r.title.toLowerCase()
      .split(/[\s\-\/\.]+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    if (titleWords.length === 0) continue;
    const hits = titleWords.filter(w => q.includes(w));
    const threshold = titleWords.length === 1 ? 1 : 2;
    if (hits.length >= threshold) return r;
  }

  return null;
}

// ── Build compact catalog for API requests ─────────────────────────────────
function buildCompactCatalog(resources: Resources): object {
  return {
    pdfs: resources.pdfs.map(r => ({ title: r.title, subject: r.subject })),
    books: resources.books.map(r => ({ title: r.title, subject: r.subject })),
    notes: (resources.notes ?? []).map(r => ({ title: r.title, subject: r.subject })),
  };
}

// ── Welcome quick actions ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "I can't find my PDFs", icon: "🆘" },
  { label: "How do I use AI Doubt?", icon: "🤖" },
  { label: "Show all books & notes", icon: "📚" },
  { label: "Generate 5 Anatomy MCQs", icon: "❓" },
  { label: "How do I save a PDF offline?", icon: "📥" },
  { label: "Explain glycolysis simply", icon: "🧪" },
];

// ── Document quick actions ─────────────────────────────────────────────────
const DOC_ACTIONS = [
  { label: "Summarize", icon: AlignLeft, prompt: "Please summarize this document chapter by chapter with key points and high-yield exam facts." },
  { label: "Key Points", icon: List, prompt: "What are the most important key points and must-know facts in this document for exams?" },
  { label: "Generate MCQs", icon: FileQuestion, prompt: "Generate 5 high-quality MCQs from this document in standard Indian medical exam format with answers and explanations." },
  { label: "Topic List", icon: Lightbulb, prompt: "List all the topics and chapters covered in this document." },
];

// ── Main component ─────────────────────────────────────────────────────────
export function MeddyAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    role: "assistant",
    content: "Hi! I'm **Meddy** 👋 — your Mission Distinction app assistant.\n\nI'm your first stop for **anything** in the app:\n- 🆘 App issues or emergencies — tell me what's wrong\n- 🗺️ Navigate to any feature (PDFs, Quizzes, Study Rooms…)\n- 🔍 Find resources by subject or topic\n- 📄 Analyse a document (pick one below)\n- ❓ Generate practice MCQs\n- 🧠 Explain any medical concept\n\nWhat do you need help with?",
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [resources, setResources] = useState<Resources | null>(null);
  const [loadingRes, setLoadingRes] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SelectedResource | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractWarning, setExtractWarning] = useState<string | null>(null);
  const [docStats, setDocStats] = useState<DocStats | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTab, setPickerTab] = useState<"all" | "pdf" | "book" | "note">("all");
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Voice support detection
  const hasVoice = typeof window !== "undefined" && !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  // Load resources when opened
  useEffect(() => {
    if (!open || resources) return;
    setLoadingRes(true);
    apiFetch("/api/meddy/resources")
      .then(r => r.json())
      .then((d: Resources) => setResources(d))
      .catch(() => {})
      .finally(() => setLoadingRes(false));
  }, [open, resources]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const allResources: SelectedResource[] = resources ? [
    ...resources.pdfs.map(r => ({ ...r, type: "pdf" as const })),
    ...resources.books.map(r => ({ ...r, type: "book" as const })),
    ...(resources.notes ?? []).map(r => ({ ...r, type: "note" as const })),
  ] : [];

  const filtered = allResources.filter(r => {
    const matchTab = pickerTab === "all" || r.type === pickerTab;
    const matchSearch = !pickerSearch || r.title.toLowerCase().includes(pickerSearch.toLowerCase()) || r.subject.toLowerCase().includes(pickerSearch.toLowerCase());
    return matchTab && matchSearch;
  });

  const selectResource = useCallback(async (res: SelectedResource) => {
    setSelectedResource(res);
    setShowPicker(false);
    setExtractedText(null);
    setExtractWarning(null);
    setDocStats(null);
    setExtracting(true);
    try {
      const r = await apiFetch("/api/meddy/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: res.url }),
      });
      const data = await r.json();
      if (r.ok) {
        setExtractedText(data.text || "");
        if (data.pages) setDocStats({ pages: data.pages, chars: data.chars ?? 0 });
        if (data.warning) setExtractWarning(data.warning);
      } else {
        setExtractWarning(data.error || "Could not read this file.");
      }
    } catch {
      setExtractWarning("Could not load this file. You can still ask questions about it.");
    } finally {
      setExtracting(false);
    }
  }, []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    if (!overrideText) setInput("");

    const history = messages.filter(m => !m.isStreaming);

    // ── Auto-detect resource from query ──────────────────────────────────
    let docResource = selectedResource;
    let docText = extractedText;

    if (!selectedResource && allResources.length > 0) {
      const match = findBestMatch(text, allResources);
      if (match) {
        // Show user message + auto-load indicator immediately
        setMessages(prev => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: `🔍 Found **${match.title}** in your library! Loading it now…`, isStreaming: false },
        ]);
        setStreaming(true);
        setSelectedResource(match);
        setExtracting(true);
        try {
          const r = await apiFetch("/api/meddy/extract-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: match.url }),
          });
          const data = await r.json();
          if (r.ok) {
            docText = data.text || "";
            setExtractedText(data.text || "");
            if (data.pages) setDocStats({ pages: data.pages, chars: data.chars ?? 0 });
            if (data.warning) setExtractWarning(data.warning);
          }
          docResource = match;
        } catch {
          // proceed without doc text if extraction fails
        } finally {
          setExtracting(false);
        }
        // Replace the "loading..." bubble with a streaming placeholder
        setMessages(prev => {
          const c = [...prev];
          c[c.length - 1] = { role: "assistant", content: "", isStreaming: true };
          return c;
        });
        // Fall through to streaming with docResource/docText set
      } else {
        // No match — normal flow
        setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: "", isStreaming: true }]);
        setStreaming(true);
      }
    } else {
      setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: "", isStreaming: true }]);
      setStreaming(true);
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let accumulated = "";

    try {
      // Build request body — include catalog when no doc is loaded
      const body: Record<string, unknown> = {
        message: text,
        history: history.slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 2000) })),
      };
      if (docResource) {
        body.documentTitle = docResource.title + (docResource.year ? ` (${docResource.year})` : "");
        body.documentText = docText ?? "";
      } else if (resources) {
        // Always pass the full library catalog when no document is selected
        body.resourcesCatalog = buildCompactCatalog(resources);
      }

      const res = await fetch("/api/meddy/chat", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("mission_token") ? { Authorization: `Bearer ${localStorage.getItem("mission_token")}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages(prev => {
          const c = [...prev];
          c[c.length - 1] = { role: "assistant", content: `⚠️ ${err.error || "Something went wrong."}` };
          return c;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : part;
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.content) {
              accumulated += evt.content;
              setMessages(prev => {
                const c = [...prev];
                c[c.length - 1] = { role: "assistant", content: accumulated, isStreaming: true };
                return c;
              });
            }
            if (evt.done || evt.error) break;
          } catch {}
        }
      }

      // Finalize message (no suggestions yet)
      setMessages(prev => {
        const c = [...prev];
        c[c.length - 1] = { role: "assistant", content: accumulated, isStreaming: false };
        return c;
      });

      // Non-blocking: fetch suggestions after response
      if (accumulated.length > 20) {
        apiFetch("/api/meddy/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: text,
            answer: accumulated,
            documentTitle: docResource?.title ?? "",
          }),
        })
          .then(r => r.json())
          .then(d => {
            if (Array.isArray(d.suggestions) && d.suggestions.length > 0) {
              setMessages(prev => {
                const c = [...prev];
                const last = c[c.length - 1];
                if (last.role === "assistant" && !last.isStreaming) {
                  c[c.length - 1] = { ...last, suggestions: d.suggestions };
                }
                return c;
              });
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setMessages(prev => {
          const c = [...prev];
          c[c.length - 1] = { role: "assistant", content: "⚠️ Meddy ran into an issue. Please try again." };
          return c;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, messages, selectedResource, extractedText, allResources, resources]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startVoice = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }, []);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([{
      role: "assistant",
      content: "Hi! I'm **Meddy** 👋 — your Mission Distinction app assistant.\n\nI'm your first stop for **anything** in the app:\n- 🆘 App issues or emergencies — tell me what's wrong\n- 🗺️ Navigate to any feature (PDFs, Quizzes, Study Rooms…)\n- 🔍 Find resources by subject or topic\n- 📄 Analyse a document (pick one below)\n- ❓ Generate practice MCQs\n- 🧠 Explain any medical concept\n\nWhat do you need help with?",
    }]);
    setSelectedResource(null);
    setExtractedText(null);
    setExtractWarning(null);
    setDocStats(null);
    setInput("");
    setStreaming(false);
  };

  const panelWidth = expanded ? "min(560px, calc(100vw - 1.5rem))" : "min(400px, calc(100vw - 2rem))";
  const panelHeight = expanded ? "min(82vh, calc(100vh - 5rem))" : "min(600px, calc(100vh - 8rem))";

  const isFirstMessage = messages.length === 1 && messages[0].role === "assistant";

  return (
    <>
      <style>{`
        @keyframes meddy-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes meddy-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* ── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open Meddy AI Assistant"
        className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 4px 24px rgba(124,58,237,0.55)" }}
      >
        {!open && (
          <span
            className="absolute inset-0 rounded-full"
            style={{ animation: "meddy-pulse-ring 2.5s ease-out infinite", background: "rgba(124,58,237,0.4)" }}
          />
        )}
        {open ? <X size={22} className="text-white" /> : <Sparkles size={22} className="text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-white text-purple-700 rounded-full px-1.5 py-0.5 leading-none shadow">AI</span>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed z-[59] flex flex-col rounded-2xl overflow-hidden shadow-2xl transition-all duration-200"
          style={{
            bottom: "5.5rem", right: "1rem",
            width: panelWidth,
            height: panelHeight,
            background: "linear-gradient(180deg, #0d0618 0%, #120726 100%)",
            border: "1px solid rgba(124,58,237,0.3)",
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 shrink-0 border-b"
            style={{ background: "linear-gradient(90deg, #1a0a3a, #120726)", borderColor: "rgba(124,58,237,0.25)" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
              <Bot size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Meddy</p>
              <p className="text-[10px] text-violet-300/60 mt-0.5">AI Learning Companion · GPT-4o</p>
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              title={expanded ? "Collapse" : "Expand"}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors"
            >
              {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
            <button onClick={reset} title="New conversation" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors">
              <RotateCcw size={12} />
            </button>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/80 hover:bg-white/10 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* ── Resource picker strip ── */}
          <div className="px-3 pt-2 pb-2 shrink-0 border-b" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
            <div className="relative">
              <button
                onClick={() => setShowPicker(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors"
                style={{
                  background: selectedResource ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                  borderColor: selectedResource ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)",
                }}
              >
                {selectedResource ? (
                  <>
                    <ResIcon type={selectedResource.type} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/90 truncate block">{selectedResource.title}</span>
                      {docStats && !extracting && (
                        <span className="text-[9px] text-white/30">{docStats.pages} pages · {Math.round(docStats.chars / 1000)}k chars extracted</span>
                      )}
                    </div>
                    {extracting && <Loader2 size={12} className="text-violet-400 animate-spin shrink-0" />}
                    {!extracting && extractedText !== null && <span className="text-[9px] text-green-400 shrink-0 font-medium">✓ Ready</span>}
                    {!extracting && extractedText === null && extractWarning && <span className="text-[9px] text-amber-400 shrink-0">Limited</span>}
                  </>
                ) : (
                  <>
                    <FileText size={12} className="text-white/25 shrink-0" />
                    <span className="flex-1 text-xs text-white/30">Analyze a document — PDF, Book, Note, PYQ…</span>
                  </>
                )}
                <ChevronDown size={12} className={`text-white/30 shrink-0 transition-transform ${showPicker ? "rotate-180" : ""}`} />
              </button>

              {showPicker && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-10 shadow-xl"
                  style={{ background: "#130930", borderColor: "rgba(124,58,237,0.35)", maxHeight: 260 }}
                >
                  {/* Search */}
                  <div className="p-2 border-b" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
                    <input
                      autoFocus
                      placeholder="Search by title or subject…"
                      value={pickerSearch}
                      onChange={e => setPickerSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none"
                    />
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-0 border-b" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
                    {(["all", "pdf", "book", "note"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setPickerTab(t)}
                        className={`flex-1 py-1.5 text-[10px] font-medium transition-colors capitalize ${pickerTab === t ? "text-violet-300 bg-white/5" : "text-white/30 hover:text-white/60"}`}
                      >
                        {t === "all" ? "All" : t === "pdf" ? "PDFs" : t === "book" ? "Books" : "Notes"}
                      </button>
                    ))}
                  </div>
                  {/* List */}
                  <div className="overflow-y-auto" style={{ maxHeight: 160 }}>
                    {loadingRes ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={16} className="text-violet-400 animate-spin" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-4">No resources found</p>
                    ) : (
                      filtered.slice(0, 60).map(r => (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => selectResource(r)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <ResIcon type={r.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/80 truncate">{r.title}</p>
                            <p className="text-[10px] text-white/35">{r.subject}{r.year ? ` · ${r.year}` : ""} · {r.type.toUpperCase()}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedResource && (
                    <button
                      onClick={() => { setSelectedResource(null); setExtractedText(null); setExtractWarning(null); setDocStats(null); setShowPicker(false); }}
                      className="w-full text-xs text-red-400/60 hover:text-red-400 py-2 border-t transition-colors"
                      style={{ borderColor: "rgba(124,58,237,0.12)" }}
                    >
                      ✕ Remove document
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Extraction warning */}
            {extractWarning && !showPicker && (
              <p className="text-[10px] text-amber-400/75 mt-1.5 px-1">{extractWarning}</p>
            )}

            {/* Document quick actions */}
            {selectedResource && !extracting && !showPicker && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {DOC_ACTIONS.map(({ label, icon: Icon, prompt }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(prompt)}
                    disabled={streaming}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-violet-300/80 hover:text-violet-200 transition-colors disabled:opacity-40"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    <Icon size={9} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                    <Bot size={11} className="text-white" />
                  </div>
                )}
                <div className="max-w-[82%] min-w-0">
                  <div
                    className={`rounded-2xl px-3 py-2.5 ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    style={
                      msg.role === "user"
                        ? { background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{msg.content}</p>
                    ) : msg.content === "" && msg.isStreaming ? (
                      <TypingDots />
                    ) : (
                      <div className="space-y-0.5 text-white/88" style={{ userSelect: "text", WebkitUserSelect: "text" }}>
                        {renderContent(msg.content)}
                        {msg.isStreaming && (
                          <span className="inline-block w-0.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />
                        )}
                        {!msg.isStreaming && msg.content && <CopyButton text={msg.content} />}
                      </div>
                    )}
                  </div>

                  {/* Suggestion chips */}
                  {msg.role === "assistant" && !msg.isStreaming && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => sendMessage(s)}
                          disabled={streaming}
                          className="text-[11px] text-violet-300/80 hover:text-violet-200 hover:border-violet-400/50 transition-all px-2.5 py-1 rounded-full disabled:opacity-40"
                          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Welcome quick actions */}
                  {msg.role === "assistant" && idx === 0 && isFirstMessage && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {QUICK_ACTIONS.map((qa, qi) => (
                        <button
                          key={qi}
                          onClick={() => sendMessage(qa.label)}
                          disabled={streaming}
                          className="text-[11px] text-white/50 hover:text-white/80 transition-all px-2.5 py-1 rounded-full disabled:opacity-40"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {qa.icon} {qa.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div className="px-3 py-2.5 shrink-0 border-t" style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(0,0,0,0.25)" }}>
            <div className="flex gap-2 items-end">
              {hasVoice && (
                <button
                  onClick={startVoice}
                  disabled={streaming || listening}
                  title="Voice input"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${listening ? "text-red-400 bg-red-500/15" : "text-white/35 hover:text-white/70 hover:bg-white/8"}`}
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  selectedResource ? `Ask about "${selectedResource.title}"…` : "Ask Meddy anything…"
                }
                rows={1}
                className="flex-1 resize-none text-sm min-h-[36px] max-h-[110px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-violet-500/50 focus-visible:ring-1"
                style={{ scrollbarWidth: "none" }}
                disabled={streaming}
              />
              <Button
                size="sm"
                disabled={!input.trim() || streaming}
                onClick={() => sendMessage()}
                className="h-9 w-9 p-0 rounded-xl shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
              >
                {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
            </div>
            <p className="text-[9px] text-white/18 text-center mt-1.5">
              For exam questions → AI Doubt section · Meddy may make mistakes
            </p>
          </div>
        </div>
      )}
    </>
  );
}
