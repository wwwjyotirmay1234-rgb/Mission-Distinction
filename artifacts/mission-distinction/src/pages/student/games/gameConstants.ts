export const ALL_SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry",
  "Pathology", "Pharmacology", "Microbiology", "Forensic Medicine",
  "Internal Medicine", "Surgery", "Obstetrics & Gynecology",
  "Pediatrics", "Ophthalmology", "ENT", "Orthopedics",
  "Psychiatry", "Community Medicine", "Dermatology",
] as const;

export type Subject = (typeof ALL_SUBJECTS)[number];

export type Difficulty = "foundation" | "clinical" | "neet-pg";

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: "foundation", label: "Foundation", desc: "1st–2nd Year MBBS" },
  { value: "clinical",   label: "Clinical",   desc: "Final Year MBBS" },
  { value: "neet-pg",    label: "NEET PG",    desc: "PG Entrance Level" },
];
