import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, FileText, BookOpen, ClipboardList, ChevronDown, Loader2, Bot, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/apiFetch";

// ── Types ──────────────────────────────────────────────────────────────────
type Msg = { role: "user" | "assistant"; content: string; isStreaming?: boolean };

type Resource = { id: number; title: string; subject: string; url: string; year?: string };
type Resources = { pdfs: Resource[]; books: Resource[]; pyqs: Resource[] };

type SelectedResource = Resource & { type: "pdf" | "book" | "pyq" };

// ── Helpers ────────────────────────────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(<p key={i} className="font-bold text-primary mt-3 mb-1 text-sm">{line.slice(3)}</p>);
    } else if (line.startsWith("### ")) {
      elements.push(<p key={i} className="font-semibold mt-2 mb-0.5 text-sm">{line.slice(4)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm leading-relaxed">
          <span className="text-primary shrink-0 mt-0.5">•</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm leading-relaxed">
          <span className="text-primary shrink-0 font-medium">{num}.</span>
          <span>{formatInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (line === "") {
      if (i > 0 && elements.length > 0) elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(<p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>);
    }
    i++;
  }
  return elements;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
    return p;
  });
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/70 transition-colors mt-1.5 ml-auto"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

// ── Resource icon ──────────────────────────────────────────────────────────
function ResIcon({ type }: { type: string }) {
  if (type === "book") return <BookOpen size={12} className="text-primary shrink-0" />;
  if (type === "pyq") return <ClipboardList size={12} className="text-amber-400 shrink-0" />;
  return <FileText size={12} className="text-blue-400 shrink-0" />;
}

// ── Main component ─────────────────────────────────────────────────────────
export function MeddyAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi! I'm **Meddy**, your Mission Distinction assistant 👋\n\nI can help you:\n- Find PDFs, Books, Notes & PYQs\n- Analyze a specific document (pick one below)\n- Answer questions about app features\n\nFor exam/MCQ questions → use the **AI Doubt** section for full medical answers!",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [resources, setResources] = useState<Resources | null>(null);
  const [loadingRes, setLoadingRes] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SelectedResource | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractWarning, setExtractWarning] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const allResources: SelectedResource[] = resources
    ? [
        ...resources.pdfs.map(r => ({ ...r, type: "pdf" as const })),
        ...resources.books.map(r => ({ ...r, type: "book" as const })),
        ...resources.pyqs.map(r => ({ ...r, type: "pyq" as const })),
      ]
    : [];

  const filtered = pickerSearch
    ? allResources.filter(r =>
        r.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        r.subject.toLowerCase().includes(pickerSearch.toLowerCase())
      )
    : allResources;

  const selectResource = useCallback(async (res: SelectedResource) => {
    setSelectedResource(res);
    setShowPicker(false);
    setExtractedText(null);
    setExtractWarning(null);
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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const history = messages.filter(m => !m.isStreaming);
    setMessages(prev => [...prev, userMsg, { role: "assistant", content: "", isStreaming: true }]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const token = localStorage.getItem("mission_token") ?? "";
      const body: Record<string, unknown> = {
        message: text,
        history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      };
      if (selectedResource) {
        body.documentTitle = selectedResource.title + (selectedResource.year ? ` (${selectedResource.year})` : "");
        body.documentText = extractedText ?? "";
      }

      const res = await fetch("/api/meddy/chat", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${err.error || "Something went wrong."}` };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : part;
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.content) {
              accumulated += evt.content;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: accumulated, isStreaming: true };
                return copy;
              });
            }
            if (evt.done || evt.error) break;
          } catch {}
        }
      }

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: accumulated, isStreaming: false };
        return copy;
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "⚠️ Meddy ran into an issue. Please try again." };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, messages, selectedResource, extractedText]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([{
      role: "assistant",
      content: "Hi! I'm **Meddy**, your Mission Distinction assistant 👋\n\nI can help you:\n- Find PDFs, Books, Notes & PYQs\n- Analyze a specific document (pick one below)\n- Answer questions about app features\n\nFor exam/MCQ questions → use the **AI Doubt** section for full medical answers!",
    }]);
    setSelectedResource(null);
    setExtractedText(null);
    setExtractWarning(null);
    setInput("");
    setStreaming(false);
  };

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open Meddy AI Assistant"
        className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
          boxShadow: "0 4px 24px rgba(124,58,237,0.5)",
        }}
      >
        {open
          ? <X size={22} className="text-white" />
          : <Sparkles size={22} className="text-white" />
        }
        {!open && (
          <span
            className="absolute -top-1 -right-1 text-[9px] font-bold bg-white text-purple-700 rounded-full px-1.5 py-0.5 leading-none shadow"
          >
            AI
          </span>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed z-[59] flex flex-col rounded-2xl border border-border/50 overflow-hidden shadow-2xl"
          style={{
            bottom: "5.5rem",
            right: "1rem",
            width: "min(400px, calc(100vw - 2rem))",
            height: "min(580px, calc(100vh - 8rem))",
            background: "linear-gradient(180deg, #0d0618 0%, #12072b 100%)",
            borderColor: "rgba(124,58,237,0.3)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 shrink-0 border-b"
            style={{
              background: "linear-gradient(90deg, #1a0a3a, #12072b)",
              borderColor: "rgba(124,58,237,0.25)",
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
            >
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Meddy</p>
              <p className="text-[10px] text-violet-300/70 mt-0.5">App Assistant · Powered by GPT-4o</p>
            </div>
            <button
              onClick={reset}
              title="New conversation"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Resource picker strip */}
          <div className="px-3 pt-2 pb-1.5 shrink-0 border-b" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
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
                    <span className="flex-1 min-w-0 text-xs text-white/90 truncate">{selectedResource.title}</span>
                    {extracting && <Loader2 size={12} className="text-violet-400 animate-spin shrink-0" />}
                    {!extracting && extractedText !== null && (
                      <span className="text-[9px] text-green-400 shrink-0">Ready</span>
                    )}
                    {!extracting && extractedText === null && extractWarning && (
                      <span className="text-[9px] text-amber-400 shrink-0">Limited</span>
                    )}
                  </>
                ) : (
                  <>
                    <FileText size={12} className="text-white/30 shrink-0" />
                    <span className="flex-1 text-xs text-white/30">Analyze a PDF / Book / PYQ…</span>
                  </>
                )}
                <ChevronDown size={12} className={`text-white/30 shrink-0 transition-transform ${showPicker ? "rotate-180" : ""}`} />
              </button>

              {showPicker && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-10"
                  style={{
                    background: "#1a0a3a",
                    borderColor: "rgba(124,58,237,0.3)",
                    maxHeight: 220,
                  }}
                >
                  <div className="p-2 border-b" style={{ borderColor: "rgba(124,58,237,0.15)" }}>
                    <input
                      autoFocus
                      placeholder="Search PDFs, Books, PYQs…"
                      value={pickerSearch}
                      onChange={e => setPickerSearch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none"
                    />
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 160 }}>
                    {loadingRes ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={16} className="text-violet-400 animate-spin" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-4">No resources found</p>
                    ) : (
                      filtered.slice(0, 50).map(r => (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => selectResource(r)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                          <ResIcon type={r.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/80 truncate">{r.title}</p>
                            <p className="text-[10px] text-white/40">
                              {r.subject}{r.year ? ` · ${r.year}` : ""} · {r.type.toUpperCase()}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedResource && (
                    <button
                      onClick={() => { setSelectedResource(null); setExtractedText(null); setExtractWarning(null); setShowPicker(false); }}
                      className="w-full text-xs text-red-400/70 hover:text-red-400 py-2 border-t transition-colors"
                      style={{ borderColor: "rgba(124,58,237,0.15)" }}
                    >
                      ✕ Remove document
                    </button>
                  )}
                </div>
              )}
            </div>
            {extractWarning && !showPicker && (
              <p className="text-[10px] text-amber-400/80 mt-1.5 px-1">{extractWarning}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
                  >
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 ${
                    msg.role === "user"
                      ? "rounded-tr-sm text-white text-sm"
                      : "rounded-tl-sm text-white/90"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", userSelect: "text", WebkitUserSelect: "text" }
                  }
                >
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ userSelect: "text", WebkitUserSelect: "text" }}>{msg.content}</p>
                  ) : msg.content === "" && msg.isStreaming ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-violet-400"
                          style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5" style={{ userSelect: "text", WebkitUserSelect: "text" }}>
                      {renderContent(msg.content)}
                      {msg.isStreaming && (
                        <span className="inline-block w-0.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />
                      )}
                      {!msg.isStreaming && msg.content && (
                        <CopyButton text={msg.content} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-2.5 shrink-0 border-t"
            style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(0,0,0,0.2)" }}
          >
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  selectedResource
                    ? `Ask about "${selectedResource.title}"…`
                    : "Ask Meddy anything about the app…"
                }
                rows={1}
                className="flex-1 resize-none text-sm min-h-[36px] max-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-violet-500/50 focus-visible:ring-1"
                style={{ scrollbarWidth: "none" }}
                disabled={streaming}
              />
              <Button
                size="sm"
                disabled={!input.trim() || streaming}
                onClick={sendMessage}
                className="h-9 w-9 p-0 rounded-xl shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
              >
                {streaming
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />
                }
              </Button>
            </div>
            <p className="text-[9px] text-white/20 text-center mt-1.5">
              For exam questions → AI Doubt section
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
