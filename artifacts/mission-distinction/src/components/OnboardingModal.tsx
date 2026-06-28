import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen, Brain, Flame, Trophy, Zap, ChevronRight, CheckCircle2,
  GraduationCap, Users, FlaskConical, Bell,
} from "lucide-react";

const LS_KEY = "md_onboarded_v1";

interface Step {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: { icon: React.ReactNode; text: string }[];
  gradient: string;
}

const STEPS: Step[] = [
  {
    icon: <GraduationCap size={40} className="text-purple-400" />,
    title: "Welcome to Mission Distinction! 🎉",
    subtitle: "Your free MBBS companion built for Odisha students.",
    bullets: [
      { icon: <CheckCircle2 size={15} className="text-green-400 shrink-0" />, text: "100% free — no paywalls, ever" },
      { icon: <CheckCircle2 size={15} className="text-green-400 shrink-0" />, text: "Built for 1st Year MBBS students" },
      { icon: <CheckCircle2 size={15} className="text-green-400 shrink-0" />, text: "Dark & light mode — your preference" },
    ],
    gradient: "from-purple-500/20 to-indigo-500/10",
  },
  {
    icon: <Zap size={40} className="text-amber-400" />,
    title: "Daily Quizzes & XP",
    subtitle: "Learn by doing. Every quiz earns you XP and boosts your rank.",
    bullets: [
      { icon: <Zap size={15} className="text-amber-400 shrink-0" />, text: "MCQ quizzes on Anatomy, Physiology & Biochemistry" },
      { icon: <Flame size={15} className="text-orange-400 shrink-0" />, text: "Study streaks — login daily to keep the flame alive" },
      { icon: <Trophy size={15} className="text-yellow-400 shrink-0" />, text: "Rise through ranks: Intern → Resident → Consultant" },
    ],
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    icon: <BookOpen size={40} className="text-blue-400" />,
    title: "Study Materials",
    subtitle: "Everything you need in one place.",
    bullets: [
      { icon: <BookOpen size={15} className="text-blue-400 shrink-0" />, text: "Curated notes, PDFs & reference books" },
      { icon: <Brain size={15} className="text-pink-400 shrink-0" />, text: "Flashcards & mnemonics for fast revision" },
      { icon: <FlaskConical size={15} className="text-teal-400 shrink-0" />, text: "AI-powered doubt solver — ask anything" },
    ],
    gradient: "from-blue-500/20 to-teal-500/10",
  },
  {
    icon: <Brain size={40} className="text-green-400" />,
    title: "3D Anatomy Hub",
    subtitle: "Explore the human body like never before.",
    bullets: [
      { icon: <CheckCircle2 size={15} className="text-green-400 shrink-0" />, text: "150 interactive 3D GLB models to explore" },
      { icon: <CheckCircle2 size={15} className="text-green-400 shrink-0" />, text: "Cadaveric gallery with annotated photographs" },
      { icon: <CheckCircle2 size={15} className="text-green-400 shrink-0" />, text: "Click any structure to identify it instantly" },
    ],
    gradient: "from-green-500/20 to-emerald-500/10",
  },
  {
    icon: <Users size={40} className="text-rose-400" />,
    title: "Community & Leaderboard",
    subtitle: "Study with your college mates and compete together.",
    bullets: [
      { icon: <Trophy size={15} className="text-yellow-400 shrink-0" />, text: "Rank on the national leaderboard AND your college leaderboard" },
      { icon: <Users size={15} className="text-rose-400 shrink-0" />, text: "Community posts, confessions & study rooms" },
      { icon: <Bell size={15} className="text-purple-400 shrink-0" />, text: "Push notifications for streak reminders & quiz deadlines" },
    ],
    gradient: "from-rose-500/20 to-pink-500/10",
  },
];

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
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-border/60 gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className={`bg-gradient-to-br ${current.gradient} p-6 flex flex-col items-center text-center gap-3`}>
          <div className="w-16 h-16 rounded-2xl bg-background/40 backdrop-blur flex items-center justify-center border border-border/40">
            {current.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold leading-snug">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{current.subtitle}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <ul className="space-y-2.5">
            {current.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                {b.icon}
                <span className="text-foreground/90">{b.text}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {step + 1} of {STEPS.length}</span>
              <button onClick={finish} className="hover:text-foreground transition-colors">
                Skip
              </button>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <Button onClick={handleNext} className="w-full gap-1.5">
            {step < STEPS.length - 1 ? (
              <>Next <ChevronRight size={15} /></>
            ) : (
              <>Let's go! 🚀</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
