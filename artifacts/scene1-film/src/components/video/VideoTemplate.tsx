import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { CinematicFrame, BlackScene, TextCard, SilentFrame } from './video_scenes/Frames';

// ─────────────────────────────────────────────────────────────────────────────
//  SCENE 1 — THE STRUGGLE         (10 shots, ~56 s)
//  SCENE 2 — THE DECISION         (7 shots,  ~34 s)
//  SCENE 3 — THE DISCOVERY        (10 shots, ~69 s)
//  SCENE 4 — THE COLLECTION       (11 shots, ~87 s)
//  SCENE 5 — THE LIMITS OF PDFs   (11 shots, ~108 s)
//  SCENE 6 — THE LEAP OF FAITH    (13 shots, ~142 s)
//  SCENE 7 — THE COLLAPSE         (13 shots, ~158 s)
//  Total runtime: ~12 min including bridges + endings
// ─────────────────────────────────────────────────────────────────────────────

export const SCENE_DURATIONS: Record<string, number> = {

  // ── Scene 1 — The Struggle ───────────────────────────────────────────────
  s1_01:   4000,   // Shot 1 — Drone: hostel at night, one window lit
  s1_02:   4000,   // Shot 2 — Rain window exterior push-in
  s1_03:   5000,   // Shot 3 — Overhead desk: books, clock 2:47 AM
  s1_04:   5000,   // Shot 4 — Close-up face: dark circles, exhausted
  s1_05:   5000,   // Shot 5 — Over-shoulder laptop: PDFs, chaos
  s1_06:   5000,   // Shot 6 — Checklist: few done, many remaining
  s1_07:   3000,   // Shot 7 — PEN DROP. Silence.
  s1_08:   6000,   // Shot 8 — Side profile: rain on window
  s1_09:   7000,   // Shot 9 — Realization: tired → thinking
  s1_10:   8000,   // Shot 10 — Eyes + notebook: "There has to be a better way"

  // ── Bridge 1 ────────────────────────────────────────────────────────────
  bridge:  4000,   // "ONE STUDENT HAD A QUESTION…"

  // ── Scene 2 — The Decision ───────────────────────────────────────────────
  s2_01:   5000,   // Canteen: three friends sitting
  s2_02:   4000,   // Friend overwhelmed by syllabus
  s2_03:   4000,   // Friend scrolling — information overload
  s2_04:   5000,   // Founder listening, the idea forming
  s2_05:   5000,   // Founder opens blank notebook
  s2_06:   6000,   // Pen writes "MD" — the name is born
  s2_07:   5000,   // All three look at notebook — determination

  // ── Bridge 2 ────────────────────────────────────────────────────────────
  bridge2: 4000,   // "BUT THE QUESTION ONLY GREW BIGGER."

  // ── Scene 3 — The Discovery ─────────────────────────────────────────────
  s3_01:   5000,   // Shot 1 — Campus walk: founder among crowd
  s3_02:   6000,   // Shot 2 — Library: everyone searching, confused
  s3_03:   6000,   // Shot 3 — "Do you have the Physiology notes?" "No."
  s3_04:   7000,   // Shot 4 — Founder observing, the weight of understanding
  s3_05:   6000,   // Shot 5 — Three friends under a tree, silent
  s3_06:   7000,   // Shot 6 — Overhead notebook: the list grows
  s3_07:   8000,   // Shot 7 — Turning point: "Then let's not do it alone."
  s3_08:   8000,   // Shot 8 — The pact: three hands on notebook, piano begins
  s3_09:  10000,   // Shot 9 — "MISSION DISTINCTION" written, music rises
  s3_10:   6000,   // Shot 10 — "For Every Student Who Struggles Alone."

  // ── Bridge 3 ────────────────────────────────────────────────────────────
  bridge3: 4000,   // "AN IDEA MEANS NOTHING WITHOUT WORK."

  // ── Scene 4 — The Collection ─────────────────────────────────────────────
  s4_01:   5000,   // Blank notebook — Mission Distinction, huge mission, no resources
  s4_02:   6000,   // Library search — founder photographing pages
  s4_03:   7000,   // Asking seniors for old notes
  s4_04:   6000,   // Pen drives, scattered PDFs — knowledge existed, finding it was hard
  s4_05:   8000,   // Hostel room transforms into workspace
  s4_06:   8000,   // Three friends sorting: Anatomy / Physiology / Biochemistry / PYQs
  s4_07:   7000,   // Midnight — 12:43 AM, still working
  s4_08:   8000,   // The sacrifice — missed everything else
  s4_09:  10000,   // First resource pack complete — MBBS Resource Pack v1
  s4_10:   8000,   // The look — exhausted, just relieved
  s4_11:  10000,   // Final shot — folder close-up, the beginning

  // ── Bridge 4 / Scene 4 End Card ──────────────────────────────────────────
  end_card2: 6000, // "The First Resource Was Created." / "Now They Had To Share It."

  // ── Scene 5 — The Limits of PDFs ─────────────────────────────────────────
  s5_01:  10000,   // Shot 1  — Growth montage: files spreading, WhatsApp groups growing
  s5_02:   8000,   // Shot 2  — Founder's phone: flood of messages, system breaking
  s5_03:   8000,   // Shot 3  — Midnight support: all three answering, resending
  s5_04:  10000,   // Shot 4  — Laptop desktop chaos: duplicate folders everywhere
  s5_05:   8000,   // Shot 5  — Student searching WhatsApp — original problem returns
  s5_06:  12000,   // Shot 6  — Three founders, tired, silent conversation
  s5_07:   8000,   // Shot 7  — Notebook: "What if students didn't need to search?"
  s5_08:  12000,   // Shot 8  — Notebook sketch: Home / Notes / PDFs / Quizzes / Community
  s5_09:  10000,   // Shot 9  — Three founders imagining: excitement mixed with fear
  s5_10:  12000,   // Shot 10 — Founder writes "Let's build an app."
  s5_11:  10000,   // Final   — Rough app sketch on notebook — history changed

  // ── Bridge 5 / Scene 5 End Card ──────────────────────────────────────────
  end_card3: 6000, // "The Resource Project Was Over." / "The Mission Was Just Beginning."

  // ── Scene 6 — The Leap of Faith ──────────────────────────────────────────
  s6_01:  10000,   // Shot 1  — Blueprint: notebook with Notes/PDFs/Quizzes/Community wireframes
  s6_02:   8000,   // Shot 2  — The Dream: three founders looking up, imagining it all
  s6_03:   8000,   // Shot 3  — Reality arrives: blank laptop screen, no code
  s6_04:  12000,   // Shot 4  — Google University: dozens of tabs, information overload
  s6_05:  10000,   // Shot 5  — First attempt: ugly broken prototype, friend reacts
  s6_06:  12000,   // Shot 6  — Failure: error messages, broken pages, console errors
  s6_07:  15000,   // Shot 7  — Long nights: hostel, time passing, all three working
  s6_08:  12000,   // Shot 8  — The doubt: exhausted founders, heavy silence
  s6_09:  10000,   // Shot 9  — The decision: founder resolves, "we keep going"
  s6_10:  12000,   // Shot 10 — Restart: whiteboard erased, new plans, new energy
  s6_11:  15000,   // Shot 11 — First real version: Mission Distinction app on laptop
  s6_12:  10000,   // Shot 12 — The future: founder face lit by screen glow, reflection
  s6_13:   8000,   // Final   — "Mission Distinction v0.1" blinking cursor

  // ── Bridge 6 / Scene 6 End Card ──────────────────────────────────────────
  end_card4: 6000, // "The First Version Was Born." / "Now It Had To Survive."

  // ── Scene 7 — The Collapse ───────────────────────────────────────────────
  s7_01:  10000,   // Shot 1  — Growing workload: books + code + phone + calendar
  s7_02:  12000,   // Shot 2  — Pressure: phone messages "When will the app launch?"
  s7_03:   8000,   // Shot 3  — The bug: app crashes, Application Error on screen
  s7_04:  10000,   // Shot 4  — Second bug: more errors, build failed
  s7_05:  12000,   // Shot 5  — Exam week: anatomy textbook vs laptop, impossible balance
  s7_06:  10000,   // Shot 6  — Empty room: 2:40 AM, founder alone, two empty beds
  s7_07:  15000,   // Shot 7  — Lowest point: founder face, screen glow, pure emptiness
  s7_08:  15000,   // Shot 8  — Memory montage: rain, MD notebook, PDF, thank-you message
  s7_09:  12000,   // Shot 9  — The message: "Your PDFs helped me pass. Thank you."
  s7_10:  12000,   // Shot 10 — The return: friends walk through doorway silently
  s7_11:  15000,   // Shot 11 — The choice: three founders working, "one more try"
  s7_12:  15000,   // Shot 12 — Dawn: sunrise through window, three silhouettes, 5:30 AM
  s7_13:  12000,   // Final   — Mission Distinction loads successfully, subtle smile

  // ── Ending ───────────────────────────────────────────────────────────────
  end_card5: 6000, // "Most Projects End Here." / "Mission Distinction Didn't."
  end_title: 7000, // "One Idea Changed Everything."
};

