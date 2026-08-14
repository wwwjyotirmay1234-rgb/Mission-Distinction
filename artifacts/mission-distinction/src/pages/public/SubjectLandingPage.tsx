import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { API_BASE } from "@/lib/apiConfig";
import { BookOpen, FileText, ClipboardList, Trophy, PlayCircle, ArrowRight, CheckCircle2, Star, Microscope, Zap } from "lucide-react";

interface SubjectStats {
  subject: string;
  quizCount: number;
  noteCount: number;
  pyqCount: number;
  grandTestCount: number;
  videoCount: number;
}

interface SubjectConfig {
  slug: string;          // anatomy | physiology | biochemistry
  name: string;          // Full display name
  emoji: string;
  tagline: string;
  description: string;
  color: string;         // Tailwind CSS variable for accent
  highlights: string[];  // bullet features
  jsonLdDescription: string;
}

const SUBJECT_MAP: Record<string, SubjectConfig> = {
  anatomy: {
    slug: "anatomy",
    name: "Anatomy",
    emoji: "🫀",
    tagline: "Master Human Structure from Gross to Histology",
    description:
      "Anatomy is the cornerstone of clinical medicine. Mission Distinction gives MBBS first-year students in Odisha an unfair advantage — comprehensive MCQ banks drawn directly from VIMSAR, SCB, and MKCG university PYQs, curated notes, grand test series, and an interactive 3D Anatomy Hub that makes spatial reasoning effortless.",
    color: "indigo",
    highlights: [
      "PYQ banks from VIMSAR, SCB & MKCG exams",
      "3D Anatomy Hub with interactive models",
      "AI Viva Simulator for practical exams",
      "Osteology, Histology & Embryology coverage",
    ],
    jsonLdDescription:
      "Free Anatomy MCQ bank, PYQ papers, grand tests, and notes for MBBS students in Odisha — VIMSAR, SCB, MKCG aligned.",
  },
  physiology: {
    slug: "physiology",
    name: "Physiology",
    emoji: "⚡",
    tagline: "Understand the Body's Living Systems",
    description:
      "Physiology bridges anatomy to clinical thinking. Our daily quizzes, curated lecture notes, and full-length grand tests are mapped to the MBBS first-year Odisha university syllabus — so every practice session directly prepares you for your university and competitive exams.",
    color: "emerald",
    highlights: [
      "Daily adaptive MCQ quizzes",
      "Cardiology, Neurophysiology, and Renal focus areas",
      "AI Viva with apparatus-image spotters",
      "PYQ analysis — know which topics repeat most",
    ],
    jsonLdDescription:
      "Free Physiology MCQ bank, PYQ papers, grand tests, and notes for MBBS students in Odisha — VIMSAR, SCB, MKCG aligned.",
  },
  biochemistry: {
    slug: "biochemistry",
    name: "Biochemistry",
    emoji: "🧬",
    tagline: "Decode Molecular Medicine",
    description:
      "Biochemistry is notorious for sheer volume — pathways, enzymes, and clinical correlations. Mission Distinction's curated notes cut straight to high-yield concepts, while our PYQ trend analysis tells you exactly which pathways Odisha universities love to test.",
    color: "amber",
    highlights: [
      "Pathway-focused high-yield notes",
      "MCQ bank with clinical-correlation questions",
      "Grand test series for university exam prep",
      "Enzyme & metabolism PYQ deep-dives",
    ],
    jsonLdDescription:
      "Free Biochemistry MCQ bank, PYQ papers, grand tests, and notes for MBBS students in Odisha — VIMSAR, SCB, MKCG aligned.",
  },
};

interface Props {
  subject: keyof typeof SUBJECT_MAP;
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  if (value === 0) return null;
  return (
    <div className="flex flex-col items-center gap-1 bg-white/5 rounded-xl px-5 py-4 min-w-[100px]">
      <div className="text-purple-400">{icon}</div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-400 text-center">{label}</p>
    </div>
  );
}

