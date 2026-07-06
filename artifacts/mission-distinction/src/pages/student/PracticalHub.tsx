import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Stethoscope, Mic, Square, PhoneOff, Loader2, Award, CheckCircle2, AlertTriangle, ArrowRight, Sparkles,
  Search, Users, ChevronLeft, Volume2, TrendingUp, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceRecorder, useAudioPlayback } from "@workspace/integrations-openai-ai-react";
import { PHYSIOLOGY_CLINICAL_IMAGES, type PhysiologyClinicalImage } from "@/data/physiologyClinicalImages";
import { PHYSIOLOGY_HEMATOLOGY_IMAGES } from "@/data/physiologyHematologyImages";
import { BIOCHEMISTRY_SERUM_URINE_IMAGES } from "@/data/biochemistryImages";
import VivaRooms from "@/pages/student/VivaRooms";

const ALL_SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type Subject = (typeof ALL_SUBJECTS)[number];

const VIVA_UNLOCKED_EMAIL = "www.jyotirmay1234@gmail.com";

const EXAMINER_BY_SUBJECT: Record<Subject, string> = {
  Anatomy: "Dr. Mamata",
  Physiology: "Dr. Rajiv",
  Biochemistry: "Dr. Madhu",
};

const PHYSIOLOGY_VIVA_TYPES = ["Hematology Experiment", "Human Experiments & Clinical Physiology", "Theory"] as const;
type PhysiologyVivaType = (typeof PHYSIOLOGY_VIVA_TYPES)[number];

const PHYSIOLOGY_VIVA_TYPE_DESCRIPTIONS: Record<PhysiologyVivaType, string> = {
  "Hematology Experiment": "Hb estimation, TLC/DLC, blood indices, BT/CT, blood grouping, ESR, osmotic fragility.",
  "Human Experiments & Clinical Physiology": "Pulse, BP, spirometry, ECG, reflexes — with reference images shown on screen.",
  Theory: "The full 1st-year Physiology theory syllabus — every system, basic to tough.",
};

const BIOCHEMISTRY_VIVA_TYPES = ["Theory", "Serum and Urine Estimation"] as const;
type BiochemistryVivaType = (typeof BIOCHEMISTRY_VIVA_TYPES)[number];

const BIOCHEMISTRY_VIVA_TYPE_DESCRIPTIONS: Record<BiochemistryVivaType, string> = {
  Theory: "The full 1st-year Biochemistry theory syllabus — every topic, basic to tough.",
  "Serum and Urine Estimation": "Procedure, principle, normal ranges and related diseases for serum/urine estimations (glucose, urea, creatinine, protein, bilirubin, lipid profile, LFTs, calcium/phosphorus, qualitative urine tests) per CBME.",
};

const ANATOMY_VIVA_TYPES = ["Theory", "Histology", "Bone", "Visceral", "Section Anatomy", "Prosection"] as const;
type AnatomyVivaType = (typeof ANATOMY_VIVA_TYPES)[number];

const ANATOMY_VIVA_TYPE_DESCRIPTIONS: Record<AnatomyVivaType, string> = {
  Theory: "The full 1st-year Anatomy theory syllabus (gross anatomy + embryology woven in) — basic to tough.",
  Histology: "Identify the microscope slide shown on screen and answer follow-up questions on its structure and embryological origin.",
  Bone: "Identify the bone specimen shown on screen — features, attachments, and clinical/embryological correlations.",
  Visceral: "Identify the thoracic/abdominal organ specimen shown on screen — relations, structure, and development.",
  "Section Anatomy": "Identify the sagittal/cross-sectional specimen shown on screen and its contents.",
  Prosection: "Identify the dissected structure(s) shown in the cadaveric prosection photo — nerves, vessels, muscles.",
};

type VivaType = PhysiologyVivaType | BiochemistryVivaType | AnatomyVivaType;

const ANSWER_WINDOW_SECONDS = 50;
const ANSWER_HURRY_UP_SECONDS = 15;

