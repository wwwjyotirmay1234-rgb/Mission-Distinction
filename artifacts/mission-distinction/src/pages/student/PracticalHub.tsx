import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Stethoscope, Mic, Square, PhoneOff, Loader2, Award, CheckCircle2, AlertTriangle, ArrowRight, Sparkles,
  Search, Users, ChevronLeft, Volume2, TrendingUp, ZoomIn, ZoomOut, MessageSquare, Send, BarChart2,
  GraduationCap, FlaskConical, X, BookOpen, Brain, ListChecks, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceRecorder, useAudioPlayback } from "@workspace/integrations-openai-ai-react";
import { PHYSIOLOGY_CLINICAL_IMAGES, type PhysiologyClinicalImage } from "@/data/physiologyClinicalImages";
import { PHYSIOLOGY_HEMATOLOGY_IMAGES } from "@/data/physiologyHematologyImages";
import { BIOCHEMISTRY_SERUM_URINE_IMAGES } from "@/data/biochemistryImages";
import VivaRooms from "@/pages/student/VivaRooms";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const ALL_SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type Subject = (typeof ALL_SUBJECTS)[number];

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

// Predefined region/topic filter options per anatomy image viva type
const ANATOMY_REGION_OPTIONS: Partial<Record<AnatomyVivaType, string[]>> = {
  Histology: ["GI Tract", "Endocrine", "Reproductive", "Respiratory", "Neural", "Musculoskeletal", "Lymphoid", "Urinary", "Cardiovascular"],
  Bone: ["Upper Limb", "Lower Limb", "Thorax", "Pelvis", "Head and Neck", "Vertebral Column"],
  Visceral: ["Thorax", "Abdomen", "Pelvis"],
  "Section Anatomy": ["Head and Neck", "Thorax", "Abdomen", "Pelvis", "Upper Limb", "Lower Limb", "Brain"],
  Prosection: ["Upper Limb", "Lower Limb", "Head and Neck", "Thorax", "Abdomen"],
};

type VivaType = PhysiologyVivaType | BiochemistryVivaType | AnatomyVivaType;

const ANSWER_WINDOW_SECONDS = 50;
const ANSWER_HURRY_UP_SECONDS = 15;
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
  | "section_ended"
  | "history"
  | "teach_back_setup"
  | "teach_back_recording"
  | "teach_back_processing"
  | "teach_back_result"
  | "teach_back_history";

type VoiceEvent =
  | { type: "user_transcript"; data: string }
  | { type: "transcript"; data: string }
  | { type: "audio"; data: string }
  | { type: "station_image"; imageId: number; imageUrl: string }
  | { type: "station_image_arrow"; arrowTarget: { label: string; x: number; y: number } }
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

interface VivaHistoryRow {
  id: number;
  subject: string;
  vivaType: string | null;
  score: number;
  createdAt: string;
}

interface AnatomyImageInfo {
  id: number;
  title: string;
  side: string | null;
  region: string | null;
  notes: string | null;
  category: string;
}

interface TeachBackFeedback {
  transcript: string;
  score: number;
  coveredPoints: string[];
  missedPoints: string[];
  clinicalCorrelatesMissed: string[];
  feedbackText: string;
}

interface TeachBackHistoryRow {
  id: number;
  topic: string;
  subject: string;
  transcript: string | null;
  score: number | null;
  feedbackJson: {
    coveredPoints: string[];
    missedPoints: string[];
    clinicalCorrelatesMissed: string[];
    feedbackText: string;
  };
  createdAt: string;
}

