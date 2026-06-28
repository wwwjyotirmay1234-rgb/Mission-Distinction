import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen, Brain, Flame, Trophy, Zap, ChevronRight,
  GraduationCap, Users, FlaskConical, Bell, Lock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "md_onboarded_v2";

interface BotStep {
  kind: "bot";
  botMessage: string;
  features: { icon: React.ReactNode; label: string; desc: string }[];
}
interface LockedStep {
  kind: "locked";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  note: string;
  gradient: string;
}
type Step = BotStep | LockedStep;

const STEPS: Step[] = [
  {
    kind: "bot",
    botMessage: "👋 Hey! I'm Meddy, your AI study companion. Welcome to Mission Distinction — built just for 1st Year MBBS students in Odisha. Let me give you a quick tour!",
    features: [
      { icon: <GraduationCap size={16} className="text-purple-400" />, label: "100% Free", desc: "No paywalls, no subscriptions — ever." },
      { icon: <Zap size={16} className="text-amber-400" />, label: "XP & Ranks", desc: "Earn XP and rise from Intern to Consultant." },
      { icon: <Sparkles size={16} className="text-pink-400" />, label: "Dark & Light mode", desc: "Toggle in the header — your preference." },
    ],
  },
  {
    kind: "bot",
    botMessage: "🧠 Every day I'll throw quiz questions at you from Anatomy, Physiology, and Biochemistry. Answer them, earn XP, and keep your streak alive. Miss a day and your flame goes out! 🔥",
    features: [
      { icon: <Zap size={16} className="text-amber-400" />, label: "Daily MCQ Quizzes", desc: "Anatomy · Physiology · Biochemistry" },
      { icon: <Flame size={16} className="text-orange-400" />, label: "Study Streaks", desc: "Login daily to keep the streak going." },
      { icon: <Trophy size={16} className="text-yellow-400" />, label: "Leaderboard", desc: "National + your college rankings." },
    ],
  },
  {
    kind: "bot",
    botMessage: "📚 We've got curated notes, PDFs, reference books, flashcards, and mnemonics — all in one place. And if you're stuck on something, just ask me! I'm powered by AI and always here. 🤖",
    features: [
      { icon: <BookOpen size={16} className="text-blue-400" />, label: "Notes & PDFs", desc: "Curated study material, ready to read." },
      { icon: <Brain size={16} className="text-pink-400" />, label: "Flashcards & Mnemonics", desc: "Fast revision before exams." },
      { icon: <FlaskConical size={16} className="text-teal-400" />, label: "AI Doubt Solver", desc: "Ask me anything, anytime." },
    ],
  },
  {
    kind: "locked",
    icon: <Brain size={36} className="text-green-400" />,
    title: "3D Anatomy Hub",
    subtitle: "Explore the human body with 150 interactive 3D models and a cadaveric photo gallery.",
    note: "🔒 Access to the 3D Hub will be opened progressively. Stay active and earn your spot!",
    gradient: "from-green-500/15 to-emerald-500/8",
  },
  {
    kind: "bot",
    botMessage: "🏆 You're not studying alone! Join the community, post doubts, share confessions, and compete on the leaderboard. I'll also send you streak reminders so you never fall behind. You've got this! 💪",
    features: [
      { icon: <Trophy size={16} className="text-yellow-400" />, label: "College Leaderboard", desc: '"Top in SCB Medical" hits different.' },
      { icon: <Users size={16} className="text-rose-400" />, label: "Community", desc: "Posts, study rooms & confessions." },
      { icon: <Bell size={16} className="text-purple-400" />, label: "Push Reminders", desc: "Enable in Settings — never miss a day." },
    ],
  },
];

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idx.current = 0;
    const id = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, done };
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
      <span className="text-sm">🤖</span>
    </div>
  );
}

function BotStepView({
  step,
  onNext,
  isLast,
  onSkip,
  stepNum,
  total,
}: {
  step: BotStep;
  onNext: () => void;
  isLast: boolean;
  onSkip: () => void;
  stepNum: number;
  total: number;
}) {
  const { displayed, done } = useTypewriter(step.botMessage, 16);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  useEffect(() => {
    setFeaturesVisible(false);
    if (done) {
      const t = setTimeout(() => setFeaturesVisible(true), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [done]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-4 overflow-y-auto">
        <div className="flex items-start gap-3">
          <BotAvatar />
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-purple-400 mb-1">Meddy · AI Assistant</p>
            <div className="bg-muted/60 rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed text-foreground/90 min-h-[56px]">
              {displayed}
              {!done && <span className="inline-block w-0.5 h-3.5 bg-purple-400 ml-0.5 animate-pulse align-middle" />}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "space-y-2 transition-all duration-500",
            featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}
        >
          {step.features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-muted/30 border border-border/40 rounded-xl px-3.5 py-2.5"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div>
                <p className="text-xs font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3 border-t border-border/30 pt-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {stepNum} of {total}</span>
          <button onClick={onSkip} className="hover:text-foreground transition-colors">Skip tour</button>
        </div>
        <Progress value={(stepNum / total) * 100} className="h-1" />
        <Button
          onClick={onNext}
          disabled={!done && !featuresVisible}
          className="w-full gap-1.5"
        >
          {isLast ? "Let's go! 🚀" : <>Got it! <ChevronRight size={14} /></>}
        </Button>
      </div>
    </div>
  );
}

function LockedStepView({
  step,
  onNext,
  onSkip,
  stepNum,
  total,
}: {
  step: LockedStep;
  onNext: () => void;
  onSkip: () => void;
  stepNum: number;
  total: number;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className={`bg-gradient-to-br ${step.gradient} p-6 flex flex-col items-center text-center gap-3`}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-background/40 backdrop-blur flex items-center justify-center border border-border/40 opacity-60">
            {step.icon}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
            <Lock size={11} className="text-muted-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold leading-snug">{step.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-200/90 leading-relaxed">
          {step.note}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3 border-t border-border/30 pt-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {stepNum} of {total}</span>
          <button onClick={onSkip} className="hover:text-foreground transition-colors">Skip tour</button>
        </div>
        <Progress value={(stepNum / total) * 100} className="h-1" />
        <Button onClick={onNext} className="w-full gap-1.5">
          Understood <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export function OnboardingModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(LS_KEY);
    if (!done) setOpen(true);
  }, [user]);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem(LS_KEY, "1");
    setOpen(false);
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-border/60 gap-0 flex flex-col"
        style={{ maxHeight: "min(90vh, 560px)" }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {current.kind === "bot" ? (
          <BotStepView
            step={current}
            onNext={handleNext}
            isLast={isLast}
            onSkip={finish}
            stepNum={step + 1}
            total={STEPS.length}
          />
        ) : (
          <LockedStepView
            step={current}
            onNext={handleNext}
            onSkip={finish}
            stepNum={step + 1}
            total={STEPS.length}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
