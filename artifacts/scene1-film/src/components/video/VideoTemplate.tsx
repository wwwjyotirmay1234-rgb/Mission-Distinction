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

  // ── Bridge before Scene 9 ────────────────────────────────────────────────
  end_card5: 6000, // "Most Projects End Here." / "Mission Distinction Didn't."
  bridge9:   5000, // "THE DREAM WAS BUILT." / "NOW CAME LAUNCH DAY."

  // ── Scene 9 — Launch Day ──────────────────────────────────────────────────
  s9_01:  10000,   // Shot 1  — Sunrise: drone over campus, golden light, new day
  s9_02:  12000,   // Shot 2  — The Room: same hostel room, now transformed
  s9_03:  15000,   // Shot 3  — The Countdown: three founders checking everything
  s9_04:  12000,   // Shot 4  — Final Review: Mission Distinction app, all ready
  s9_05:  10000,   // Shot 5  — The Question: "Ready?" — silence
  s9_06:  12000,   // Shot 6  — The Click: cursor on launch button, trembling finger
  s9_07:  15000,   // Shot 7  — Silence: three founders staring, waiting
  s9_08:  10000,   // Shot 8  — First User: analytics show "1"
  s9_09:  12000,   // Shot 9  — Another Room: unknown student downloads app
  s9_10:   8000,   // Shot 10 — 5 Users: 5 → 9 → 14
  s9_11:  25000,   // Shot 11 — Montage: students across Odisha using app
  s9_12:  15000,   // Shot 12 — The Surge: analytics climbing fast
  s9_13:  15000,   // Shot 13 — The Realization: founder emotional, remembering
  s9_14:  12000,   // Shot 14 — The Message: "This is exactly what we needed."
  s9_15:  15000,   // Shot 15 — Celebration: three friends, quiet smiles, exhausted
  s9_16:  15000,   // Shot 16 — The Window: same window, different person now
  s9_17:  20000,   // Final   — Drone pullback: campus lights, thousands of students

  // ── Scene 9 End / Bridge to Scene 10 ────────────────────────────────────
  end_card6:    8000, // "150 Students." / "24 Hours." / "A Mission Had Begun."
  bridge10:     5000, // "3 WEEKS LATER."

  // ── Scene 10 — The Responsibility ────────────────────────────────────────
  s10_01:  10000,   // Shot 1  — Analytics: 500 users milestone
  s10_02:  12000,   // Shot 2  — Three founders in silent disbelief
  s10_03:  20000,   // Shot 3  — Flashback montage: the full journey
  s10_04:  20000,   // Shot 4  — Across Odisha: students using app
  s10_05:  15000,   // Shot 5  — Map of Odisha: glowing dots city by city
  s10_06:  15000,   // Shot 6  — The letters: student messages pouring in
  s10_07:  15000,   // Shot 7  — The Weight: founder reads messages, responsibility
  s10_08:  15000,   // Shot 8  — "What's next?" — three founders at table
  s10_09:  20000,   // Shot 9  — Vision board: new goals, bigger mission
  s10_10:  20000,   // Shot 10 — Founder writes: v2 → v3 → Beyond Odisha
  s10_11:  15000,   // Shot 11 — Sunrise: same campus, new chapter
  s10_12:  25000,   // Final   — Rooftop: three founders, rising drone, city of lights

  // ── Scene 10 End ──────────────────────────────────────────────────────────
  end_card7:   10000, // "MISSION DISTINCTION / Started With A Struggle. / Built With Purpose. / Continued By Students."
  epilogue:     8000, // "501… 502… 503… The numbers continue rising."
  end_title:    9000, // "To Be Continued…"

  // ── Bridge to Scene 11 ───────────────────────────────────────────────────
  s11_rain:     5000, // Black screen — silence — the same rain from Scene 1
  s11_title:    5000, // "One Year Later"

  // ── Scene 11 — The Legacy ────────────────────────────────────────────────
  s11_01:  15000,   // Shot 1  — Drone: medical college campus, new students arriving
  s11_02:  15000,   // Shot 2  — Tracking: new first-year student enters hostel
  s11_03:  15000,   // Shot 3  — Wide: hostel room, same books, fresh start
  s11_04:  20000,   // Shot 4  — Close-up: student overwhelmed — history repeats
  s11_05:  12000,   // Shot 5  — Over-shoulder: student searches "Mission Distinction"
  s11_06:  20000,   // Shot 6  — Close-up: MD app opens — relief
  s11_07:  15000,   // Shot 7  — Intercut: student using MD / founders unaware
  s11_08:  20000,   // Shot 8  — Montage: students across Odisha connected by one platform
  s11_09:  15000,   // Shot 9  — Macro: old notebook — "What if everything was in one place?"
  s11_10:  25000,   // Shot 10 — Full circle: same room, same rain, but now learning not struggling
  s11_11:  20000,   // Shot 11 — Camera pulls back through rainy window — rising higher
  s11_12:  30000,   // Shot 12 — Aerial: thousands of glowing windows across Odisha
  s11_final: 30000, // Final shot — "MISSION DISTINCTION" spelled in city lights

  // ── Scene 11 End Cards ───────────────────────────────────────────────────
  end_card8:   10000, // "Three students started with a question. / Thousands found an answer."
  final_quote:  9000, // "Every doctor was once a student searching for guidance."
  s11_credits: 20000, // Behind-the-scenes memory collage — soft piano, no narration
  s11_end:      6000, // Final fade to black

  // ── Epilogue — The Journey Continues ─────────────────────────────────────
  ep_today:    3500,  // "Today" — black title card
  ep_01:      15000,  // Shot 1  — Campus drone flyover
  ep_02:      20000,  // Shot 2  — Many stories montage
  ep_03:      15000,  // Shot 3  — The Founder walking
  ep_04:      20000,  // Shot 4  — The Unseen Impact intercut
  ep_05:      15000,  // Shot 5  — The Empty Room
  ep_06:      20000,  // Shot 6  — The Notebook
  ep_07:      20000,  // Shot 7  — The Future: Chapter 2
  ep_08:      25000,  // Shot 8  — Sunset over Odisha
  ep_09:      20000,  // Shot 9  — The Final Student
  ep_final:   30000,  // Final Shot — One window to thousands
  ep_title:    8000,  // "MISSION DISTINCTION / A Story Still Being Written"
  ep_last:    10000,  // "Somewhere tonight…"
  ep_end:      5000,  // Black fade to end

  // ── Scene 12 — The Anniversary (After The Credits) ────────────────────────
  s12_year:    3500,  // "ONE YEAR LATER" title card
  s12_01:     15000,  // Shot 1  — The Old Room (empty, rain, same desk)
  s12_02:     20000,  // Shot 2  — Flashback Echoes (double-exposure memories)
  s12_03:     20000,  // Shot 3  — Team Reunion (three founders, same table)
  s12_04:     15000,  // Shot 4  — First Resource Pack (old folder, few PDFs)
  s12_05:     30000,  // Shot 5  — The Students (montage across Odisha)
  s12_06:     20000,  // Shot 6  — The Wall (messages projected)
  s12_07:     15000,  // Shot 7  — The Realization (founder reading messages)
  s12_08:     25000,  // Shot 8  — Future Board (whiteboard: new goals)
  s12_09:     25000,  // Shot 9  — New Generation (first-year entering campus)
  s12_10:     30000,  // Shot 10 — Full Circle (same desk, MD already open)
  s12_final:  40000,  // Final Shot — Drone pullback to city constellation
  s12_title:   8000,  // "MISSION DISTINCTION / Not An App. A Mission."
  s12_last:   10000,  // "And this is only the beginning."
  s12_end:     5000,  // Black fade to end

  // ── Scene 13 — The Legacy (After The Credits II) ──────────────────────────
  s13_open:    8000,  // Black + ambient sounds (pages, keyboard, rain, footsteps)
  s13_text1:   5000,  // "Some dreams end when they succeed. Others begin."
  s13_01:     20000,  // Shot 1  — Unknown first-year arrives on campus
  s13_02:     25000,  // Shot 2  — History repeats (cluttered desk, stress)
  s13_03:     15000,  // Shot 3  — The Discovery (screen light in eyes)
  s13_04:     30000,  // Shot 4  — Invisible helpers (ghost founder silhouettes)
  s13_05:     40000,  // Shot 5  — Chain reaction montage
  s13_06:     45000,  // Shot 6  — Years pass (student → intern → doctor)
  s13_07:     30000,  // Shot 7  — The Doctor (treating patient, family smiles)
  s13_08:     25000,  // Shot 8  — Founders watch from distance, quietly proud
  s13_09:     40000,  // Shot 9  — Legacy wall (thousands of student photos)
  s13_10:     35000,  // Shot 10 — The Torch (doctor hands notes to first-year)
  s13_final:  60000,  // Final Shot — Drone ascent, city of light
  s13_title:   8000,  // "MISSION DISTINCTION / Knowledge. Service. Humanity."
  s13_last:   10000,  // "The story now belongs to them."
  s13_end:     5000,  // Black fade
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

  // ── Bridge → Scene 9 ─────────────────────────────────────────────────────

  end_card5: {
    type: 'textcard',
    line1: 'Most Projects End Here.',
    line2: 'Mission Distinction Didn\'t.',
  },
  bridge9: {
    type: 'textcard',
    line1: 'THE DREAM WAS BUILT.',
    line2: 'NOW CAME LAUNCH DAY.',
  },

  // ── Scene 9 — Launch Day ──────────────────────────────────────────────────

  s9_01: {
    type: 'frame',
    image: 's9_01.png',
    narration: '"Months earlier… it was just an idea in a notebook. Today… the world would finally see it."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s9_02: {
    type: 'silent',
    image: 's9_02.png',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_03: {
    type: 'silent',
    image: 's9_03.png',
    kenBurns: { scale: [1.0, 1.04], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s9_04: {
    type: 'frame',
    image: 's9_04.png',
    narration: '"Perfection wasn\'t possible. But waiting forever wasn\'t either."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_05: {
    type: 'silent',
    image: 's9_05.png',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_06: {
    type: 'silent',
    image: 's9_06.png',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_07: {
    type: 'silent',
    image: 's9_07.png',
    kenBurns: { scale: [1.02, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_08: {
    type: 'silent',
    image: 's9_08.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_09: {
    type: 'frame',
    image: 's9_09.png',
    narration: '"Somewhere else… a student opened it for the first time."',
    kenBurns: { scale: [1.04, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s9_10: {
    type: 'silent',
    image: 's9_10.png',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_11: {
    type: 'frame',
    image: 's9_11.png',
    narration: '"One student became ten. Ten became fifty. The mission was moving."',
    kenBurns: { scale: [1.0, 1.05], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s9_12: {
    type: 'silent',
    image: 's9_12.png',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_13: {
    type: 'frame',
    image: 's9_13.png',
    narration: '"The numbers weren\'t important. What they represented was."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_14: {
    type: 'silent',
    image: 's9_14.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_15: {
    type: 'silent',
    image: 's9_15.png',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_16: {
    type: 'frame',
    image: 's9_16.png',
    narration: '"Months earlier… he searched for help. Now he was helping others find it."',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s9_17: {
    type: 'silent',
    image: 's9_17.png',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.12], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },

  // ── Scene 9 Ending / Bridge ───────────────────────────────────────────────

  end_card6: {
    type: 'textcard',
    line1: '150 Students.',
    line2: '24 Hours.',
    line3: 'A Mission Had Begun.',
  },
  bridge10: {
    type: 'textcard',
    line1: '3 WEEKS LATER.',
    line2: 'THE MISSION KEPT GROWING.',
  },

  // ── Scene 10 — The Responsibility ────────────────────────────────────────

  s10_01: {
    type: 'silent',
    image: 's10_01.png',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_02: {
    type: 'frame',
    image: 's10_02.png',
    narration: '"Five hundred downloads in three weeks."',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_03: {
    type: 'frame',
    image: 's10_03.png',
    narration: '"It started with a struggle. Then an idea. Then a promise."',
    kenBurns: { scale: [1.0, 1.06], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s10_04: {
    type: 'frame',
    image: 's10_04.png',
    narration: '"Students they would never meet were now depending on them."',
    kenBurns: { scale: [1.0, 1.05], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s10_05: {
    type: 'frame',
    image: 's10_05.png',
    narration: '"The mission was no longer inside one room."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_06: {
    type: 'silent',
    image: 's10_06.png',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_07: {
    type: 'frame',
    image: 's10_07.png',
    narration: '"Five hundred downloads. Five hundred expectations."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_08: {
    type: 'silent',
    image: 's10_08.png',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_09: {
    type: 'frame',
    image: 's10_09.png',
    narration: '"The old goals were not enough. The mission had grown bigger than the plan."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s10_10: {
    type: 'frame',
    image: 's10_10.png',
    narration: '"The goal was never downloads. The goal was impact."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s10_11: {
    type: 'silent',
    image: 's10_11.png',
    kenBurns: { scale: [1.0, 1.07], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s10_12: {
    type: 'frame',
    image: 's10_12.png',
    narration: '"Three students started a mission. Thousands would carry it forward."',
    fadeToBlack: true,
    kenBurns: { scale: [1.0, 1.15], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },

  // ── Scene 10 Ending ───────────────────────────────────────────────────────

  end_card7: {
    type: 'textcard',
    line1: 'MISSION DISTINCTION',
    line2: 'Started With A Struggle. Built With Purpose.',
    line3: 'Continued By Students.',
  },
  epilogue: {
    type: 'textcard',
    line1: '501… 502… 503…',
    line2: 'The numbers kept rising.',
  },
  end_title: {
    type: 'textcard',
    line1: 'To Be Continued…',
    large: true,
  },

  // ── Scene 11 — The Legacy ─────────────────────────────────────────────────

  s11_rain: {
    type: 'black',
    narration: '',
    fadeIn: true,
  },
  s11_title: {
    type: 'textcard',
    line1: 'One Year Later',
    large: true,
  },

  s11_01: {
    type: 'frame',
    image: 's11_01.png',
    narration: '"Every year… a new journey begins."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['2%', '-1%'] },
  },
  s11_02: {
    type: 'frame',
    image: 's11_02.png',
    narration: '"Same corridors. Same uncertainty. Same fear."',
    kenBurns: { scale: [1.05, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s11_03: {
    type: 'frame',
    image: 's11_03.png',
    narration: '"The books hadn\'t changed. The struggle hadn\'t either."',
    kenBurns: { scale: [1.0, 1.07], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s11_04: {
    type: 'frame',
    image: 's11_04.png',
    narration: '"He sat with the same confusion that had once started everything."',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['-1%', '1%'] },
  },
  s11_05: {
    type: 'frame',
    image: 's11_05.png',
    narration: '"Then… he picked up his phone."',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s11_06: {
    type: 'frame',
    image: 's11_06.png',
    narration: '"Notes. Resources. Community. Everything… in one place."',
    kenBurns: { scale: [1.04, 1.0], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s11_07: {
    type: 'frame',
    image: 's11_07.png',
    narration: '"The people who built it… may never know his name."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['-1%', '1%'] },
  },
  s11_08: {
    type: 'frame',
    image: 's11_08.png',
    narration: '"But impact doesn\'t need recognition."',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s11_09: {
    type: 'frame',
    image: 's11_09.png',
    narration: '"It just needs to reach the right person… at the right moment."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s11_10: {
    type: 'frame',
    image: 's11_10.png',
    narration: '"The struggle remained. But now… no one had to face it alone."',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s11_11: {
    type: 'silent',
    image: 's11_11.png',
    kenBurns: { scale: [1.0, 1.12], x: ['0%', '0%'], y: ['3%', '-3%'] },
  },
  s11_12: {
    type: 'frame',
    image: 's11_12.png',
    narration: '"A mission is not measured by downloads. It is measured by the lives it touches."',
    kenBurns: { scale: [1.0, 1.1], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s11_final: {
    type: 'frame',
    image: 's11_final.png',
    narration: '"Mission Distinction."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
    fadeToBlack: true,
  },

  // ── Scene 11 End Cards ────────────────────────────────────────────────────

  end_card8: {
    type: 'textcard',
    line1: 'Three students started with a question.',
    line2: 'Thousands found an answer.',
  },
  final_quote: {
    type: 'textcard',
    line1: '"Every doctor was once a student',
    line2: 'searching for guidance."',
  },
  s11_credits: {
    type: 'silent',
    image: 's11_credits.png',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s11_end: {
    type: 'black',
    narration: '',
    fadeIn: false,
  },

  // ── Epilogue — The Journey Continues ─────────────────────────────────────

  ep_today: {
    type: 'textcard',
    line1: 'Today',
  },
  ep_01: {
    type: 'frame',
    image: 'ep_01.png',
    narration: '"The mission never stopped growing."',
    kenBurns: { scale: [1.1, 1.0], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  ep_02: {
    type: 'silent',
    image: 'ep_02.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  ep_03: {
    type: 'frame',
    image: 'ep_03.png',
    narration: '"The mission was never about becoming known."',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  ep_04: {
    type: 'frame',
    image: 'ep_04.png',
    narration: '"The greatest impact is often invisible."',
    kenBurns: { scale: [1.04, 1.0], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  ep_05: {
    type: 'silent',
    image: 'ep_05.png',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  ep_06: {
    type: 'silent',
    image: 'ep_06.png',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  ep_07: {
    type: 'silent',
    image: 'ep_07.png',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  ep_08: {
    type: 'frame',
    image: 'ep_08.png',
    narration: '"A mission does not end when it succeeds. It ends when it is no longer needed."',
    kenBurns: { scale: [1.12, 1.0], x: ['0%', '0%'], y: ['3%', '-3%'] },
  },
  ep_09: {
    type: 'frame',
    image: 'ep_09.png',
    narration: '"And until that day… the mission continues."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  ep_final: {
    type: 'silent',
    image: 'ep_final.png',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['2%', '-2%'] },
    fadeToBlack: true,
  },
  ep_title: {
    type: 'textcard',
    line1: 'MISSION DISTINCTION',
    line2: 'A Story Still Being Written',
    large: true,
  },
  ep_last: {
    type: 'textcard',
    line1: '"Somewhere tonight, another student',
    line2: 'is opening the app for the first time."',
  },
  ep_end: {
    type: 'black',
    narration: '',
    fadeIn: false,
  },

  // ── Scene 12 — The Anniversary ────────────────────────────────────────────

  s12_year: {
    type: 'textcard',
    line1: 'ONE YEAR LATER',
  },
  s12_01: {
    type: 'frame',
    image: 's12_01.png',
    narration: '"Every mission begins somewhere. Ours began here."',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '2%'] },
  },
  s12_02: {
    type: 'silent',
    image: 's12_02.png',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s12_03: {
    type: 'silent',
    image: 's12_03.png',
    kenBurns: { scale: [1.0, 1.05], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s12_04: {
    type: 'frame',
    image: 's12_04.png',
    narration: '"The first version wasn\'t perfect. It simply helped."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s12_05: {
    type: 'silent',
    image: 's12_05.png',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s12_06: {
    type: 'silent',
    image: 's12_06.png',
    kenBurns: { scale: [1.04, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s12_07: {
    type: 'frame',
    image: 's12_07.png',
    narration: '"The downloads were numbers. These were people."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s12_08: {
    type: 'silent',
    image: 's12_08.png',
    kenBurns: { scale: [1.08, 1.0], x: ['0%', '0%'], y: ['-2%', '2%'] },
  },
  s12_09: {
    type: 'frame',
    image: 's12_09.png',
    narration: '"Every year… a new student begins the same journey."',
    kenBurns: { scale: [1.0, 1.06], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s12_10: {
    type: 'silent',
    image: 's12_10.png',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s12_final: {
    type: 'frame',
    image: 's12_final.png',
    narration: '"A year ago, three students asked a question. Today… thousands are writing the answer."',
    kenBurns: { scale: [1.1, 1.0], x: ['0%', '0%'], y: ['3%', '-3%'] },
    fadeToBlack: true,
  },
  s12_title: {
    type: 'textcard',
    line1: 'MISSION DISTINCTION',
    line2: 'Not An App.',
    line3: 'A Mission.',
    large: true,
  },
  s12_last: {
    type: 'textcard',
    line1: '"And this is only the beginning."',
  },
  s12_end: {
    type: 'black',
    narration: '',
    fadeIn: false,
  },

  // ── Scene 13 — The Legacy ──────────────────────────────────────────────────

  s13_open: {
    type: 'black',
    narration: '',
    fadeIn: false,
  },
  s13_text1: {
    type: 'textcard',
    line1: '"Some dreams end when they succeed."',
    line2: '"Others begin."',
  },
  s13_01: {
    type: 'frame',
    image: 's13_01.png',
    narration: '"A year later… another student arrived. Just like us."',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '2%'] },
  },
  s13_02: {
    type: 'frame',
    image: 's13_02.png',
    narration: '"The weight was the same. The uncertainty was the same. The fear was the same."',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s13_03: {
    type: 'frame',
    image: 's13_03.png',
    narration: '"This time… the answer already existed."',
    kenBurns: { scale: [1.0, 1.08], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s13_04: {
    type: 'silent',
    image: 's13_04.png',
    kenBurns: { scale: [1.04, 1.0], x: ['-1%', '1%'], y: ['0%', '0%'] },
  },
  s13_05: {
    type: 'frame',
    image: 's13_05.png',
    narration: '"Knowledge shared became confidence. Confidence shared became strength."',
    kenBurns: { scale: [1.0, 1.05], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s13_06: {
    type: 'silent',
    image: 's13_06.png',
    kenBurns: { scale: [1.0, 1.06], x: ['1%', '-1%'], y: ['0%', '0%'] },
  },
  s13_07: {
    type: 'frame',
    image: 's13_07.png',
    narration: '"Every page. Every note. Every hour. Reached farther than we imagined."',
    kenBurns: { scale: [1.06, 1.0], x: ['0%', '0%'], y: ['2%', '-2%'] },
  },
  s13_08: {
    type: 'frame',
    image: 's13_08.png',
    narration: '"Worth it."',
    kenBurns: { scale: [1.0, 1.04], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s13_09: {
    type: 'frame',
    image: 's13_09.png',
    narration: '"The goal was never downloads. The goal was impact."',
    kenBurns: { scale: [1.1, 1.0], x: ['0%', '0%'], y: ['3%', '-3%'] },
  },
  s13_10: {
    type: 'silent',
    image: 's13_10.png',
    kenBurns: { scale: [1.0, 1.06], x: ['0%', '0%'], y: ['0%', '0%'] },
  },
  s13_final: {
    type: 'frame',
    image: 's13_final.png',
    narration: '"A mission is not measured by how many people follow it. It is measured by how many continue it."',
    kenBurns: { scale: [1.12, 1.0], x: ['0%', '0%'], y: ['4%', '-4%'] },
    fadeToBlack: true,
  },
  s13_title: {
    type: 'textcard',
    line1: 'MISSION DISTINCTION',
    line2: 'Knowledge. Service. Humanity.',
    large: true,
  },
  s13_last: {
    type: 'textcard',
    line1: '"The story now belongs to them."',
  },
  s13_end: {
    type: 'black',
    narration: '',
    fadeIn: false,
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
    <div className="w-full overflow-hidden relative bg-black flex-1" style={{ height: '100dvh', minHeight: '100%' }}>
      <AnimatePresence mode="sync" initial={false}>
        {renderScene()}
      </AnimatePresence>
    </div>
  );
}
