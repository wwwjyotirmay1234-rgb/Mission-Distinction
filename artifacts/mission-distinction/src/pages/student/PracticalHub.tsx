import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Mic, Square, PhoneOff, Loader2, Award, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useVoiceRecorder, useAudioPlayback } from "@workspace/integrations-openai-ai-react";

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "NEET PG", "General"];

type TurnRole = "user" | "assistant";
interface Turn { role: TurnRole; content: string }

type SessionState = "setup" | "connecting" | "examiner_speaking" | "listening" | "processing" | "ended";

type VoiceEvent =
  | { type: "user_transcript"; data: string }
  | { type: "transcript"; data: string }
  | { type: "audio"; data: string }
  | { type: "error"; error: string }
  | { done: true };

function parseSseBlock(block: string): VoiceEvent | null {
  const lines = block.split("\n").filter((l) => l.startsWith("data:"));
  if (lines.length === 0) return null;
  const raw = lines.map((l) => l.slice(5).replace(/^ /, "")).join("\n");
  try {
    return JSON.parse(raw) as VoiceEvent;
  } catch {
    return null;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

interface VivaSummary {
  score: number;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

export default function PracticalHub() {
  const [subject, setSubject] = useState("Anatomy");
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<SessionState>("setup");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liveExaminerText, setLiveExaminerText] = useState("");
  const [liveUserText, setLiveUserText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<VivaSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const recorder = useVoiceRecorder();
  const playback = useAudioPlayback("/audio-playback-worklet.js");

  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (state === "setup" || state === "ended") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    return () => { currentRequestRef.current?.abort(); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const streamTurn = useCallback(async (url: string, body: Record<string, unknown>) => {
    currentRequestRef.current?.abort();
    const controller = new AbortController();
    currentRequestRef.current = controller;

    await playback.init();
    playback.clear();

    setLiveExaminerText("");
    let fullTranscript = "";
    let gotError = "";

    try {
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        toast.error("Failed to reach the examiner. Please try again.");
        setState("setup");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      setState("examiner_speaking");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\n\n/);
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const event = parseSseBlock(block);
          if (!event) continue;
          if ("done" in event && event.done) continue;
          if ("type" in event) {
            if (event.type === "user_transcript") {
              setLiveUserText(event.data);
              turnsRef.current = [...turnsRef.current, { role: "user", content: event.data }];
              setTurns(turnsRef.current);
            } else if (event.type === "transcript") {
              fullTranscript += event.data;
              setLiveExaminerText(fullTranscript);
            } else if (event.type === "audio") {
              playback.pushAudio(event.data);
            } else if (event.type === "error") {
              gotError = event.error;
            }
          }
        }
      }

      playback.signalComplete();

      if (gotError) {
        toast.error(gotError);
        setState("listening");
        return;
      }

      if (fullTranscript) {
        turnsRef.current = [...turnsRef.current, { role: "assistant", content: fullTranscript }];
        setTurns(turnsRef.current);
      }
      setState("listening");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      toast.error("Connection lost. Please try again.");
      setState("listening");
    }
  }, [playback]);

  const startViva = async () => {
    setState("connecting");
    setTurns([]);
    turnsRef.current = [];
    setLiveUserText("");
    setLiveExaminerText("");
    setElapsed(0);
    setSummary(null);
    await streamTurn("/api/practical-hub/viva/start-voice", { subject, topic });
  };

  const handleMicClick = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      setState("processing");
      const audio = await blobToBase64(blob);
      await streamTurn("/api/practical-hub/viva/turn-voice", {
        subject,
        topic,
        history: turnsRef.current,
        audio,
      });
    } else {
      try {
        setLiveUserText("");
        await recorder.startRecording();
      } catch {
        toast.error("Microphone access is required for the voice viva.");
      }
    }
  };

  const endViva = async () => {
    currentRequestRef.current?.abort();
    if (recorder.state === "recording") await recorder.stopRecording();
    setState("ended");
    if (turnsRef.current.length === 0) return;
    setSummaryLoading(true);
    try {
      const res = await apiFetch("/api/practical-hub/viva/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, history: turnsRef.current }),
      });
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch {
      // silent — summary is a bonus, not required
    } finally {
      setSummaryLoading(false);
    }
  };

  if (state === "setup") {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> Practical Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step into a real, spoken viva voce with an AI examiner — talk, don't type.
          </p>
        </div>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic (Optional)</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Cranial Nerves, ECG leads..." className="bg-background/50 border-border/50" />
              </div>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
              You'll speak your answers out loud, just like a real exam hall. The AI examiner will ask questions, listen, and respond with a live spoken voice. Make sure your mic is on and you're somewhere quiet.
            </div>
            <Button onClick={startViva} className="gap-2 w-full sm:w-auto">
              <Mic size={15} /> Start Voice Viva
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "ended") {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> Practical Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Viva complete — here's how you did.</p>
        </div>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-5 space-y-4">
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 size={16} className="animate-spin" /> Scoring your viva...
              </div>
            ) : summary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">{summary.score}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1.5"><Award size={14} className="text-primary" /> Viva Score</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{summary.verdict}</p>
                  </div>
                </div>
                {summary.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Strengths</p>
                    <ul className="space-y-1.5">
                      {summary.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">To Improve</p>
                    <ul className="space-y-1.5">
                      {summary.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Not enough of a conversation to score. Try a longer viva next time.</p>
            )}
            <Button onClick={() => setState("setup")} className="w-full sm:w-auto">Start Another Viva</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRecording = recorder.state === "recording";
  const isBusy = state === "connecting" || state === "processing" || state === "examiner_speaking";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> Practical Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Live viva voce: {subject}{topic ? ` — ${topic}` : ""}</p>
        </div>
        <div className="text-sm font-mono text-muted-foreground">{formatTime(elapsed)}</div>
      </div>

      <Card className="bg-gradient-to-b from-card/60 to-card/30 border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-4">
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              state === "examiner_speaking" ? "bg-primary/20 ring-4 ring-primary/30 animate-pulse" :
              isRecording ? "bg-red-500/20 ring-4 ring-red-500/30" :
              "bg-primary/10"
            }`}>
              <Stethoscope size={36} className={state === "examiner_speaking" ? "text-primary" : "text-primary/70"} />
            </div>

            <div>
              <p className="text-sm font-bold">
                {state === "connecting" && "Connecting to the examiner..."}
                {state === "examiner_speaking" && "Examiner is speaking..."}
                {state === "processing" && "Examiner is reviewing your answer..."}
                {state === "listening" && !isRecording && "Your turn — tap the mic when ready"}
                {isRecording && "Listening... tap to stop and submit"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {liveExaminerText || (turns.length > 0 ? turns[turns.length - 1]?.content : "")}
              </p>
            </div>

            {liveUserText && isRecording === false && state !== "examiner_speaking" && (
              <div className="text-xs text-muted-foreground/70 italic max-w-md">"You said: {liveUserText}"</div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <Button
                size="icon"
                onClick={handleMicClick}
                disabled={isBusy}
                className={`h-16 w-16 rounded-full ${isRecording ? "bg-red-500 hover:bg-red-600" : ""}`}
              >
                {isBusy ? <Loader2 size={22} className="animate-spin" /> : isRecording ? <Square size={22} /> : <Mic size={22} />}
              </Button>
            </div>
          </div>

          <div className="border-t border-border/40 px-4 py-3 flex justify-between items-center bg-card/40">
            <p className="text-[11px] text-muted-foreground">{turns.filter((t) => t.role === "user").length} answers given</p>
            <Button variant="ghost" size="sm" onClick={endViva} className="text-xs h-7 gap-1.5 text-destructive hover:text-destructive">
              <PhoneOff size={13} /> End Viva
            </Button>
          </div>
        </CardContent>
      </Card>

      {turns.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {turns.map((t, i) => (
            <div key={i} className={`text-xs rounded-lg p-2.5 ${t.role === "assistant" ? "bg-card/50 border border-border/30" : "bg-primary/10 border border-primary/20"}`}>
              <span className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground mr-1.5">
                {t.role === "assistant" ? "Examiner" : "You"}
              </span>
              {t.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
