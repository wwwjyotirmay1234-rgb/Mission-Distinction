export const ODISHA_GOVT_COLLEGES = [
  "AIIMS Bhubaneswar",
  "SCB Medical College and Hospital, Cuttack",
  "MKCG Medical College and Hospital, Berhampur",
  "VSS Institute of Medical Sciences & Research (VIMSAR), Burla",
  "Pandit Raghunath Murmu Medical College and Hospital, Mayurbhanj",
  "Fakir Mohan Medical College and Hospital, Balasore",
  "Bhima Bhoi Medical College and Hospital, Balangir",
  "Saheed Laxman Nayak Medical College and Hospital, Koraput",
  "Government Medical College and Hospital, Sundargarh",
  "Jajati Keshari Medical College and Hospital, Jajpur",
  "Government Medical College and Hospital, Keonjhar",
  "Sri Jagannath Medical College and Hospital, Puri",
  "Saheed Rendo Majhi Medical College and Hospital, Kalahandi",
  "Dharanidhar Medical College and Hospital, Keonjhar",
];

export const ODISHA_PRIVATE_COLLEGES = [
  "Hi-Tech Medical College and Hospital, Bhubaneswar",
  "Hi-Tech Medical College and Hospital, Rourkela",
  "DRIEMS Institute of Health Sciences and Hospital, Cuttack",
];

export const ODISHA_DEEMED_COLLEGES = [
  "IMS and SUM Hospital (SOA University), Bhubaneswar",
  "IMS and SUM Hospital Campus II, Cuttack",
  "Kalinga Institute of Medical Sciences (KIMS), Bhubaneswar",
];

export const MBBS_YEARS = ["1st Year", "2nd Year", "3rd/4th Year", "Final Year"];

// Subjects by MBBS year — used across student pages for category filtering
export const SUBJECTS_BY_YEAR: Record<string, string[]> = {
  "1st Year":     ["Anatomy", "Physiology", "Biochemistry", "Community Medicine"],
  "2nd Year":     ["Pathology", "Pharmacology", "Microbiology", "Community Medicine", "Forensic Medicine"],
  "3rd/4th Year": ["General Medicine", "General Surgery", "OBG", "Pediatrics", "ENT", "Ophthalmology", "Community Medicine", "Forensic Medicine"],
  "Final Year":   ["General Medicine", "General Surgery", "OBG", "Pediatrics", "Dermatology", "Psychiatry", "Orthopedics", "Radiodiagnosis", "Anesthesiology"],
};
export const DEFAULT_SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

export const SESSION_YEARS = [
  "2022-23", "2023-24", "2024-25", "2025-26", "2026-27", "2027-28",
];

export const ACTIVE_SESSION_YEAR = "2025-26";
export const ACTIVE_MBBS_YEAR   = "1st Year";

// Session years that currently have a live 1st Year feature portal.
// "2026-27" is the upcoming batch — they get the same features as the
// current batch, but in their own isolated cohort ("room") for
// community/doubts/confessions/study rooms/leaderboard.
export const ACTIVE_SESSION_YEARS = [ACTIVE_SESSION_YEAR, "2026-27"];