export default function SubjectLandingPage({ subject }: Props) {
  const config = SUBJECT_MAP[subject];
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── SEO: update <title> and inject JSON-LD ───────────────────────────── */
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${config.name} for MBBS — Free PYQs, Quizzes & Grand Tests | Mission Distinction`;

    // Meta description
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = descEl?.content ?? "";
    if (descEl) descEl.content = config.jsonLdDescription;

    // JSON-LD Course structured data
    const ld = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: `${config.name} for MBBS — Mission Distinction`,
      description: config.jsonLdDescription,
      provider: {
        "@type": "EducationalOrganization",
        name: "Mission Distinction",
        url: "https://missiondistinction.in/",
      },
      url: `https://missiondistinction.in/${config.slug}`,
      inLanguage: "en-IN",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      educationalLevel: "University",
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT2H",
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `ld-${subject}`;
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      if (descEl) descEl.content = prevDesc;
      document.getElementById(`ld-${subject}`)?.remove();
    };
  }, [config, subject]);

  /* ── Fetch public stats ───────────────────────────────────────────────── */
  useEffect(() => {
    const url = API_BASE ? `${API_BASE}/api/public/stats` : "/api/public/stats";
    fetch(url)
      .then((r) => r.json())
      .then((data: { subjects: SubjectStats[] }) => {
        const row = data.subjects.find(
          (s) => s.subject.toLowerCase() === config.name.toLowerCase()
        );
        setStats(row ?? null);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [config.name]);

  return (
    <div className="min-h-screen bg-[#0d0f1a] text-white font-sans">
      {/* ── Minimal header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-purple-400 font-bold text-lg tracking-tight hover:text-purple-300 transition-colors"
        >
          Mission Distinction
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg transition-colors font-medium"
        >
          Sign up free →
        </button>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-14 pb-10 text-center">
        <p className="text-5xl mb-4">{config.emoji}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3 text-white">
          {config.name} for MBBS
        </h1>
        <p className="text-purple-300 text-lg font-medium mb-4">{config.tagline}</p>
        <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">{config.description}</p>

        {/* Stats row */}
        {!loading && stats && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <StatCard icon={<ClipboardList size={20} />} value={stats.pyqCount}       label="PYQ Papers" />
            <StatCard icon={<Trophy size={20} />}        value={stats.grandTestCount} label="Grand Tests" />
            <StatCard icon={<Zap size={20} />}           value={stats.quizCount}      label="Quiz Sets" />
            <StatCard icon={<PlayCircle size={20} />}    value={stats.videoCount}     label="Video Lectures" />
            <StatCard icon={<FileText size={20} />}      value={stats.noteCount}      label="Study Notes" />
          </div>
        )}
        {loading && (
          <div className="mt-8 flex justify-center gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 w-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-8 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-7 py-3 rounded-xl transition-colors text-base"
        >
          Start studying free <ArrowRight size={18} />
        </button>
        <p className="text-xs text-gray-500 mt-3">No credit card. No paywall. Ever.</p>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-10 border-t border-white/5">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-100">
          What you get for {config.name}
        </h2>
        <ul className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {config.highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3">
              <CheckCircle2 size={18} className="text-purple-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-200">{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Why Mission Distinction ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-10 border-t border-white/5">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-100">Why students choose us</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: <Star size={20} />, title: "100% free", body: "No subscription. No hidden fees. All features accessible from day one." },
            { icon: <Microscope size={20} />, title: "Odisha-focused", body: "PYQs, syllabi, and exam patterns from VIMSAR, SCB, MKCG, and Hi-Tech." },
            { icon: <BookOpen size={20} />, title: "Daily practice", body: "New quiz sets every day with instant AI explanations and performance tracking." },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-white/5 rounded-xl p-5 flex flex-col gap-2">
              <div className="text-purple-400">{icon}</div>
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center border-t border-white/5">
        <h2 className="text-2xl font-bold mb-3">Ready to ace your {config.name} exam?</h2>
        <p className="text-gray-400 mb-6">Join thousands of Odisha MBBS students already studying smarter.</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Create free account <ArrowRight size={18} />
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-6 text-center text-xs text-gray-600 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2">
          <button onClick={() => navigate("/anatomy")}      className="hover:text-gray-400">Anatomy</button>
          <button onClick={() => navigate("/physiology")}   className="hover:text-gray-400">Physiology</button>
          <button onClick={() => navigate("/biochemistry")} className="hover:text-gray-400">Biochemistry</button>
          <button onClick={() => navigate("/privacy-policy")} className="hover:text-gray-400">Privacy</button>
          <button onClick={() => navigate("/terms")}        className="hover:text-gray-400">Terms</button>
        </div>
        © {new Date().getFullYear()} Mission Distinction. All rights reserved.
      </footer>
    </div>
  );
}
