import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Eye, EyeOff, Mic, MicOff, Phone, ShieldCheck, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type MonitorStatus = "ready" | "focused" | "looking-away" | "eyes-closed" | "phone-detected" | "no-face";

const statusCopy: Record<MonitorStatus, { label: string; className: string; speech?: string }> = {
  ready: { label: "Ready", className: "bg-muted text-muted-foreground" },
  focused: { label: "Focused", className: "bg-emerald-500/15 text-emerald-400" },
  "looking-away": { label: "Looking away", className: "bg-amber-500/15 text-amber-400", speech: "Please look at your study material." },
  "eyes-closed": { label: "Eyes closed", className: "bg-amber-500/15 text-amber-400", speech: "You appear to be sleepy. Sit up and stay focused." },
  "phone-detected": { label: "Phone detected", className: "bg-rose-500/15 text-rose-400", speech: "Please put your phone away and return to studying." },
  "no-face": { label: "No face detected", className: "bg-rose-500/15 text-rose-400", speech: "Wake up and study!" },
};

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function SmartStudyMonitor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const detectorRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const lastSpeechRef = useRef<Record<string, number>>({});
  const statusSinceRef = useRef(Date.now());
  const lastFrameRef = useRef(0);
  const eyesClosedSinceRef = useRef<number | null>(null);
  const focusedSecondsRef = useRef(0);
  const totalSecondsRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<MonitorStatus>("ready");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [loading, setLoading] = useState(false);

  const announce = useCallback((next: MonitorStatus) => {
    const message = statusCopy[next].speech;
    if (!message || !voiceEnabled) return;
    const now = Date.now();
    if (now - (lastSpeechRef.current[next] ?? 0) < 12000) return;
    lastSpeechRef.current[next] = now;
    speak(message);
    setWarnings(value => value + 1);
  }, [voiceEnabled]);

  const setMonitorStatus = useCallback((next: MonitorStatus) => {
    setStatus(previous => {
      if (previous !== next) {
        statusSinceRef.current = Date.now();
        if (next !== "focused" && next !== "ready") announce(next);
      }
      return next;
    });
  }, [announce]);

  const stop = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    window.speechSynthesis?.cancel();
    setRunning(false);
    setStatus("ready");
  }, []);

  const monitorFrame = useCallback(async (timestamp: number) => {
    if (!running || !videoRef.current || !landmarkerRef.current || timestamp - lastFrameRef.current < 700) {
      if (running) animationRef.current = requestAnimationFrame(monitorFrame);
      return;
    }
    lastFrameRef.current = timestamp;
    const video = videoRef.current;
    const result = landmarkerRef.current.detectForVideo(video, timestamp);
    const faces = result.faceLandmarks ?? [];
    let next: MonitorStatus = "no-face";
    if (faces.length > 0) {
      const landmarks = faces[0];
      const leftEye = result.faceBlendshapes?.[0]?.categories?.find((item: any) => item.categoryName === "eyeBlinkLeft")?.score ?? 0;
      const rightEye = result.faceBlendshapes?.[0]?.categories?.find((item: any) => item.categoryName === "eyeBlinkRight")?.score ?? 0;
      const eyesClosed = leftEye > 0.55 && rightEye > 0.55;
      if (eyesClosed) {
        eyesClosedSinceRef.current ??= timestamp;
        next = timestamp - eyesClosedSinceRef.current > 7000 ? "eyes-closed" : "focused";
      } else {
        eyesClosedSinceRef.current = null;
        const nose = landmarks[1];
        next = nose && (nose.x < 0.28 || nose.x > 0.72) ? "looking-away" : "focused";
      }
      if (detectorRef.current) {
        const detections = detectorRef.current.detectForVideo(video, timestamp).detections ?? [];
        if (detections.some((d: any) => d.categories?.some((c: any) => c.categoryName === "cell phone" && c.score > 0.45))) {
          next = "phone-detected";
        }
      }
    } else {
      eyesClosedSinceRef.current = null;
    }
    setMonitorStatus(next);
    totalSecondsRef.current += 0.7;
    if (next === "focused") {
      focusedSecondsRef.current += 0.7;
      setFocusedSeconds(Math.round(focusedSecondsRef.current));
    }
    animationRef.current = requestAnimationFrame(monitorFrame);
  }, [running, setMonitorStatus]);

  useEffect(() => {
    if (running) animationRef.current = requestAnimationFrame(monitorFrame);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [running, monitorFrame]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera access is not supported in this browser.");
      return;
    }
    setLoading(true);
    try {
      const vision = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
      );
      landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
      try {
        detectorRef.current = await vision.ObjectDetector.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite",
          },
          runningMode: "VIDEO",
          scoreThreshold: 0.4,
          maxResults: 3,
        });
      } catch {
        detectorRef.current = null;
        toast.info("Face monitoring is ready. Phone detection model could not load.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setElapsed(0);
      setWarnings(0);
      focusedSecondsRef.current = 0;
      totalSecondsRef.current = 0;
      lastSpeechRef.current = {};
      setStatus("focused");
      setRunning(true);
      speak("Smart monitoring started. Stay focused.");
    } catch (error) {
      console.error("[SmartStudyMonitor]", error);
      toast.error("Camera permission or monitoring model could not be started.");
      stop();
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const focusScore = totalSecondsRef.current ? Math.round((focusedSeconds / totalSecondsRef.current) * 100) : 0;

  return (
    <Card className="border-primary/20 bg-card/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary" size={19} /> Smart Study Monitor</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Private camera-based focus support. Video stays on your device.</p>
          </div>
          <Badge className={statusCopy[status].className}>{statusCopy[status].label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video rounded-xl bg-muted/30 overflow-hidden border border-border/50">
          <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${running ? "" : "hidden"}`} />
          {!running && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"><Camera size={30} /><p className="text-sm">Camera monitoring is off</p></div>}
          {running && <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white"><span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> LIVE · local only</div>}
          {running && status !== "focused" && <div className="absolute inset-x-4 bottom-4 rounded-lg bg-black/70 px-3 py-2 text-center text-sm font-semibold text-white">{statusCopy[status].speech}</div>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/30 p-2"><div className="text-lg font-bold tabular-nums">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</div><div className="text-[10px] text-muted-foreground">Session time</div></div>
          <div className="rounded-lg bg-muted/30 p-2"><div className="text-lg font-bold tabular-nums">{focusScore}%</div><div className="text-[10px] text-muted-foreground">Focus score</div></div>
          <div className="rounded-lg bg-muted/30 p-2"><div className="text-lg font-bold tabular-nums">{warnings}</div><div className="text-[10px] text-muted-foreground">Voice alerts</div></div>
        </div>
        <Progress value={focusScore} className="h-1.5" />
        <div className="flex flex-wrap items-center gap-2">
          {!running ? <Button onClick={start} disabled={loading} className="gap-2">{loading ? "Loading monitor…" : <><Camera size={15} /> Start Monitoring</>}</Button> : <Button variant="destructive" onClick={stop} className="gap-2"><Square size={14} /> Stop Monitoring</Button>}
          <Button variant="outline" size="sm" onClick={() => setVoiceEnabled(value => !value)} className="gap-2">{voiceEnabled ? <Mic size={14} /> : <MicOff size={14} />}{voiceEnabled ? "Voice on" : "Voice off"}</Button>
          <Button variant="ghost" size="sm" onClick={() => speak("Please put your phone away and return to studying.")} className="gap-2"><Phone size={14} /> Test voice</Button>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {status === "focused" ? <Eye size={14} className="text-emerald-400" /> : <EyeOff size={14} className="text-amber-400" />}
          <span>Alerts trigger only after sustained distraction, not normal blinking.</span>
          {!running && <CameraOff size={14} className="ml-auto" />}
        </div>
      </CardContent>
    </Card>
  );
}