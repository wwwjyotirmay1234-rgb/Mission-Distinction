import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Sparkles, CheckCircle2, XCircle, RotateCcw, FileText, SplitSquareVertical, Image as ImageIcon, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "NEET PG", "General"];

interface MCQ {
  question: string; options: string[]; answer: string; explanation: string;
}

function MCQCard({ mcq, index }: { mcq: MCQ; index: number }) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const correct = mcq.answer?.charAt(0)?.toUpperCase();

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{index + 1}</span>
          <p className="text-sm font-medium leading-relaxed">{mcq.question}</p>
        </div>
        <div className="space-y-2 ml-9">
          {mcq.options?.map(opt => {
            const letter = opt.charAt(0).toUpperCase();
            const isCorrect = letter === correct;
            const isSelected = selected === letter;
            let cls = "border-border/40 bg-card/20 hover:bg-card/40";
            if (revealed) {
              if (isCorrect) cls = "border-green-500/50 bg-green-500/10 text-green-300";
              else if (isSelected && !isCorrect) cls = "border-red-500/40 bg-red-500/10 text-red-400";
            } else if (isSelected) cls = "border-primary/40 bg-primary/10";
            return (
              <button key={opt} className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${cls}`}
                onClick={() => { if (!revealed) { setSelected(letter); } }}>
                <div className="flex items-center gap-2">
                  {revealed && isCorrect && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
                  {revealed && isSelected && !isCorrect && <XCircle size={14} className="text-red-400 shrink-0" />}
                  {opt}
                </div>
              </button>
            );
          })}
        </div>
        <div className="ml-9 mt-3 flex items-center justify-between">
          {!revealed ? (
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => { setRevealed(true); }} disabled={!selected}>
              Check Answer
            </Button>
          ) : (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground leading-relaxed">{mcq.explanation}</p>
            </div>
          )}
          {revealed && (
            <Button size="sm" variant="ghost" className="ml-2 h-7 w-7 p-0 text-muted-foreground shrink-0" onClick={() => { setRevealed(false); setSelected(null); }}>
              <RotateCcw size={12} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MCQGenerator() {
  const [subject, setSubject] = useState("Anatomy");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    setLoading(true); setMcqs([]);
    try {
      const res = await apiFetch("/api/ai/mcq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, topic, count: parseInt(count) }) });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to generate"); return; }
      const data = await res.json();
      setMcqs(Array.isArray(data) ? data : []);
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Brachial Plexus, Krebs Cycle, Cardiac Cycle…" className="bg-background/50 border-border/50"
                onKeyDown={e => { if (e.key === "Enter") generate(); }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger className="w-28 bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>{["3", "5", "8", "10"].map(v => <SelectItem key={v} value={v}>{v} questions</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={generate} disabled={loading || !topic.trim()} className="gap-2">
              <Sparkles size={15} /> {loading ? "Generating…" : "Generate MCQs"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      )}

      {!loading && mcqs.length > 0 && (
        <div className="space-y-3">
          {mcqs.map((mcq, i) => <MCQCard key={i} mcq={mcq} index={i} />)}
          <Button variant="outline" className="w-full gap-2" onClick={generate}>
            <RotateCcw size={14} /> Generate New Set
          </Button>
        </div>
      )}
    </div>
  );
}

function Confusables() {
  const [subject, setSubject] = useState("Anatomy");
  const [termA, setTermA] = useState("");
  const [termB, setTermB] = useState("");
  const [result, setResult] = useState<{ title: string; rows: { aspect: string; itemA: string; itemB: string }[]; keyDifference: string; mnemonicTip: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!termA.trim() || !termB.trim()) { toast.error("Please enter both terms"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await apiFetch("/api/ai/confusables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: `${termA} vs ${termB}`, subject })
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to compare"); return; }
      const data = await res.json();
      setResult(data);
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Term A</label>
              <Input value={termA} onChange={e => setTermA(e.target.value)} placeholder="e.g. Colles Fracture" className="bg-background/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Term B</label>
              <Input value={termB} onChange={e => setTermB(e.target.value)} placeholder="e.g. Smith Fracture" className="bg-background/50 border-border/50" />
            </div>
          </div>
          <Button onClick={compare} disabled={loading || !termA.trim() || !termB.trim()} className="gap-2">
            <SplitSquareVertical size={15} /> {loading ? "Comparing…" : "Compare Terms"}
          </Button>
        </CardContent>
      </Card>

      {loading && <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}

      {!loading && result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary mb-2">{result.title}</h3>
              <p className="text-sm text-foreground italic">"{result.keyDifference}"</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/40">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-primary/10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-primary border-b border-border/40">Aspect</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-primary border-b border-border/40">{termA}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-primary border-b border-border/40">{termB}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 text-xs font-medium border-b border-border/20 bg-primary/5">{row.aspect}</td>
                      <td className="px-3 py-2 text-xs border-b border-border/20 align-top">{row.itemA}</td>
                      <td className="px-3 py-2 text-xs border-b border-border/20 align-top">{row.itemB}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.mnemonicTip && (
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                  <Sparkles size={12} /> Mnemonic Tip
                </p>
                <p className="text-sm text-foreground">{result.mnemonicTip}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DiagramExplainer() {
  const [image, setImage] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const explain = async () => {
    if (!image) { toast.error("Please upload an image"); return; }
    setLoading(true); setExplanation("");
    try {
      const res = await apiFetch("/api/ai/explain-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image, context })
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to explain"); return; }
      const data = await res.json();
      setExplanation(data.explanation);
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground block">Upload Diagram (ECG, X-Ray, Histology, etc.)</label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg p-6 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer relative">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {image ? (
                <img src={image} alt="Preview" className="max-h-64 rounded-md object-contain" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click or drag image to upload</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Context (Optional)</label>
            <Input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. I'm struggling with identifying the T-wave..." className="bg-background/50 border-border/50" />
          </div>
          <Button onClick={explain} disabled={loading || !image} className="gap-2">
            <Bot size={15} /> {loading ? "Analysing…" : "Explain Diagram"}
          </Button>
        </CardContent>
      </Card>

      {loading && <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>}

      {!loading && explanation && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={16} className="text-primary" />
              <p className="text-sm font-semibold text-primary">AI Explanation</p>
            </div>
            <div className="text-sm leading-relaxed text-foreground summary-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <h2 className="text-base font-bold text-primary mt-5 mb-2 first:mt-0 border-b border-primary/20 pb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5">{children}</h3>,
                  ul: ({ children }) => <ul className="space-y-1.5 my-2 ml-1">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex gap-2 text-sm leading-relaxed">
                      <span className="text-primary mt-1 shrink-0">›</span>
                      <span>{children}</span>
                    </li>
                  ),
                  p: ({ children }) => <p className="text-sm leading-relaxed my-2">{children}</p>,
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnswerGrading() {
  const [subject, setSubject] = useState("Anatomy");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ marks: number; feedback: string; lacking: string; modelAnswerOutline: string } | null>(null);

  const grade = async () => {
    if (!question.trim() || !answer.trim()) { toast.error("Please provide both question and answer"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await apiFetch("/api/ai/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, question, answer, maxMarks: 10 })
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to grade"); return; }
      const data = await res.json();
      setResult(data);
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Theory Question</label>
              <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Paste the exam question here..." className="bg-background/50 border-border/50 min-h-[80px]" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Answer</label>
              <Textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write your answer here..." className="bg-background/50 border-border/50 min-h-[150px]" />
            </div>
          </div>
          <Button onClick={grade} disabled={loading || !question.trim() || !answer.trim()} className="gap-2">
            <ClipboardCheck size={15} /> {loading ? "Grading…" : "Grade My Answer"}
          </Button>
        </CardContent>
      </Card>

      {loading && <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>}

      {!loading && result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-primary/20 pb-4">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-primary" />
                <h3 className="font-bold text-lg">AI Grading Result</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-primary">{result.marks}/10</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Estimated Score</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Strengths</h4>
                <div className="text-sm text-foreground bg-green-500/5 p-3 rounded-lg border border-green-500/20">{result.feedback}</div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Missing Points</h4>
                <div className="text-sm text-foreground bg-red-500/5 p-3 rounded-lg border border-red-500/20">{result.lacking}</div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Model Answer Outline</h4>
                <div className="text-sm text-foreground bg-primary/5 p-3 rounded-lg border border-primary/20 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.modelAnswerOutline}</ReactMarkdown>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NoteSummariser() {
  const [subject, setSubject] = useState("Anatomy");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const summarise = async () => {
    if (!text.trim()) { toast.error("Please paste some text"); return; }
    setLoading(true); setSummary("");
    try {
      const res = await apiFetch("/api/ai/summarise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, text }) });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); return; }
      const data = await res.json();
      setSummary(data.summary ?? "");
    } catch { toast.error("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <p className="text-xs text-muted-foreground">Paste your notes below (max 8000 characters). AI will create a concise summary + practice questions.</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Notes</label>
            <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste notes here…" className="bg-background/50 border-border/50 min-h-[150px]" maxLength={8000} />
            <p className="text-xs text-muted-foreground mt-1 text-right">{text.length}/8000</p>
          </div>
          <Button onClick={summarise} disabled={loading || !text.trim()} className="gap-2">
            <FileText size={15} /> {loading ? "Summarising…" : "Summarise Notes"}
          </Button>
        </CardContent>
      </Card>

      {loading && <div className="space-y-2">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-4 w-full" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>}

      {!loading && summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={16} className="text-primary" />
              <p className="text-sm font-semibold text-primary">AI Summary</p>
            </div>
            <div className="text-sm leading-relaxed text-foreground summary-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold text-primary mt-5 mb-2 first:mt-0 border-b border-primary/20 pb-1">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5">{children}</h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-1.5 my-2 ml-1">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="flex gap-2 text-sm leading-relaxed">
                      <span className="text-primary mt-1 shrink-0">›</span>
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm leading-relaxed my-2">{children}</p>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-border/40">
                      <table className="w-full text-sm border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-primary/10">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-primary border-b border-border/40">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-xs border-b border-border/20 align-top">{children}</td>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-white/5 transition-colors">{children}</tr>
                  ),
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-4">AI summaries may contain errors. Always verify with your textbooks.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StudentAITools() {
  const [tab, setTab] = useState<"mcq" | "summarise" | "confusables" | "diagram" | "grading">("mcq");

  const renderTab = () => {
    switch (tab) {
      case "mcq": return <MCQGenerator />;
      case "summarise": return <NoteSummariser />;
      case "confusables": return <Confusables />;
      case "diagram": return <DiagramExplainer />;
      case "grading": return <AnswerGrading />;
      default: return <MCQGenerator />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Bot size={20} className="text-primary" /> AI Study Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered tools to help you study smarter, not harder.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab("mcq")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tab === "mcq" ? "bg-primary text-white border-primary" : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"}`}>
          <Sparkles size={14} /> MCQ
        </button>
        <button onClick={() => setTab("summarise")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tab === "summarise" ? "bg-primary text-white border-primary" : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"}`}>
          <FileText size={14} /> Summary
        </button>
        <button onClick={() => setTab("confusables")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tab === "confusables" ? "bg-primary text-white border-primary" : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"}`}>
          <SplitSquareVertical size={14} /> Confusables
        </button>
        <button onClick={() => setTab("diagram")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tab === "diagram" ? "bg-primary text-white border-primary" : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"}`}>
          <ImageIcon size={14} /> Diagram
        </button>
        <button onClick={() => setTab("grading")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${tab === "grading" ? "bg-primary text-white border-primary" : "bg-card/40 border-border/50 text-muted-foreground hover:border-border"}`}>
          <ClipboardCheck size={14} /> Grading
        </button>
      </div>

      {renderTab()}
    </div>
  );
}