// Target time budget for a single-subject viva station, mirroring a real practical rotation
// where each station has a fixed slot before the batch moves to the next one.
const STATION_TARGET_SECONDS = 10 * 60;

const ENTRANCE_BEAT_MS = 1800;
const ENTRANCE_LINES: Record<string, string[]> = {
  "Dr. Mamata": ["Come in, beta. Sit down.", "Let's see your roll number... right, ready?", "No wasting time, let's begin."],
  "Dr. Rajiv": ["Come in, come in. Have a seat.", "Don't be nervous, just answer what you know.", "Alright, settling in?"],
  "Dr. Madhu": ["Yes, come. Sit.", "Let me just check your name here...", "Alright, let's get started."],
};

type TurnRole = "user" | "assistant";
interface Turn { role: TurnRole; content: string }

type SessionState =
  | "home"
  | "rooms"
  | "setup"
  | "entrance"
  | "connecting"
  | "examiner_speaking"
  | "listening"
  | "processing"
  | "section_ended";

type VoiceEvent =
  | { type: "user_transcript"; data: string }
  | { type: "transcript"; data: string }
  | { type: "audio"; data: string }
  | { type: "station_image"; imageId: number; imageUrl: string }
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

interface PanelOpinion {
  examiner: string;
  score: number;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

interface QuestionBreakdownItem {
  question: string;
  studentAnswer: string;
  marks: number;
  maxMarks: number;
  idealAnswer: string;
}

interface VivaSummary {
  subject: Subject;
  score: number;
  strengths: string[];
  improvements: string[];
  verdict: string;
  examinerName?: string;
  panel?: { gemini: PanelOpinion | null; claude: PanelOpinion | null };
  questionBreakdown?: QuestionBreakdownItem[];
}

export default function PracticalHub() {
  const { user } = useAuth();
  const vivaLocked = user?.email !== VIVA_UNLOCKED_EMAIL;
  const [topic, setTopic] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject>(ALL_SUBJECTS[0]);
  const [subject, setSubject] = useState<Subject>(ALL_SUBJECTS[0]);
  const [selectedPhysiologyVivaType, setSelectedPhysiologyVivaType] = useState<PhysiologyVivaType>(PHYSIOLOGY_VIVA_TYPES[0]);
  const [selectedBiochemistryVivaType, setSelectedBiochemistryVivaType] = useState<BiochemistryVivaType>(BIOCHEMISTRY_VIVA_TYPES[0]);
  const [selectedAnatomyVivaType, setSelectedAnatomyVivaType] = useState<AnatomyVivaType>(ANATOMY_VIVA_TYPES[0]);
  const [vivaType, setVivaType] = useState<VivaType | null>(null);
  const [clinicalImage, setClinicalImage] = useState<PhysiologyClinicalImage | null>(null);
  const [anatomyStationImage, setAnatomyStationImage] = useState<{ id: number; url: string } | null>(null);
  const anatomyStationImageRef = useRef<{ id: number; url: string } | null>(null);
  anatomyStationImageRef.current = anatomyStationImage;
  const [state, setState] = useState<SessionState>("home");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [liveExaminerText, setLiveExaminerText] = useState("");
  const [liveUserText, setLiveUserText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [answerSecondsLeft, setAnswerSecondsLeft] = useState<number | null>(null);
  const [hurryUpNudge, setHurryUpNudge] = useState(false);
  const hurryUpShownRef = useRef(false);
  const [entranceLine, setEntranceLine] = useState("");
  const [sectionSummary, setSectionSummary] = useState<VivaSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const recorder = useVoiceRecorder();
  const playback = useAudioPlayback("/audio-playback-worklet.js");

  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRequestRef = useRef<AbortController | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderStateRef = useRef(recorder.state);
  recorderStateRef.current = recorder.state;

  useEffect(() => {
    if (state === "setup" || state === "section_ended") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    return () => {
      currentRequestRef.current?.abort();
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    };
  }, []);

  const clearAnswerTimer = useCallback(() => {
    if (answerTimerRef.current) {
      clearInterval(answerTimerRef.current);
      answerTimerRef.current = null;
    }
    setAnswerSecondsLeft(null);
    setHurryUpNudge(false);
  }, []);

  const startAnswerTimer = useCallback((onExpire: () => void) => {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    setAnswerSecondsLeft(ANSWER_WINDOW_SECONDS);
    setHurryUpNudge(false);
    hurryUpShownRef.current = false;
    answerTimerRef.current = setInterval(() => {
      setAnswerSecondsLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          if (answerTimerRef.current) clearInterval(answerTimerRef.current);
          answerTimerRef.current = null;
          onExpire();
          return null;
        }
        // Interruption/hurry-up: once the answer window is running low, nudge the student
        // like a real examiner cutting in on a rambling or stalled answer.
        if (s - 1 <= ANSWER_HURRY_UP_SECONDS && !hurryUpShownRef.current) {
          hurryUpShownRef.current = true;
          setHurryUpNudge(true);
        }
        return s - 1;
      });
    }, 1000);
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
            } else if (event.type === "station_image") {
              setAnatomyStationImage({ id: event.imageId, url: event.imageUrl });
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

  const pickImageForVivaType = useCallback((type: VivaType | null, requestedTopic: string): PhysiologyClinicalImage | null => {
    const pool =
      type === "Human Experiments & Clinical Physiology" ? PHYSIOLOGY_CLINICAL_IMAGES :
      type === "Hematology Experiment" ? PHYSIOLOGY_HEMATOLOGY_IMAGES :
      type === "Serum and Urine Estimation" ? BIOCHEMISTRY_SERUM_URINE_IMAGES :
      null;
    if (!pool || pool.length === 0) return null;

    const trimmedTopic = requestedTopic.trim().toLowerCase();
    if (trimmedTopic) {
      // The student asked for a specific topic — only show an image if one actually matches it,
      // so we never force an unrelated image (e.g. ECG) on top of an unrelated requested topic.
      const match = pool.find(
        (img) =>
          img.topic.toLowerCase().includes(trimmedTopic) ||
          trimmedTopic.includes(img.topic.toLowerCase()) ||
          img.caption.toLowerCase().includes(trimmedTopic)
      );
      return match ?? null;
    }

    // No specific topic requested — a random reference image is fine to keep vivas varied.
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const autoSubmitOnTimeout = useCallback(async () => {
    if (recorderStateRef.current !== "recording") return;
    toast.info("Time's up — submitting your answer.");
    const blob = await recorder.stopRecording();
    setState("processing");
    const audio = await blobToBase64(blob);
    await streamTurn("/api/practical-hub/viva/turn-voice", {
      subject,
      topic,
      history: turnsRef.current,
      vivaType: vivaType ?? undefined,
      imageCaption: clinicalImage?.caption ?? undefined,
      imageId: anatomyStationImageRef.current?.id,
      audio,
    });
  }, [recorder, streamTurn, subject, topic, vivaType, clinicalImage]);

  const startViva = async () => {
    setSubject(selectedSubject);
    const isPhysiology = selectedSubject === "Physiology";
    const isBiochemistry = selectedSubject === "Biochemistry";
    const isAnatomy = selectedSubject === "Anatomy";
    const chosenVivaType: VivaType | null = isPhysiology
      ? selectedPhysiologyVivaType
      : isBiochemistry
        ? selectedBiochemistryVivaType
        : isAnatomy
          ? selectedAnatomyVivaType
          : null;
    const chosenImage = isPhysiology || isBiochemistry ? pickImageForVivaType(chosenVivaType, topic) : null;
    setVivaType(chosenVivaType);
    setClinicalImage(chosenImage);
    setAnatomyStationImage(null);
    setTurns([]);
    turnsRef.current = [];
    setLiveUserText("");
    setLiveExaminerText("");
    setElapsed(0);
    clearAnswerTimer();
    setSectionSummary(null);

    // Visible "waiting to be called" entrance beat before the first question — a brief moment
    // where the examiner is shown greeting/settling in, rather than jumping straight to Q1.
    const examinerName = EXAMINER_BY_SUBJECT[selectedSubject];
    const lines = ENTRANCE_LINES[examinerName] ?? ["Come in, take a seat."];
    setEntranceLine(lines[Math.floor(Math.random() * lines.length)]);
    setState("entrance");
    await new Promise((resolve) => setTimeout(resolve, ENTRANCE_BEAT_MS));

    setState("connecting");
    await streamTurn("/api/practical-hub/viva/start-voice", {
      subject: selectedSubject,
      topic,
      vivaType: chosenVivaType ?? undefined,
      imageCaption: chosenImage?.caption ?? undefined,
    });
  };

  const handleMicClick = async () => {
    if (recorder.state === "recording") {
      clearAnswerTimer();
      const blob = await recorder.stopRecording();
      setState("processing");
      const audio = await blobToBase64(blob);
      await streamTurn("/api/practical-hub/viva/turn-voice", {
        subject,
        topic,
        history: turnsRef.current,
        vivaType: vivaType ?? undefined,
        imageCaption: clinicalImage?.caption ?? undefined,
        imageId: anatomyStationImageRef.current?.id,
        audio,
      });
    } else {
      try {
        setLiveUserText("");
        await recorder.startRecording();
        startAnswerTimer(autoSubmitOnTimeout);
      } catch {
        toast.error("Microphone access is required for the voice viva.");
      }
    }
  };

  const endSection = async () => {
    currentRequestRef.current?.abort();
    clearAnswerTimer();
    if (recorder.state === "recording") await recorder.stopRecording();
    setState("section_ended");
    if (turnsRef.current.length === 0) {
      setSectionSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const res = await apiFetch("/api/practical-hub/viva/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, history: turnsRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        const summary: VivaSummary = { subject, ...data };
        setSectionSummary(summary);
      }
    } catch {
      // silent — summary is a bonus, not required
    } finally {
      setSummaryLoading(false);
    }
  };

  if (state === "home") {
    const tiles: {
      key: string;
      icon: React.ReactNode;
      title: string;
      description: string;
      badge?: string;
      locked?: boolean;
      onClick: () => void;
    }[] = [
      {
        key: "ai-viva",
        icon: <Mic size={22} className="text-primary" />,
        title: "AI Viva Simulator",
        description: "Spoken viva voce with an AI examiner across Anatomy, Physiology & Biochemistry.",
        badge: "Voice",
        locked: vivaLocked,
        onClick: () => { setVivaType(null); setClinicalImage(null); setState("setup"); },
      },
      {
        key: "viva-rooms",
        icon: <Users size={22} className="text-primary" />,
        title: "Viva Rooms",
        description: "Live multiplayer viva panels — practice with real batchmates over voice/video.",
        badge: "Live",
        onClick: () => setState("rooms"),
      },
    ];

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-24">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
            <Stethoscope size={24} className="text-primary" /> Practical Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-xl mx-auto sm:mx-0">
            Everything you need for practicals — spoken vivas, live viva rooms, spotters, cadaver ID and exam simulations, all in one place.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search practical tools…" className="pl-10 bg-card/40 border-border/40" disabled />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {tiles.map((tile) => (
            <Card
              key={tile.key}
              className={`bg-card/40 border-border/40 transition-colors group ${
                tile.locked
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-card/60 hover:border-primary/30 cursor-pointer"
              }`}
              onClick={() => {
                if (tile.locked) {
                  toast.info("AI Viva Simulator is temporarily locked while we improve answer grading. Please check back soon.");
                  return;
                }
                tile.onClick();
              }}
            >
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  {tile.locked ? <Lock size={20} className="text-muted-foreground" /> : tile.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm">{tile.title}</p>
                    {tile.locked ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/40 text-amber-400 bg-amber-500/10">
                        Locked
                      </span>
                    ) : tile.badge ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${tile.badge === "Live" ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-primary/30 text-primary bg-primary/10"}`}>
                        {tile.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tile.locked ? "Temporarily unavailable while we improve answer grading accuracy." : tile.description}
                  </p>
                </div>
                {!tile.locked && (
                  <ArrowRight size={15} className="text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { icon: <Volume2 size={16} className="text-primary" />, label: "Voice-to-Voice" },
            { icon: <Sparkles size={16} className="text-primary" />, label: "AI Examiner" },
            { icon: <CheckCircle2 size={16} className="text-primary" />, label: "Instant Feedback" },
            { icon: <TrendingUp size={16} className="text-primary" />, label: "Performance Tracking" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-card/20 border border-border/30 text-center">
              {f.icon}
              <span className="text-[11px] text-muted-foreground font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state === "rooms") {
    return <VivaRooms onBack={() => setState("home")} />;
  }

  if (state === "setup") {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setState("home")}>
            <ChevronLeft size={16} /> Practical Hub
          </Button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> AI Viva Simulator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            A real, spoken viva voce with an AI examiner panel — talk, don't type.
          </p>
        </div>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Choose Subject</label>
              <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as Subject)}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSubject === "Physiology" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Viva Type</label>
                <Select value={selectedPhysiologyVivaType} onValueChange={(v) => setSelectedPhysiologyVivaType(v as PhysiologyVivaType)}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Select a viva type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHYSIOLOGY_VIVA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1.5">{PHYSIOLOGY_VIVA_TYPE_DESCRIPTIONS[selectedPhysiologyVivaType]}</p>
              </div>
            )}
            {selectedSubject === "Biochemistry" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Viva Type</label>
                <Select value={selectedBiochemistryVivaType} onValueChange={(v) => setSelectedBiochemistryVivaType(v as BiochemistryVivaType)}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Select a viva type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BIOCHEMISTRY_VIVA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1.5">{BIOCHEMISTRY_VIVA_TYPE_DESCRIPTIONS[selectedBiochemistryVivaType]}</p>
              </div>
            )}
            {selectedSubject === "Anatomy" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Viva Type</label>
                <Select value={selectedAnatomyVivaType} onValueChange={(v) => setSelectedAnatomyVivaType(v as AnatomyVivaType)}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Select a viva type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANATOMY_VIVA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1.5">{ANATOMY_VIVA_TYPE_DESCRIPTIONS[selectedAnatomyVivaType]}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic Focus (Optional)</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Cranial Nerves, Cardiac Cycle..." className="bg-background/50 border-border/50" />
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed flex gap-2">
              <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
              <span>
                {EXAMINER_BY_SUBJECT[selectedSubject]} conducts the spoken {selectedSubject} exam live. Behind the scenes, a multi-AI panel quietly sharpens the tougher follow-up questions and cross-checks your final score, so your result reflects a full exam board's opinion.
              </span>
            </div>
            <Button onClick={startViva} className="gap-2 w-full sm:w-auto">
              <Mic size={15} /> Start Practical Viva
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "section_ended") {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> Practical Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{subject} viva complete.</p>
        </div>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-5 space-y-4">
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 size={16} className="animate-spin" /> The panel is scoring your {subject} viva...
              </div>
            ) : sectionSummary ? (
              <SectionSummaryView summary={sectionSummary} />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Not enough of a conversation to score. Try answering a few questions next time.</p>
            )}
            <Button onClick={() => setState("setup")} className="w-full sm:w-auto gap-1.5">
              Start Another Practical Viva
              <ArrowRight size={15} />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "entrance") {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Stethoscope size={20} className="text-primary" /> {subject} Viva{vivaType ? ` — ${vivaType}` : ""}
          </h1>
        </div>
        <Card className="bg-gradient-to-b from-card/60 to-card/30 border-border/40 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Stethoscope size={36} className="text-primary/70" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Waiting to be called in — {EXAMINER_BY_SUBJECT[subject]}
                </p>
                <p className="text-sm font-medium max-w-md">"{entranceLine}"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRecording = recorder.state === "recording";
  const isBusy = state === "connecting" || state === "processing" || state === "examiner_speaking";
  const questionNumber = turns.filter((t) => t.role === "assistant").length || (state === "connecting" ? 0 : 1);
  const stationSecondsLeft = Math.max(0, STATION_TARGET_SECONDS - elapsed);
  const stationTimeCritical = stationSecondsLeft <= 120;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80 flex items-center gap-1.5 mb-0.5">
            <Stethoscope size={13} /> Practical Hub
          </p>
          <h1 className="text-xl sm:text-2xl font-bold">
            {subject} Viva{vivaType ? ` — ${vivaType}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {EXAMINER_BY_SUBJECT[subject]}{topic ? ` · ${topic}` : ""} · Question {questionNumber}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-mono text-muted-foreground">{formatTime(elapsed)}</div>
          <div className={`text-[10px] font-medium mt-0.5 ${stationTimeCritical ? "text-red-500" : "text-muted-foreground/70"}`}>
            {stationTimeCritical
              ? stationSecondsLeft > 0
                ? `Next station in ${formatTime(stationSecondsLeft)}`
                : "Wrap up — time's up for this station"
              : `Next station in ~${Math.ceil(stationSecondsLeft / 60)} min`}
          </div>
        </div>
      </div>

      {clinicalImage && (state === "examiner_speaking" || state === "listening" || isRecording || state === "processing") && (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <CardContent className="p-3 flex flex-col gap-3 items-center">
            <img
              src={clinicalImage.src}
              alt="Apparatus/specimen shown for identification"
              className="w-full max-w-md max-h-[70vh] object-contain rounded-lg bg-background/40 border border-border/30"
            />
            <div className="text-xs text-muted-foreground leading-relaxed text-center">
              <p className="font-bold uppercase tracking-wider text-[10px] text-primary mb-1">Identify This Apparatus</p>
              {clinicalImage.displayCaption}
            </div>
          </CardContent>
        </Card>
      )}

      {anatomyStationImage && (state === "examiner_speaking" || state === "listening" || isRecording || state === "processing") && (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <CardContent className="p-3 flex flex-col gap-3 items-center">
            <img
              src={`${anatomyStationImage.url}${anatomyStationImage.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("mission_token") ?? "")}`}
              alt={`${vivaType ?? "Anatomy"} specimen`}
              className="w-full max-w-md max-h-[70vh] object-contain rounded-lg bg-background/40 border border-border/30"
            />
            <div className="text-xs text-muted-foreground leading-relaxed text-center">
              <p className="font-bold uppercase tracking-wider text-[10px] text-primary mb-1">{vivaType} Spotter</p>
              Identify the structure shown and be ready for follow-up questions.
            </div>
          </CardContent>
        </Card>
      )}

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

            {(isRecording || state === "examiner_speaking") && (
              <div className="flex items-end gap-1 h-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full ${isRecording ? "bg-red-500/70" : "bg-primary/60"} animate-pulse`}
                    style={{
                      height: `${6 + ((i * 7) % 18)}px`,
                      animationDuration: `${0.6 + (i % 4) * 0.15}s`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {isRecording && answerSecondsLeft !== null && (
              <div className={`text-xs font-mono font-bold ${answerSecondsLeft <= 10 ? "text-red-500" : "text-muted-foreground"}`}>
                {formatTime(answerSecondsLeft)} left to answer
              </div>
            )}

            {isRecording && hurryUpNudge && (
              <div className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle size={13} /> {EXAMINER_BY_SUBJECT[subject]}: "Yes yes, come on, quickly now."
              </div>
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
            <Button variant="ghost" size="sm" onClick={endSection} className="text-xs h-7 gap-1.5 text-destructive hover:text-destructive">
              <PhoneOff size={13} /> End {subject} Viva
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

function SectionSummaryView({ summary }: { summary: VivaSummary }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const maxTotal = summary.questionBreakdown?.reduce((sum, q) => sum + q.maxMarks, 0) ?? 100;
  const totalMarks = summary.questionBreakdown?.reduce((sum, q) => sum + q.marks, 0) ?? summary.score;

  return (
    <div className="rounded-md border-2 border-foreground/25 bg-[#faf8f2] dark:bg-card/60 p-4 sm:p-6 font-serif text-foreground/90 space-y-4">
      <div className="text-center border-b-2 border-foreground/20 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Internal Assessment — Practical Examination</p>
        <p className="text-base sm:text-lg font-bold mt-1">MBBS Phase I — Viva Voce Mark Sheet</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">AI Viva Simulator, Mission Distinction</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm border-b border-dashed border-foreground/25 pb-3">
        <p><span className="text-muted-foreground">Student Name:</span> <span className="font-semibold">{user?.fullName ?? "—"}</span></p>
        <p><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{today}</span></p>
        <p><span className="text-muted-foreground">Subject:</span> <span className="font-semibold">{summary.subject}</span></p>
        <p><span className="text-muted-foreground">Examiner:</span> <span className="font-semibold">{summary.examinerName ?? "—"}</span></p>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-dashed border-foreground/25 pb-3">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Marks Obtained</p>
        <p className="text-2xl font-bold">
          {totalMarks}<span className="text-sm font-normal text-muted-foreground"> / {maxTotal}</span>
        </p>
      </div>

      {summary.panel && (summary.panel.gemini || summary.panel.claude) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-dashed border-foreground/25 pb-3">
          {summary.panel.gemini && (
            <div className="rounded border border-foreground/15 bg-background/40 p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Examiner Assessment</p>
              <p className="text-base font-bold">{summary.panel.gemini.score}<span className="text-xs text-muted-foreground font-normal">/100</span></p>
            </div>
          )}
          {summary.panel.claude && (
            <div className="rounded border border-foreground/15 bg-background/40 p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Co-Examiner Cross-Check</p>
              <p className="text-base font-bold">{summary.panel.claude.score}<span className="text-xs text-muted-foreground font-normal">/100</span></p>
            </div>
          )}
        </div>
      )}

      {summary.questionBreakdown && summary.questionBreakdown.length > 0 && (
        <div className="border-b border-dashed border-foreground/25 pb-3">
          <p className="text-xs font-bold uppercase tracking-wider mb-2">Question-wise Break-up</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-foreground/30 text-left">
                  <th className="py-1.5 pr-2 font-semibold w-8">#</th>
                  <th className="py-1.5 pr-2 font-semibold">Question</th>
                  <th className="py-1.5 pl-2 font-semibold text-right w-16">Marks</th>
                </tr>
              </thead>
              <tbody>
                {summary.questionBreakdown.map((q, i) => (
                  <tr key={i} className="border-b border-foreground/10 align-top">
                    <td className="py-2 pr-2 text-muted-foreground">{i + 1}.</td>
                    <td className="py-2 pr-2">
                      <p className="font-medium">{q.question}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5"><span className="font-semibold text-foreground/70">Answered:</span> {q.studentAnswer || "—"}</p>
                      <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground/70">Expected:</span> {q.idealAnswer}</p>
                    </td>
                    <td className="py-2 pl-2 text-right font-bold whitespace-nowrap">{q.marks}/{q.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(summary.strengths.length > 0 || summary.improvements.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-dashed border-foreground/25 pb-3">
          {summary.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Strengths</p>
              <ul className="space-y-1">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm"><CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.improvements.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Areas to Improve</p>
              <ul className="space-y-1">
                {summary.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm"><AlertTriangle size={12} className="text-amber-600 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Examiner's Remarks</p>
        <p className="text-xs sm:text-sm italic">"{summary.verdict}"</p>
      </div>

      <div className="flex items-end justify-between pt-4 mt-2">
        <div className="text-center">
          <p className="text-sm italic font-semibold" style={{ fontFamily: "cursive" }}>{summary.examinerName ?? "Examiner"}</p>
          <p className="text-[10px] text-muted-foreground border-t border-foreground/30 pt-1 mt-1 px-4">Examiner's Signature</p>
        </div>
        <Award size={28} className="text-primary/60" />
      </div>
    </div>
  );
}