export default function PracticalHub() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject>(ALL_SUBJECTS[0]);
  const [subject, setSubject] = useState<Subject>(ALL_SUBJECTS[0]);
  const [selectedPhysiologyVivaType, setSelectedPhysiologyVivaType] = useState<PhysiologyVivaType>(PHYSIOLOGY_VIVA_TYPES[0]);
  const [selectedBiochemistryVivaType, setSelectedBiochemistryVivaType] = useState<BiochemistryVivaType>(BIOCHEMISTRY_VIVA_TYPES[0]);
  const [selectedAnatomyVivaType, setSelectedAnatomyVivaType] = useState<AnatomyVivaType>(ANATOMY_VIVA_TYPES[0]);
  const [vivaType, setVivaType] = useState<VivaType | null>(null);
  const [clinicalImage, setClinicalImage] = useState<PhysiologyClinicalImage | null>(null);
  const [anatomyStationImage, setAnatomyStationImage] = useState<{ id: number; url: string; arrowTarget?: { label: string; x: number; y: number } } | null>(null);
  const anatomyStationImageRef = useRef<{ id: number; url: string; arrowTarget?: { label: string; x: number; y: number } } | null>(null);
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

  // Feature 5: Practice vs Exam mode
  const [practiceMode, setPracticeMode] = useState(true);
  // Feature 4: Region filter for anatomy image stations
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string[]>([]);
  // Feature 1: Image zoom
  const [imageZoomed, setImageZoomed] = useState(false);
  // Feature 2: Labeled reveal after session ends
  const [endedAnatomyImageId, setEndedAnatomyImageId] = useState<number | null>(null);
  const [anatomyImageInfo, setAnatomyImageInfo] = useState<AnatomyImageInfo | null>(null);
  // Feature 7: History
  const [historyRows, setHistoryRows] = useState<VivaHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Feature 9: Text mode
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textSubmitting, setTextSubmitting] = useState(false);
  // Teach-Back Mode
  const [tbSubject, setTbSubject] = useState<Subject>("Physiology");
  const [tbTopic, setTbTopic] = useState("");
  const [tbSecondsLeft, setTbSecondsLeft] = useState(90);
  const [tbResult, setTbResult] = useState<TeachBackFeedback | null>(null);
  const [tbHistory, setTbHistory] = useState<TeachBackHistoryRow[]>([]);
  const [tbHistoryLoading, setTbHistoryLoading] = useState(false);
  const tbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const practiceModeRef = useRef(practiceMode);
  practiceModeRef.current = practiceMode;
  const vivaTypeRef = useRef(vivaType);
  vivaTypeRef.current = vivaType;

  const recorder = useVoiceRecorder();
  const playback = useAudioPlayback("/audio-playback-worklet.js");

  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRequestRef = useRef<AbortController | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderStateRef = useRef(recorder.state);
  recorderStateRef.current = recorder.state;
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  const subjectRef = useRef(subject);
  subjectRef.current = subject;
  const topicRef = useRef(topic);
  topicRef.current = topic;
  const clinicalImageRef = useRef(clinicalImage);
  clinicalImageRef.current = clinicalImage;

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
      if (timerRef.current) clearInterval(timerRef.current);
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
      if (tbTimerRef.current) clearInterval(tbTimerRef.current);
      playbackRef.current.clear();
      if (recorderRef.current.state === "recording") {
        recorderRef.current.stopRecording().catch(() => {});
      }
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
              setImageZoomed(false);
            } else if (event.type === "station_image_arrow") {
              setAnatomyStationImage((prev) => prev ? { ...prev, arrowTarget: event.arrowTarget } : prev);
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
      const match = pool.find(
        (img) =>
          img.topic.toLowerCase().includes(trimmedTopic) ||
          trimmedTopic.includes(img.topic.toLowerCase()) ||
          img.caption.toLowerCase().includes(trimmedTopic)
      );
      return match ?? null;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const autoSubmitOnTimeout = useCallback(async () => {
    if (recorderStateRef.current !== "recording") return;
    toast.info("Time's up — submitting your answer.");
    const blob = await recorder.stopRecording();
    setState("processing");
    const audio = await blobToBase64(blob);
    await streamTurn("/api/practical-hub/viva/turn-voice", {
      subject: subjectRef.current,
      topic: topicRef.current,
      history: turnsRef.current,
      vivaType: vivaTypeRef.current ?? undefined,
      imageCaption: clinicalImageRef.current?.caption ?? undefined,
      imageId: anatomyStationImageRef.current?.id,
      arrowLabel: anatomyStationImageRef.current?.arrowTarget?.label,
      practiceMode: practiceModeRef.current,
      audio,
    });
  }, [recorder, streamTurn]);

  const startViva = async () => {
    playback.init().catch(() => {});

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
    setEndedAnatomyImageId(null);
    setAnatomyImageInfo(null);
    setImageZoomed(false);
    setTextMode(false);
    setTextInput("");
    setTurns([]);
    turnsRef.current = [];
    setLiveUserText("");
    setLiveExaminerText("");
    setElapsed(0);
    clearAnswerTimer();
    setSectionSummary(null);

    const examinerName = EXAMINER_BY_SUBJECT[selectedSubject];
    const lines = ENTRANCE_LINES[examinerName] ?? ["Come in, take a seat."];
    setEntranceLine(lines[Math.floor(Math.random() * lines.length)]);
    setState("entrance");
    await new Promise((resolve) => setTimeout(resolve, ENTRANCE_BEAT_MS));

    setState("connecting");

    const hasRegionFilter =
      isAnatomy &&
      chosenVivaType != null &&
      chosenVivaType !== "Theory" &&
      selectedRegionFilter.length > 0;

    await streamTurn("/api/practical-hub/viva/start-voice", {
      subject: selectedSubject,
      topic,
      vivaType: chosenVivaType ?? undefined,
      imageCaption: chosenImage?.caption ?? undefined,
      practiceMode,
      regionFilter: hasRegionFilter ? selectedRegionFilter : undefined,
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
        arrowLabel: anatomyStationImageRef.current?.arrowTarget?.label,
        practiceMode,
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

  const handleTextSubmit = async () => {
    const text = textInput.trim();
    if (!text || textSubmitting) return;
    setTextInput("");
    setTextSubmitting(true);
    setState("processing");
    try {
      await streamTurn("/api/practical-hub/viva/turn-text", {
        subject,
        topic,
        history: turnsRef.current,
        vivaType: vivaType ?? undefined,
        imageCaption: clinicalImage?.caption ?? undefined,
        imageId: anatomyStationImageRef.current?.id,
        arrowLabel: anatomyStationImageRef.current?.arrowTarget?.label,
        practiceMode,
        text,
      });
    } finally {
      setTextSubmitting(false);
    }
  };

  const endSection = async () => {
    currentRequestRef.current?.abort();
    clearAnswerTimer();
    if (recorder.state === "recording") await recorder.stopRecording();

    const endedImageId = anatomyStationImageRef.current?.id ?? null;
    setEndedAnatomyImageId(endedImageId);
    setState("section_ended");

    if (endedImageId) {
      apiFetch(`/api/anatomy-viva-images/info/${endedImageId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setAnatomyImageInfo(data as AnatomyImageInfo); })
        .catch(() => {});
    }

    if (turnsRef.current.length === 0) {
      setSectionSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const res = await apiFetch("/api/practical-hub/viva/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          vivaType: vivaType ?? undefined,
          history: turnsRef.current,
          imageId: endedImageId,
        }),
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

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch("/api/practical-hub/viva/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryRows(data.sessions ?? []);
      }
    } catch {
      toast.error("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const doStopAndSubmitRef = useRef<(() => Promise<void>) | null>(null);

  const doStopAndSubmit = async () => {
    if (tbTimerRef.current) { clearInterval(tbTimerRef.current); tbTimerRef.current = null; }
    setState("teach_back_processing");
    try {
      const blob = await recorderRef.current.stopRecording();
      if (!blob) { toast.error("Recording failed — no audio captured."); setState("teach_back_setup"); return; }
      const audioBase64 = await blobToBase64(blob);
      const res = await apiFetch("/api/practical-hub/teach-back", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: tbTopic.trim(), subject: tbSubject, audioBase64 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as any).error || "Failed to analyse your explanation.");
        setState("teach_back_setup");
        return;
      }
      const data = await res.json();
      setTbResult(data as TeachBackFeedback);
      setState("teach_back_result");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit your explanation.");
      setState("teach_back_setup");
    }
  };
  doStopAndSubmitRef.current = doStopAndSubmit;

  const startTeachBackRecording = async () => {
    if (!tbTopic.trim()) { toast.error("Please enter a topic first."); return; }
    try {
      await recorder.startRecording();
      setTbSecondsLeft(90);
      setState("teach_back_recording");
      tbTimerRef.current = setInterval(() => {
        setTbSecondsLeft((s) => {
          if (s <= 1) {
            if (tbTimerRef.current) { clearInterval(tbTimerRef.current); tbTimerRef.current = null; }
            doStopAndSubmitRef.current?.();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const loadTeachBackHistory = async () => {
    setTbHistoryLoading(true);
    try {
      const res = await apiFetch("/api/practical-hub/teach-back/history");
      if (res.ok) {
        const data = await res.json();
        setTbHistory(data.sessions ?? []);
      }
    } catch {
      toast.error("Failed to load teach-back history.");
    } finally {
      setTbHistoryLoading(false);
    }
  };

  if (state === "home") {
    const tiles: {
      key: string;
      icon: React.ReactNode;
      title: string;
      description: string;
      badge?: string;
      onClick: () => void;
    }[] = [
      {
        key: "ai-viva",
        icon: <Mic size={22} className="text-primary" />,
        title: "AI Viva Simulator",
        description: "Spoken viva voce with an AI examiner across Anatomy, Physiology & Biochemistry.",
        badge: "Voice",
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
      {
        key: "history",
        icon: <BarChart2 size={22} className="text-primary" />,
        title: "My Viva History",
        description: "Score trends across all your completed viva sessions — see where you're improving.",
        onClick: () => { setState("history"); loadHistory(); },
      },
      {
        key: "teach-back",
        icon: <Brain size={22} className="text-primary" />,
        title: "Teach-Back Mode",
        description: "Record a 90-second voice explanation of any topic — AI gives structured feedback on what you covered and missed.",
        badge: "New",
        onClick: () => { setTbTopic(""); setState("teach_back_setup"); },
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
              className="bg-card/40 border-border/40 transition-colors group hover:bg-card/60 hover:border-primary/30 cursor-pointer"
              onClick={tile.onClick}
            >
              <CardContent className="p-5 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  {tile.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm">{tile.title}</p>
                    {tile.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${tile.badge === "Live" ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-primary/30 text-primary bg-primary/10"}`}>
                        {tile.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tile.description}
                  </p>
                </div>
                <ArrowRight size={15} className="text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
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

  if (state === "history") {
    const chartData = [...historyRows].reverse().map((row, i) => ({
      n: i + 1,
      score: row.score,
      subject: row.subject,
      type: row.vivaType ?? row.subject,
      label: new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    }));

    const bySubject: Record<string, { sessions: number; avg: number }> = {};
    for (const row of historyRows) {
      if (!bySubject[row.subject]) bySubject[row.subject] = { sessions: 0, avg: 0 };
      bySubject[row.subject].sessions += 1;
      bySubject[row.subject].avg += row.score;
    }
    for (const key of Object.keys(bySubject)) {
      bySubject[key].avg = Math.round(bySubject[key].avg / bySubject[key].sessions);
    }

    return (
      <div className="space-y-5 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setState("home")}>
            <ChevronLeft size={16} /> Practical Hub
          </Button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BarChart2 size={20} className="text-primary" /> My Viva History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your last {historyRows.length} viva sessions.</p>
        </div>

        {historyLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading history…
          </div>
        ) : historyRows.length === 0 ? (
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No viva sessions recorded yet. Complete a viva to see your score history here.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(bySubject).map(([subj, stats]) => (
                <Card key={subj} className="bg-card/40 border-border/40">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{subj}</p>
                    <p className="text-2xl font-bold">{stats.avg}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground">{stats.sessions} session{stats.sessions !== 1 ? "s" : ""}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Score Trend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number, _name: string, props: any) => [`${value}/100 — ${props.payload.type}`, "Score"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Sessions</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {historyRows.map((row) => (
                    <div key={row.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/20 last:border-0">
                      <div>
                        <span className="font-medium">{row.subject}</span>
                        {row.vivaType && <span className="text-muted-foreground"> — {row.vivaType}</span>}
                        <span className="text-muted-foreground ml-2">{new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                      </div>
                      <span className={`font-bold ${row.score >= 75 ? "text-emerald-500" : row.score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                        {row.score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  if (state === "teach_back_setup") {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setState("home")}>
            <ChevronLeft size={16} /> Practical Hub
          </Button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Brain size={20} className="text-primary" /> Teach-Back Mode
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Record a 90-second explanation of any topic as if teaching a classmate — get AI feedback on what you covered and missed.
          </p>
        </div>
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
              <Select value={tbSubject} onValueChange={(v) => setTbSubject(v as Subject)}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic to Explain</label>
              <Input
                value={tbTopic}
                onChange={(e) => setTbTopic(e.target.value)}
                placeholder="e.g. Cardiac Cycle, Krebs Cycle, Brachial Plexus..."
                className="bg-background/50 border-border/50"
                onKeyDown={(e) => { if (e.key === "Enter" && tbTopic.trim()) startTeachBackRecording(); }}
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Choose any topic from the {tbSubject} Phase I syllabus. You'll have 90 seconds to explain it out loud.
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed flex gap-2">
              <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
              <span>
                Speak as if teaching a batchmate — cover the key points, mechanisms, and clinical significance. AI will give you a score and tell you exactly what you covered and what you missed.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startTeachBackRecording} disabled={!tbTopic.trim()} className="gap-2">
                <Mic size={15} /> Start Recording (90 s)
              </Button>
              <Button variant="outline" onClick={() => { setState("teach_back_history"); loadTeachBackHistory(); }} className="gap-2">
                <BarChart2 size={14} /> View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "teach_back_recording") {
    const pct = Math.round(((90 - tbSecondsLeft) / 90) * 100);
    return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Brain size={20} className="text-primary" /> Teach-Back
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{tbSubject} — {tbTopic}</p>
        </div>
        <Card className="bg-gradient-to-b from-card/60 to-card/30 border-red-500/30">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-5">
              <div className="relative w-24 h-24 rounded-full bg-red-500/20 ring-4 ring-red-500/30 flex items-center justify-center">
                <Mic size={34} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-500">Recording...</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Explain <span className="font-semibold text-foreground">"{tbTopic}"</span> as if teaching a batchmate. Cover mechanisms, key facts, and clinical relevance.
                </p>
              </div>
              <div className="flex items-end gap-1 h-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-red-500/70 animate-pulse"
                    style={{ height: `${6 + ((i * 7) % 18)}px`, animationDuration: `${0.6 + (i % 4) * 0.15}s`, animationDelay: `${i * 0.07}s` }}
                  />
                ))}
              </div>
              <div className={`text-3xl font-mono font-bold ${tbSecondsLeft <= 15 ? "text-red-500" : "text-foreground"}`}>
                {Math.floor(tbSecondsLeft / 60)}:{String(tbSecondsLeft % 60).padStart(2, "0")}
                <span className="text-sm font-normal text-muted-foreground ml-2">remaining</span>
              </div>
              <div className="w-full max-w-xs bg-border/30 rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
              <Button
                onClick={() => doStopAndSubmitRef.current?.()}
                variant="outline"
                className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
              >
                <Square size={14} /> Stop & Submit Early
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "teach_back_processing") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-3xl mx-auto">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm font-medium">Analysing your explanation...</p>
        <p className="text-xs text-muted-foreground max-w-xs text-center">
          Transcribing your voice and checking coverage against the {tbSubject} syllabus. This takes a few seconds.
        </p>
      </div>
    );
  }

  if (state === "teach_back_result" && tbResult) {
    const scoreColor = tbResult.score >= 8 ? "text-emerald-500" : tbResult.score >= 5 ? "text-amber-500" : "text-red-500";
    const scoreBg = tbResult.score >= 8 ? "bg-emerald-500/10 border-emerald-500/30" : tbResult.score >= 5 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30";
    return (
      <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setState("teach_back_setup")}>
            <ChevronLeft size={16} /> Teach-Back
          </Button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Brain size={20} className="text-primary" /> Teach-Back Feedback
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{tbSubject} — {tbTopic}</p>
        </div>

        <Card className={`border ${scoreBg}`}>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Coverage Score</p>
              <p className={`text-4xl font-bold ${scoreColor}`}>{tbResult.score}<span className="text-base font-normal text-muted-foreground">/10</span></p>
            </div>
            <Award size={32} className={scoreColor} />
          </CardContent>
        </Card>

        {tbResult.feedbackText && (
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">AI Examiner's Remarks</p>
              <p className="text-sm leading-relaxed italic text-foreground/90">"{tbResult.feedbackText}"</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tbResult.coveredPoints.length > 0 && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                  <ListChecks size={13} /> Points Covered
                </p>
                <ul className="space-y-1.5">
                  {tbResult.coveredPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {tbResult.missedPoints.length > 0 && (
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5">
                  <XCircle size={13} /> Key Points Missed
                </p>
                <ul className="space-y-1.5">
                  {tbResult.missedPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                      <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {tbResult.clinicalCorrelatesMissed.length > 0 && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1.5">
                <Stethoscope size={13} /> Clinical Correlates Missed
              </p>
              <ul className="space-y-1.5">
                {tbResult.clinicalCorrelatesMissed.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                    <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {tbResult.transcript && (
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer select-none flex items-center gap-1.5 hover:text-foreground transition-colors">
              <ChevronLeft size={12} className="rotate-[-90deg] group-open:rotate-90 transition-transform" />
              Show transcript
            </summary>
            <Card className="bg-card/30 border-border/30 mt-2">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground leading-relaxed italic">"{tbResult.transcript}"</p>
              </CardContent>
            </Card>
          </details>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setTbTopic(""); setState("teach_back_setup"); }} className="gap-2">
            <Brain size={14} /> Try Another Topic
          </Button>
          <Button variant="outline" onClick={() => { setState("teach_back_history"); loadTeachBackHistory(); }} className="gap-2">
            <BarChart2 size={14} /> View History
          </Button>
        </div>
      </div>
    );
  }

  if (state === "teach_back_history") {
    return (
      <div className="space-y-5 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => setState("teach_back_setup")}>
            <ChevronLeft size={16} /> Teach-Back
          </Button>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BarChart2 size={20} className="text-primary" /> Teach-Back History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your last {tbHistory.length} teach-back sessions.</p>
        </div>

        {tbHistoryLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : tbHistory.length === 0 ? (
          <Card className="bg-card/40 border-border/40">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No teach-back sessions yet. Try explaining a topic to get structured feedback.
            </CardContent>
          </Card>
        ) : (() => {
          const chartData = [...tbHistory].reverse().map((row, i) => ({
            n: i + 1,
            score: row.score ?? 0,
            label: new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            topic: row.topic,
          }));
          const bySubject: Record<string, { sessions: number; total: number }> = {};
          for (const row of tbHistory) {
            if (!bySubject[row.subject]) bySubject[row.subject] = { sessions: 0, total: 0 };
            bySubject[row.subject].sessions += 1;
            bySubject[row.subject].total += row.score ?? 0;
          }
          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(bySubject).map(([subj, stats]) => {
                  const avg = Math.round(stats.total / stats.sessions * 10) / 10;
                  const avgColor = avg >= 8 ? "text-emerald-500" : avg >= 5 ? "text-amber-500" : "text-red-500";
                  return (
                    <Card key={subj} className="bg-card/40 border-border/40">
                      <CardContent className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{subj}</p>
                        <p className={`text-2xl font-bold ${avgColor}`}>{avg}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
                        <p className="text-xs text-muted-foreground">{stats.sessions} session{stats.sessions !== 1 ? "s" : ""}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Score Trend</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value: number, _name: string, props: any) => [`${value}/10 — ${props.payload.topic}`, "Score"]}
                      />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/40">
                <CardContent className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Sessions</p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {tbHistory.map((row) => {
                      const sc = row.score ?? 0;
                      const scoreColor = sc >= 8 ? "text-emerald-500" : sc >= 5 ? "text-amber-500" : "text-red-500";
                      return (
                        <div key={row.id} className="space-y-1 py-2 border-b border-border/20 last:border-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">{row.topic}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {row.subject} · {new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                              </p>
                            </div>
                            <span className={`text-base font-bold shrink-0 ${scoreColor}`}>
                              {sc}<span className="text-[10px] font-normal text-muted-foreground">/10</span>
                            </span>
                          </div>
                          {row.feedbackJson?.missedPoints?.length > 0 && (
                            <p className="text-[10px] text-red-400/80 truncate">
                              Missed: {row.feedbackJson.missedPoints.slice(0, 2).join("; ")}{row.feedbackJson.missedPoints.length > 2 ? "…" : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          );
        })()}

        <Button onClick={() => setState("teach_back_setup")} className="gap-2">
          <Brain size={14} /> New Teach-Back Session
        </Button>
      </div>
    );
  }

  if (state === "setup") {
    const isAnatomyImageType =
      selectedSubject === "Anatomy" &&
      (selectedAnatomyVivaType === "Histology" ||
        selectedAnatomyVivaType === "Bone" ||
        selectedAnatomyVivaType === "Visceral" ||
        selectedAnatomyVivaType === "Section Anatomy" ||
        selectedAnatomyVivaType === "Prosection");
    const regionOptions = isAnatomyImageType ? (ANATOMY_REGION_OPTIONS[selectedAnatomyVivaType] ?? []) : [];

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
              <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v as Subject); setSelectedRegionFilter([]); }}>
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
                <Select value={selectedAnatomyVivaType} onValueChange={(v) => { setSelectedAnatomyVivaType(v as AnatomyVivaType); setSelectedRegionFilter([]); }}>
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

            {/* Feature 4: Topic/Region filter for anatomy image-based stations */}
            {isAnatomyImageType && regionOptions.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Filter by Region <span className="text-[10px] text-muted-foreground/60">(optional — all regions if none selected)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {regionOptions.map((region) => {
                    const selected = selectedRegionFilter.includes(region);
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => setSelectedRegionFilter((prev) =>
                          selected ? prev.filter((r) => r !== region) : [...prev, region]
                        )}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          selected
                            ? "bg-primary/20 border-primary/40 text-primary font-medium"
                            : "bg-card/40 border-border/40 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic Focus (Optional)</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Cranial Nerves, Cardiac Cycle..." className="bg-background/50 border-border/50" />
            </div>

            {/* Feature 5: Practice vs Exam mode toggle */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mode</label>
              <div className="flex rounded-lg overflow-hidden border border-border/50 w-fit">
                <button
                  type="button"
                  onClick={() => setPracticeMode(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    practiceMode ? "bg-primary text-primary-foreground" : "bg-background/50 text-muted-foreground hover:bg-card/60"
                  }`}
                >
                  <BookOpen size={13} /> Practice
                </button>
                <button
                  type="button"
                  onClick={() => setPracticeMode(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    !practiceMode ? "bg-primary text-primary-foreground" : "bg-background/50 text-muted-foreground hover:bg-card/60"
                  }`}
                >
                  <GraduationCap size={13} /> Exam
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {practiceMode
                  ? "Practice: examiner may offer a gentle hint if you're genuinely stuck."
                  : "Exam: no hints — exactly like a real university viva."}
              </p>
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

        {/* Feature 2: Labeled reveal of anatomy image after session ends */}
        {endedAnatomyImageId && (
          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Specimen Reveal</p>
              <img
                src={`/api/anatomy-viva-images/serve/${endedAnatomyImageId}?token=${encodeURIComponent(localStorage.getItem("mission_token") ?? "")}`}
                alt="Anatomy specimen"
                className="w-full max-w-sm mx-auto object-contain rounded-lg bg-background/40 border border-border/30"
              />
              {anatomyImageInfo ? (
                <div className="rounded-lg bg-card/60 border border-border/30 p-3 space-y-1.5">
                  <p className="font-bold text-sm text-foreground">
                    {anatomyImageInfo.title}{anatomyImageInfo.side ? ` (${anatomyImageInfo.side})` : ""}
                  </p>
                  {anatomyImageInfo.region && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/80">Region:</span> {anatomyImageInfo.region}</p>
                  )}
                  {anatomyImageInfo.notes && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/80">Key notes:</span> {anatomyImageInfo.notes}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Loading specimen details…
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setState("setup")} className="gap-1.5">
                Start Another Viva <ArrowRight size={15} />
              </Button>
              <Button variant="outline" onClick={() => { setState("history"); loadHistory(); }} className="gap-1.5">
                <BarChart2 size={14} /> View History
              </Button>
            </div>
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
                {practiceMode && (
                  <p className="text-[10px] text-primary/70 mt-2 flex items-center justify-center gap-1">
                    <BookOpen size={10} /> Practice Mode — hints available if you're stuck
                  </p>
                )}
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
            {practiceMode && <span className="ml-2 text-primary/60 text-[10px]">Practice</span>}
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
              className="w-full max-w-md object-contain rounded-lg bg-background/40 border border-border/30"
            />
            <div className="text-xs text-muted-foreground leading-relaxed text-center">
              <p className="font-semibold text-sm text-foreground mb-0.5">{clinicalImage.topic}</p>
              <p className="text-[10px] text-muted-foreground">{clinicalImage.displayCaption}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {anatomyStationImage && (state === "examiner_speaking" || state === "listening" || isRecording || state === "processing") && (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <CardContent className="p-3 flex flex-col gap-3 items-center">
            {/* Feature 1: Zoom button + CSS zoom on anatomy images */}
            <div className="relative w-full max-w-md">
              <div
                className={`overflow-hidden rounded-lg transition-transform duration-200 ${imageZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                style={{ touchAction: "pinch-zoom" }}
                onClick={() => setImageZoomed((z) => !z)}
              >
                <img
                  src={`${anatomyStationImage.url}${anatomyStationImage.url.includes("?") ? "&" : "?"}token=${encodeURIComponent(localStorage.getItem("mission_token") ?? "")}`}
                  alt={`${vivaType ?? "Anatomy"} specimen`}
                  className="w-full object-contain bg-background/40 border border-border/30 transition-transform duration-200"
                  style={{ transform: imageZoomed ? "scale(2)" : "scale(1)", transformOrigin: "center center" }}
                />
              </div>
              {anatomyStationImage.arrowTarget && !imageZoomed && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  overflow="visible"
                >
                  <defs>
                    <marker id="red-tip" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                      <polygon points="0,0 6,0 3,6" fill="#ef4444" />
                    </marker>
                  </defs>
                  <line
                    x1={anatomyStationImage.arrowTarget.x}
                    y1={Math.max(2, anatomyStationImage.arrowTarget.y - 16)}
                    x2={anatomyStationImage.arrowTarget.x}
                    y2={anatomyStationImage.arrowTarget.y - 2}
                    stroke="#ef4444"
                    strokeWidth="1.8"
                    markerEnd="url(#red-tip)"
                  />
                  <circle cx={anatomyStationImage.arrowTarget.x} cy={anatomyStationImage.arrowTarget.y} r="1.8" fill="#ef4444" opacity="0.85" />
                </svg>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImageZoomed((z) => !z); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                title={imageZoomed ? "Zoom out" : "Zoom in"}
              >
                {imageZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
              </button>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed text-center">
              <p className="font-bold uppercase tracking-wider text-[10px] text-primary mb-1">
                {vivaType} Spotter {imageZoomed && <span className="text-muted-foreground font-normal">(tap to zoom out)</span>}
              </p>
              {anatomyStationImage.arrowTarget
                ? "Identify the structure indicated by the red arrow."
                : "Identify the structure shown and be ready for follow-up questions."}
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
                {state === "listening" && !isRecording && !textMode && "Your turn — tap the mic when ready"}
                {state === "listening" && !isRecording && textMode && "Your turn — type your answer below"}
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

            {/* Feature 9: Text mode input */}
            {textMode && state === "listening" && !isBusy && (
              <div className="w-full max-w-sm flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                  placeholder="Type your answer…"
                  className="bg-background/60 border-border/50 text-sm"
                  autoFocus
                  disabled={textSubmitting}
                />
                <Button
                  size="icon"
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || textSubmitting}
                  className="shrink-0"
                >
                  {textSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            )}

            {!textMode && (
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
            )}
          </div>

          <div className="border-t border-border/40 px-4 py-3 flex justify-between items-center bg-card/40 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-muted-foreground">{turns.filter((t) => t.role === "user").length} answers given</p>
              {/* Feature 9: Text mode toggle button */}
              {!isBusy && !isRecording && (
                <button
                  type="button"
                  onClick={() => setTextMode((m) => !m)}
                  className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                    textMode
                      ? "border-primary/40 text-primary bg-primary/10"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <MessageSquare size={10} /> {textMode ? "Switch to mic" : "Type instead"}
                </button>
              )}
            </div>
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
    <div className="rounded-md border-2 border-slate-300 bg-[#faf8f2] p-4 sm:p-6 font-serif text-slate-800 space-y-4 shadow-sm">
      <div className="text-center border-b-2 border-slate-300 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Internal Assessment — Practical Examination</p>
        <p className="text-base sm:text-lg font-bold mt-1 text-slate-900">MBBS Phase I — Viva Voce Mark Sheet</p>
        <p className="text-[11px] text-slate-500 mt-0.5">AI Viva Simulator, Mission Distinction</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:text-sm border-b border-dashed border-slate-300 pb-3">
        <p><span className="text-slate-500">Student Name:</span> <span className="font-semibold text-slate-900">{user?.fullName ?? "—"}</span></p>
        <p><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900">{today}</span></p>
        <p><span className="text-slate-500">Subject:</span> <span className="font-semibold text-slate-900">{summary.subject}</span></p>
        <p><span className="text-slate-500">Examiner:</span> <span className="font-semibold text-slate-900">{summary.examinerName ?? "—"}</span></p>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-dashed border-slate-300 pb-3">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-900">Marks Obtained</p>
        <p className="text-2xl font-bold text-slate-900">
          {totalMarks}<span className="text-sm font-normal text-slate-500"> / {maxTotal}</span>
        </p>
      </div>

      {summary.panel && (summary.panel.gemini || summary.panel.claude) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-dashed border-slate-300 pb-3">
          {summary.panel.gemini && (
            <div className="rounded border border-slate-300 bg-white/60 p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Examiner Assessment</p>
              <p className="text-base font-bold text-slate-900">{summary.panel.gemini.score}<span className="text-xs text-slate-500 font-normal">/100</span></p>
            </div>
          )}
          {summary.panel.claude && (
            <div className="rounded border border-slate-300 bg-white/60 p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Co-Examiner Cross-Check</p>
              <p className="text-base font-bold text-slate-900">{summary.panel.claude.score}<span className="text-xs text-slate-500 font-normal">/100</span></p>
            </div>
          )}
        </div>
      )}

      {summary.questionBreakdown && summary.questionBreakdown.length > 0 && (
        <div className="border-b border-dashed border-slate-300 pb-3">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-900">Question-wise Break-up</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-400 text-left">
                  <th className="py-1.5 pr-2 font-semibold w-8 text-slate-900">#</th>
                  <th className="py-1.5 pr-2 font-semibold text-slate-900">Question</th>
                  <th className="py-1.5 pl-2 font-semibold text-right w-16 text-slate-900">Marks</th>
                </tr>
              </thead>
              <tbody>
                {summary.questionBreakdown.map((q, i) => (
                  <tr key={i} className="border-b border-slate-200 align-top">
                    <td className="py-2 pr-2 text-slate-500">{i + 1}.</td>
                    <td className="py-2 pr-2">
                      <p className="font-medium text-slate-900">{q.question}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5"><span className="font-semibold text-slate-700">Answered:</span> {q.studentAnswer || "—"}</p>
                      <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-700">Expected:</span> {q.idealAnswer}</p>
                    </td>
                    <td className="py-2 pl-2 text-right font-bold whitespace-nowrap text-slate-900">{q.marks}/{q.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(summary.strengths.length > 0 || summary.improvements.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-dashed border-slate-300 pb-3">
          {summary.strengths.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Strengths</p>
              <ul className="space-y-1">
                {summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-800"><CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
          )}
          {summary.improvements.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Areas to Improve</p>
              <ul className="space-y-1">
                {summary.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-800"><AlertTriangle size={12} className="text-amber-600 mt-0.5 shrink-0" />{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Examiner's Remarks</p>
        <p className="text-xs sm:text-sm italic text-slate-800">"{summary.verdict}"</p>
      </div>

      <div className="flex items-end justify-between pt-4 mt-2">
        <div className="text-center">
          <p className="text-sm italic font-semibold text-slate-900" style={{ fontFamily: "cursive" }}>{summary.examinerName ?? "Examiner"}</p>
          <p className="text-[10px] text-slate-500 border-t border-slate-400 pt-1 mt-1 px-4">Examiner's Signature</p>
        </div>
        <Award size={28} className="text-primary/70" />
      </div>
    </div>
  );
}
