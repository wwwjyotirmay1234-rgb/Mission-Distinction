import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, X, Send, Loader2, Bot, RotateCcw, Copy, Check, Mic, MicOff, Maximize2, Minimize2,
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
    } else if (line.match(/^[✅❌🔍📄❓🧠🗺️💡📚🎯⚠️🆘🤖📥]/)) {
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

// ── Welcome quick actions ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "I can't find my PDFs", icon: "🆘" },
  { label: "How do I use AI Doubt?", icon: "🤖" },
  { label: "Show all books & notes", icon: "📚" },
  { label: "Generate 5 Anatomy MCQs", icon: "❓" },
  { label: "How do I save a PDF offline?", icon: "📥" },
  { label: "Explain glycolysis simply", icon: "🧪" },
];

const WELCOME_MSG = "Hi! I'm **Meddy** 👋 — your Mission Distinction app assistant.\n\nI'm your first stop for **anything** in the app:\n- 🆘 App issues or emergencies — tell me what's wrong\n- 🗺️ Navigate to any feature (PDFs, Quizzes, Study Rooms…)\n- 🔍 Find resources by subject or topic\n- ❓ Generate practice MCQs\n- 🧠 Explain any medical concept\n\nWhat do you need help with?";

// ── Main component ─────────────────────────────────────────────────────────
export function MeddyAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: WELCOME_MSG }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasVoice = typeof window !== "undefined" && !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    if (!overrideText) setInput("");

    const history = messages.filter(m => !m.isStreaming);

    setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: "", isStreaming: true }]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let accumulated = "";

    try {
      const body: Record<string, unknown> = {
        message: text,
        history: history.slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 2000) })),
      };

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

      setMessages(prev => {
        const c = [...prev];
        c[c.length - 1] = { role: "assistant", content: accumulated, isStreaming: false };
        return c;
      });

      if (accumulated.length > 20) {
        apiFetch("/api/meddy/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, answer: accumulated, documentTitle: "" }),
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
  }, [input, streaming, messages]);

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
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }, []);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([{ role: "assistant", content: WELCOME_MSG }]);
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
              <p className="text-[10px] text-violet-300/60 mt-0.5">App Assistant · Powered by AI</p>
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
                placeholder="Ask Meddy anything…"
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
              For exam Q&amp;A with file upload → AI Doubt section · Meddy may make mistakes
            </p>
          </div>
        </div>
      )}
    </>
  );
}
