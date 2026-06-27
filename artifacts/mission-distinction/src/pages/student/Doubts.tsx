import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, RotateCcw, MessageSquare, Plus, ChevronLeft, CheckCircle2, Sparkles, Trash2, Users, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology", "NEET PG", "General"];

const SUGGESTED = [
  "Write a short note on Brachial plexus (SAQ)",
  "Describe the cardiac cycle with diagrams (LAQ)",
  "What is Krebs cycle? Add its clinical significance",
  "NEET PG: Which nerve is damaged in Saturday night palsy?",
  "Write a short note on Blood-brain barrier",
  "Describe the histology of kidney cortex with diagram",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMsg = {
  id: string;
  role: "user" | "ai";
  content: string;
  streaming?: boolean;
  error?: boolean;
};

interface Doubt {
  id: number;
  userId: number;
  authorName: string;
  subject: string;
  title: string;
  question: string;
  answerCount: number;
  resolved: boolean;
  createdAt: string;
}

interface DoubtAnswer {
  id: number;
  doubtId: number;
  userId: number;
  authorName: string;
  answer: string;
  isAccepted: boolean;
  createdAt: string;
}

interface DoubtDetail extends Doubt {
  answers: DoubtAnswer[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

// ─── Diagram block — styled drawing guide card + AI image generation ──────────

function DiagramBlock({ description }: { description: string }) {
  const sentences = description
    .split(/[.;]/)
    .map(s => s.trim())
    .filter(Boolean);

  const [imgState, setImgState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [imgUrl, setImgUrl] = React.useState<string | null>(null);
  const [errMsg, setErrMsg] = React.useState<string>("");

  const generateImage = async () => {
    setImgState("loading");
    setErrMsg("");
    try {
      const res = await apiFetch("/api/ai/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setImgUrl(`data:image/png;base64,${data.b64_json}`);
      setImgState("done");
    } catch (e: any) {
      setErrMsg(e.message || "Image generation failed");
      setImgState("error");
    }
  };

  return (
    <div className="my-3 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary/15 bg-primary/10">
        <div className="flex items-center gap-2">
          <ImageIcon size={13} className="text-primary shrink-0" />
          <span className="text-xs text-primary font-semibold tracking-wide uppercase">Diagram to Draw in Exam</span>
        </div>
        {imgState === "idle" && (
          <button
            onClick={generateImage}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
          >
            <Sparkles size={10} /> Generate Image
          </button>
        )}
        {imgState === "error" && (
          <button
            onClick={generateImage}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
          >
            <RotateCcw size={10} /> Retry
          </button>
        )}
      </div>

      {/* Generated image */}
      {imgState === "loading" && (
        <div className="px-4 py-6 flex flex-col items-center gap-2 text-primary/60">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Generating diagram with AI… (~10 sec)</p>
        </div>
      )}
      {imgState === "done" && imgUrl && (
        <div className="p-2">
          <img
            src={imgUrl}
            alt={description.slice(0, 100)}
            className="w-full rounded-lg border border-border/30"
            style={{ maxHeight: "480px", objectFit: "contain", background: "#fff" }}
          />
          <p className="text-[10px] text-muted-foreground/50 text-center pt-1.5 italic">AI-generated illustration — verify labels with your textbook</p>
        </div>
      )}
      {imgState === "error" && (
        <div className="px-4 py-2 text-xs text-destructive/80">{errMsg}</div>
      )}

      {/* Text description — always shown */}
      <div className="px-4 py-3 space-y-1.5">
        {sentences.length > 1 ? (
          <ul className="space-y-1.5">
            {sentences.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                <span className="text-foreground/80">{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed">{description}</p>
        )}
        <p className="text-[10px] text-muted-foreground/60 pt-1 italic">
          ✏️ Sketch this diagram with all labels — examiners award marks for neat, labelled diagrams.
        </p>
      </div>
    </div>
  );
}

// ─── Markdown components — ChatGPT-like styling ──────────────────────────────

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground/90">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }) =>
    className ? (
      <pre className="my-2 p-3 rounded-lg bg-black/30 text-xs overflow-x-auto font-mono">
        <code>{children}</code>
      </pre>
    ) : (
      <code className="px-1 py-0.5 rounded bg-black/20 text-xs font-mono text-primary/90">{children}</code>
    ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-foreground/70 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-border/40" />,
};

// ─── Parse AI text and render [DIAGRAM: ...] tags as DiagramBlocks ────────────

function renderMessageContent(text: string) {
  const DIAGRAM_RE = /\[DIAGRAM:\s*([^\]]+)\]/g;
  const parts: Array<{ type: "text" | "diagram"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = DIAGRAM_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "diagram", value: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          p.value.trim() ? (
            <ReactMarkdown key={i} components={mdComponents}>{p.value}</ReactMarkdown>
          ) : null
        ) : (
          <DiagramBlock key={i} description={p.value} />
        )
      )}
    </>
  );
}

// ─── AI Chat Tab ──────────────────────────────────────────────────────────────

function AiChatTab() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;

    const userId = `u-${Date.now()}`;
    const aiId = `a-${Date.now()}`;

    setMsgs(prev => [
      ...prev,
      { id: userId, role: "user", content: q },
      { id: aiId, role: "ai", content: "", streaming: true },
    ]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setBusy(true);
    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem("mission_token");
      const res = await fetch("/api/doubts/ai-chat", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: q }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setMsgs(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: "Sorry, couldn't get an answer. Please try again.", streaming: false, error: true } : m
        ));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              setMsgs(prev => prev.map(m =>
                m.id === aiId ? { ...m, content: m.content + parsed.content } : m
              ));
            }
            if (parsed.done) {
              setMsgs(prev => prev.map(m =>
                m.id === aiId ? { ...m, streaming: false } : m
              ));
            }
            if (parsed.error) {
              setMsgs(prev => prev.map(m =>
                m.id === aiId ? { ...m, content: parsed.error, streaming: false, error: true } : m
              ));
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setMsgs(prev => prev.map(m =>
          m.id === aiId ? { ...m, content: "Connection error. Please try again.", streaming: false, error: true } : m
        ));
      }
    } finally {
      setBusy(false);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMsgs([]);
    setBusy(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "420px" }}>
      {/* Clear chat button */}
      {msgs.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <Trash2 size={12} /> New Chat
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {msgs.length === 0 ? (
          /* ── Welcome / empty state ── */
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot size={32} className="text-primary" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full tracking-wide">AI</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Mission Distinction AI</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your personal MBBS exam assistant — university exams &amp; NEET PG
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          msgs.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} className="text-primary" />
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : msg.error
                    ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-sm"
                    : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content ? <p className="whitespace-pre-wrap">{msg.content}</p> : null
                ) : msg.streaming ? (
                  // While streaming: render markdown but strip partial [DIAGRAM:...] tags
                  msg.content ? (
                    <>
                      <ReactMarkdown components={mdComponents}>
                        {msg.content.replace(/\[DIAGRAM:[^\]]*$/g, "")}
                      </ReactMarkdown>
                      <span className="inline-block w-0.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                    </>
                  ) : (
                    <TypingDots />
                  )
                ) : (
                  // After streaming: parse [DIAGRAM: ...] tags and render diagrams
                  msg.content ? renderMessageContent(msg.content) : null
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 pt-3 border-t border-border/40">
        <div className="flex gap-2 items-end bg-card border border-border/60 rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask any medical question… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={busy}
            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground disabled:opacity-60"
            style={{ maxHeight: "128px", overflow: "hidden" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || busy}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-1.5">
          Mission Distinction AI · Specialised for MBBS university exams &amp; NEET PG · Always cross-verify with standard textbooks.
        </p>
      </div>
    </div>
  );
}

// ─── Community Tab ────────────────────────────────────────────────────────────

async function fetchDoubts(subject?: string): Promise<Doubt[]> {
  const url = subject && subject !== "All" ? `/api/doubts?subject=${subject}` : "/api/doubts";
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

async function fetchDoubt(id: number): Promise<DoubtDetail> {
  const res = await apiFetch(`/api/doubts/${id}`);
  if (!res.ok) throw new Error("Failed to load question");
  return res.json();
}

function CommunityTab() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [newQ, setNewQ] = useState({ subject: "Anatomy", title: "" });
  const [answerText, setAnswerText] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doubts = [], isLoading } = useQuery({
    queryKey: ["doubts", filterSubject],
    queryFn: () => fetchDoubts(filterSubject),
  });

  const { data: doubtDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["doubt", selectedId],
    queryFn: () => fetchDoubt(selectedId!),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { subject: string; title: string; question: string }) =>
      apiFetch("/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
      setShowCreate(false);
      setNewQ({ subject: "Anatomy", title: "" });
      toast.success("Question posted to community!");
    },
    onError: () => toast.error("Failed to post question"),
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      apiFetch(`/api/doubts/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: text }),
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
      setAnswerText("");
      toast.success("Answer posted!");
    },
    onError: () => toast.error("Failed to post answer"),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ doubtId, answerId }: { doubtId: number; answerId: number }) =>
      apiFetch(`/api/doubts/${doubtId}/answers/${answerId}/accept`, { method: "PATCH" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubt", selectedId] });
      toast.success("Answer accepted!");
    },
    onError: () => toast.error("Failed to accept answer"),
  });

  // ── Detail view ──
  if (selectedId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => { setSelectedId(null); setShowAiPanel(false); }}>
          <ChevronLeft size={16} /> Back
        </Button>

        {detailLoading || !doubtDetail ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {doubtDetail.subject}
                    </Badge>
                    {doubtDetail.resolved && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                        ✓ Resolved
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(doubtDetail.createdAt)}</span>
                </div>
                <h2 className="text-base font-bold mb-1">{doubtDetail.title}</h2>
                {doubtDetail.question && doubtDetail.question !== doubtDetail.title && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{doubtDetail.question}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Asked by <strong>{doubtDetail.authorName}</strong></p>
                  <Button
                    size="sm"
                    variant={showAiPanel ? "default" : "outline"}
                    className={`h-8 gap-1.5 text-xs ${showAiPanel ? "bg-primary" : "border-primary/40 text-primary hover:bg-primary/10"}`}
                    onClick={() => setShowAiPanel(v => !v)}
                  >
                    <Sparkles size={13} />
                    {showAiPanel ? "Hide AI" : "Ask AI"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showAiPanel && <LegacyAiPanel doubtId={selectedId} onClose={() => setShowAiPanel(false)} />}

            <p className="text-sm font-semibold">
              {doubtDetail.answers.length} Answer{doubtDetail.answers.length !== 1 ? "s" : ""}
            </p>

            {doubtDetail.answers.length === 0 && (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                No answers yet — be the first to help!
              </div>
            )}

            {doubtDetail.answers.map((ans) => (
              <Card key={ans.id} className={`border ${ans.isAccepted ? "border-green-500/40 bg-green-500/5" : "border-border/40 bg-card/30"}`}>
                <CardContent className="p-4">
                  {ans.isAccepted && (
                    <div className="flex items-center gap-1.5 text-green-500 text-xs font-semibold mb-2">
                      <CheckCircle2 size={14} /> Accepted Answer
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{ans.answer}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>{ans.authorName}</strong> · {timeAgo(ans.createdAt)}
                    </p>
                    {!ans.isAccepted && doubtDetail.userId === user?.id && !doubtDetail.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => acceptMutation.mutate({ doubtId: doubtDetail.id, answerId: ans.id })}
                      >
                        <CheckCircle2 size={12} /> Accept
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">Your Answer</p>
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Share your knowledge…"
                  rows={3}
                  className="w-full bg-background/50 border border-border/50 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none mb-3"
                />
                <Button
                  className="gap-2"
                  disabled={!answerText.trim() || answerMutation.isPending}
                  onClick={() => answerMutation.mutate({ id: selectedId, text: answerText })}
                >
                  <Send size={14} /> {answerMutation.isPending ? "Posting…" : "Post Answer"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...SUBJECTS].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterSubject === s
                  ? "bg-primary text-white border-primary"
                  : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Ask Peers
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : doubts.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No community questions yet.{filterSubject !== "All" ? " Try a different subject." : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {doubts.map((doubt) => (
            <Card
              key={doubt.id}
              className="bg-card/30 border-border/40 hover:bg-card/50 transition-colors cursor-pointer"
              onClick={() => { setSelectedId(doubt.id); setShowAiPanel(false); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {doubt.subject}
                      </Badge>
                      {doubt.resolved && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500 border-green-500/20">
                          ✓ Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{doubt.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{timeAgo(doubt.createdAt)}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-end">
                      <MessageSquare size={11} /> {doubt.answerCount}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Asked by {doubt.authorName}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ask peers dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-card border border-border/60 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Ask the Community</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                <Select value={newQ.subject} onValueChange={v => setNewQ(p => ({ ...p, subject: v }))}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Question</label>
                <Input
                  value={newQ.title}
                  onChange={e => setNewQ(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. What is the function of the SA node?"
                  className="bg-background/50 border-border/50"
                  onKeyDown={e => { if (e.key === "Enter" && newQ.title.trim()) createMutation.mutate({ subject: newQ.subject, title: newQ.title, question: newQ.title }); }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!newQ.title.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate({ subject: newQ.subject, title: newQ.title, question: newQ.title })}
              >
                {createMutation.isPending ? "Posting…" : "Post Question"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legacy AI panel (for community thread view) ──────────────────────────────

function LegacyAiPanel({ doubtId, onClose }: { doubtId: number; onClose: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const ask = async () => {
    setText(""); setDone(false); setError(""); setLoading(true);
    abortRef.current = new AbortController();
    try {
      const token = localStorage.getItem("mission_token");
      const res = await fetch(`/api/doubts/${doubtId}/ai-answer`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) { setError("AI could not answer. Try again."); setLoading(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done: sd } = await reader.read();
        if (sd) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(line.slice(6));
            if (p.content) setText(t => t + p.content);
            if (p.done) setDone(true);
            if (p.error) setError(p.error);
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setError("Connection error. Try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { ask(); return () => abortRef.current?.abort(); }, []);

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot size={14} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-primary">AI Tutor</span>
          {loading && <TypingDots />}
          {done && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-green-500/40 text-green-400">Done</Badge>}
        </div>
        <div className="flex gap-1">
          {!loading && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary/70 hover:text-primary" onClick={ask}>
              <RotateCcw size={13} />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>
      <div className="px-4 py-3 min-h-[60px] max-h-[360px] overflow-y-auto">
        {error ? <p className="text-sm text-destructive">{error}</p>
          : text ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
          : loading ? <div className="space-y-2 pt-1"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-4/6" /></div>
          : null}
      </div>
      <p className="px-4 pb-2.5 text-[10px] text-muted-foreground/50">AI answers may contain errors. Always verify with textbooks.</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentDoubts() {
  const [tab, setTab] = useState<"ai" | "community">("ai");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot size={22} className="text-primary" /> Mission Distinction AI
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tab === "ai"
              ? "Exam-ready answers for university exams & NEET PG"
              : "Questions & answers from your batchmates"}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/30 border border-border/40 rounded-xl w-fit">
        {(["ai", "community"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "ai" ? <><Bot size={14} /> AI Chat</> : <><Users size={14} /> Community</>}
          </button>
        ))}
      </div>

      {tab === "ai" ? <AiChatTab /> : <CommunityTab />}
    </div>
  );
}