// ─────────────────────────────────────────────────────────────────────────────

interface SceneData {
  type: 'black' | 'frame' | 'textcard' | 'silent';
  image?: string;
  narration?: string;
  kenBurns?: { scale: number[]; x: string[]; y: string[] };
  fadeToBlack?: boolean;
  fadeIn?: boolean;
  line1?: string;
  line2?: string;
  line3?: string;
  large?: boolean;
}

const SCENES: Record<string, SceneData> = {

  // ── Scene 1 ──────────────────────────────────────────────────────────────

  s1_01: {
    type: 'frame',
    image: 's1_n01.png',
    narration: '"Every year, thousands of students enter medical college with a dream."',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '-1%'] },
  },
  s1_02: {
    type: 'silent',
    image: 's1_n02.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_03: {
    type: 'frame',
    image: 's1_01.png',
    narration: '"The syllabus seemed endless."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s1_04: {
    type: 'frame',
    image: 's1_02.png',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_05: {
    type: 'frame',
    image: 's1_n05.png',
    narration: '"Information was everywhere. Guidance was not."',
    kenBurns: { scale: [1.05, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s1_06: {
    type: 'frame',
    image: 's1_03.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_07: {
    type: 'silent',
    image: 's1_n07.png',
    kenBurns: { scale: [1.0, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_08: {
    type: 'frame',
    image: 's1_05.png',
    narration: '"Maybe I am falling behind."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_09: {
    type: 'silent',
    image: 's1_n09.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s1_10: {
    type: 'frame',
    image: 's1_n10.png',
    narration: '"And that single thought… changed everything."',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Bridge 1 ──────────────────────────────────────────────────────────────
  bridge: {
    type: 'textcard',
    line1: 'ONE STUDENT HAD A QUESTION.',
    line2: 'THREE STUDENTS DECIDED TO FIND AN ANSWER.',
  },

  // ── Scene 2 ──────────────────────────────────────────────────────────────

  s2_01: {
    type: 'frame',
    image: 's2_01.png',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_02: {
    type: 'frame',
    image: 's2_02.png',
    narration: '"We can\'t find proper notes. Everything is scattered."',
    kenBurns: { scale: [1.0, 1.06], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s2_03: {
    type: 'frame',
    image: 's2_03.png',
    kenBurns: { scale: [1.04, 1.04], x: ['2%', '-2%'], y: ['0%', '0%'] },
  },
  s2_04: {
    type: 'frame',
    image: 's2_04.png',
    narration: '"What if everything a student needs… was in one place?"',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_05: {
    type: 'frame',
    image: 's2_05.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_06: {
    type: 'frame',
    image: 's2_06.png',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s2_07: {
    type: 'frame',
    image: 's2_07.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Bridge 2 ──────────────────────────────────────────────────────────────
  bridge2: {
    type: 'textcard',
    line1: 'BUT THE QUESTION ONLY GREW BIGGER.',
    line2: 'BECAUSE IT WASN\'T JUST HIS QUESTION.',
  },

  // ── Scene 3 — The Discovery ───────────────────────────────────────────────

  s3_01: {
    type: 'frame',
    image: 's3_01.png',
    narration: '"The next few days… a question refused to leave his mind."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_02: {
    type: 'silent',
    image: 's3_02.png',
    kenBurns: { scale: [1.0, 1.05], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s3_03: {
    type: 'frame',
    image: 's3_03.png',
    narration: '"Every student was looking for something. No one had it."',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_04: {
    type: 'frame',
    image: 's3_04.png',
    narration: '"It wasn\'t one student. It wasn\'t one classroom. It was everyone."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_05: {
    type: 'silent',
    image: 's3_05.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_06: {
    type: 'frame',
    image: 's3_06.png',
    narration: '"One person can\'t solve this."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s3_07: {
    type: 'frame',
    image: 's3_07.png',
    narration: '"Then let\'s not do it alone."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_08: {
    type: 'silent',
    image: 's3_08.png',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_09: {
    type: 'frame',
    image: 's3_09.png',
    narration: '"Mission Distinction."',
    fadeToBlack: false,
    kenBurns: { scale: [1.0, 1.12], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s3_10: {
    type: 'silent',
    image: 's3_10.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Bridge 3 ──────────────────────────────────────────────────────────────
  bridge3: {
    type: 'textcard',
    line1: 'AN IDEA MEANS NOTHING WITHOUT WORK.',
    line2: 'SO THEY GOT TO WORK.',
  },

  // ── Scene 4 — The Collection ──────────────────────────────────────────────

  s4_01: {
    type: 'frame',
    image: 's4_01.png',
    narration: '"An idea is easy. Building it is not."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s4_02: {
    type: 'silent',
    image: 's4_02.png',
    kenBurns: { scale: [1.04, 1.0], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s4_03: {
    type: 'frame',
    image: 's4_03.png',
    narration: '"Not everyone could help. But they kept asking."',
    kenBurns: { scale: [1.0, 1.06], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s4_04: {
    type: 'frame',
    image: 's4_04.png',
    narration: '"The knowledge existed. Finding it was the challenge."',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s4_05: {
    type: 'silent',
    image: 's4_05.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s4_06: {
    type: 'silent',
    image: 's4_06.png',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s4_07: {
    type: 'frame',
    image: 's4_07.png',
    narration: '"Classes ended. The work didn\'t."',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s4_08: {
    type: 'frame',
    image: 's4_08.png',
    narration: '"Every mission costs something."',
    kenBurns: { scale: [1.04, 1.0], x: ['2%', '-2%'], y: ['0%', '0%'] },
  },
  s4_09: {
    type: 'frame',
    image: 's4_09.png',
    narration: '"Done." A whisper in an empty room.',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s4_10: {
    type: 'frame',
    image: 's4_10.png',
    narration: '"It wasn\'t much. But it was a beginning."',
    fadeToBlack: true,
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s4_11: {
    type: 'silent',
    image: 's4_11.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.12], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Ending ────────────────────────────────────────────────────────────────

  end_card2: {
    type: 'textcard',
    line1: 'The First Resource Was Created.',
    line2: 'Now They Had To Share It.',
  },

  // ── Scene 5 — The Limits of PDFs ──────────────────────────────────────────

  s5_01: {
    type: 'silent',
    image: 's5_01.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s5_02: {
    type: 'frame',
    image: 's5_02.png',
    narration: '"The system was breaking."',
    kenBurns: { scale: [1.04, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s5_03: {
    type: 'frame',
    image: 's5_03.png',
    narration: '"Helping students had become a full-time job."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s5_04: {
    type: 'silent',
    image: 's5_04.png',
    kenBurns: { scale: [1.08, 1.0], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s5_05: {
    type: 'frame',
    image: 's5_05.png',
    narration: '"The original problem had returned."',
    kenBurns: { scale: [1.0, 1.06], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s5_06: {
    type: 'silent',
    image: 's5_06.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s5_07: {
    type: 'frame',
    image: 's5_07.png',
    narration: '"What if students didn\'t need to search?"',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s5_08: {
    type: 'frame',
    image: 's5_08.png',
    narration: '"The answer wasn\'t another folder."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s5_09: {
    type: 'silent',
    image: 's5_09.png',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s5_10: {
    type: 'frame',
    image: 's5_10.png',
    narration: '"It was something bigger."',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.12], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s5_11: {
    type: 'silent',
    image: 's5_11.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },

  // ── Bridge 5 ─────────────────────────────────────────────────────────────

  end_card3: {
    type: 'textcard',
    line1: 'The Resource Project Was Over.',
    line2: 'The Mission Was Just Beginning.',
  },

  // ── Scene 6 — The Leap of Faith ──────────────────────────────────────────

  s6_01: {
    type: 'frame',
    image: 's6_01.png',
    narration: '"Dreams are free. Building them isn\'t."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s6_02: {
    type: 'silent',
    image: 's6_02.png',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_03: {
    type: 'frame',
    image: 's6_03.png',
    narration: '"Then reality arrived."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_04: {
    type: 'silent',
    image: 's6_04.png',
    kenBurns: { scale: [1.06, 1.0], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s6_05: {
    type: 'frame',
    image: 's6_05.png',
    narration: '"The first version didn\'t work. Nothing did."',
    kenBurns: { scale: [1.0, 1.07], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s6_06: {
    type: 'frame',
    image: 's6_06.png',
    narration: '"Every answer created three new problems."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_07: {
    type: 'silent',
    image: 's6_07.png',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_08: {
    type: 'frame',
    image: 's6_08.png',
    narration: '"Maybe this is too big."',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_09: {
    type: 'frame',
    image: 's6_09.png',
    narration: '"If students need it… we keep going."',
    fadeToBlack: false,
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_10: {
    type: 'silent',
    image: 's6_10.png',
    kenBurns: { scale: [1.04, 1.0], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s6_11: {
    type: 'frame',
    image: 's6_11.png',
    narration: '"For the first time… it looked like an app."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_12: {
    type: 'frame',
    image: 's6_12.png',
    narration: '"It wasn\'t ready. But for the first time… it felt possible."',
    fadeToBlack: true,
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s6_13: {
    type: 'silent',
    image: 's6_13.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Bridge 6 ─────────────────────────────────────────────────────────────

  end_card4: {
    type: 'textcard',
    line1: 'The First Version Was Born.',
    line2: 'Now It Had To Survive.',
  },

  // ── Scene 7 — The Collapse ────────────────────────────────────────────────

  s7_01: {
    type: 'frame',
    image: 's7_01.png',
    narration: '"The app was finally taking shape."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_02: {
    type: 'frame',
    image: 's7_02.png',
    narration: '"The expectations were growing."',
    kenBurns: { scale: [1.04, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s7_03: {
    type: 'silent',
    image: 's7_03.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_04: {
    type: 'frame',
    image: 's7_04.png',
    narration: '"Every solution created another problem."',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_05: {
    type: 'frame',
    image: 's7_05.png',
    narration: '"First year MBBS. And Mission Distinction. At the same time."',
    kenBurns: { scale: [1.0, 1.07], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s7_06: {
    type: 'frame',
    image: 's7_06.png',
    narration: '"Some nights… the mission felt heavier than the dream."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_07: {
    type: 'silent',
    image: 's7_07.png',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_08: {
    type: 'frame',
    image: 's7_08.png',
    narration: '"Why did we start?"',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_09: {
    type: 'silent',
    image: 's7_09.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_10: {
    type: 'silent',
    image: 's7_10.png',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_11: {
    type: 'frame',
    image: 's7_11.png',
    narration: '"One more try."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_12: {
    type: 'silent',
    image: 's7_12.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s7_13: {
    type: 'frame',
    image: 's7_13.png',
    narration: '"The mission survived."',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },

  // ── Ending ────────────────────────────────────────────────────────────────

  end_card5: {
    type: 'textcard',
    line1: 'Most Projects End Here.',
    line2: 'Mission Distinction Didn\'t.',
  },
  end_title: {
    type: 'textcard',
    line1: 'One Idea Changed Everything.',
    large: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneData = SCENES[baseKey] ?? SCENES['s1_01'];
  const duration = durations[currentSceneKey] ?? 5000;

  const renderScene = () => {
    if (sceneData.type === 'black') {
      return (
        <BlackScene
          key={currentSceneKey}
          duration={duration}
          narration={sceneData.narration ?? ''}
          fadeIn={sceneData.fadeIn}
        />
      );
    }
    if (sceneData.type === 'silent') {
      return (
        <SilentFrame
          key={currentSceneKey}
          duration={duration}
          image={sceneData.image!}
          kenBurns={sceneData.kenBurns!}
          fadeToBlack={sceneData.fadeToBlack}
        />
      );
    }
    if (sceneData.type === 'frame') {
      return (
        <CinematicFrame
          key={currentSceneKey}
          duration={duration}
          image={sceneData.image!}
          narration={sceneData.narration}
          kenBurns={sceneData.kenBurns!}
          fadeToBlack={sceneData.fadeToBlack}
        />
      );
    }
    return (
      <TextCard
        key={currentSceneKey}
        duration={duration}
        line1={sceneData.line1!}
        line2={sceneData.line2}
        line3={sceneData.line3}
        large={sceneData.large}
      />
    );
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      <AnimatePresence mode="sync">
        {renderScene()}
      </AnimatePresence>
    </div>
  );
}
