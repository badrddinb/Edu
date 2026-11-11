import type { Difficulty, ExamTypeId, Lang } from "./curriculum";

/** Everything the teacher chooses before generating. */
export interface ExamConfig {
  levelId: string;
  trackId: string;
  subjectId: string;
  /** Free-text subject name, used when subjectId is "custom". */
  customSubject: string;
  examType: ExamTypeId;
  lang: Lang;
  semester: 1 | 2;
  examNumber: number;
  session: "normale" | "rattrapage";
  duration: number;
  total: number;
  coefficient: string;
  schoolYear: string;
  academy: number; // index into ACADEMIES, -1 for none
  direction: string;
  school: string;
  teacher: string;
  topics: string;
  difficulty: Difficulty;
  instructions: string;
  withCorrection: boolean;
}

export interface SavedExam {
  id: string;
  createdAt: number;
  config: ExamConfig;
  exam: string;
  correction: string;
}

export const CORRECTION_MARKER = "===CORRECTION===";

export function splitOutput(raw: string): { exam: string; correction: string } {
  const i = raw.indexOf(CORRECTION_MARKER);
  if (i === -1) return { exam: stripPartialMarker(raw).trim(), correction: "" };
  return {
    exam: raw.slice(0, i).trim(),
    correction: raw.slice(i + CORRECTION_MARKER.length).trim(),
  };
}

// While streaming, the marker arrives a few characters at a time; hide the
// partial tail so "===CORR" never flashes at the bottom of the paper.
function stripPartialMarker(raw: string): string {
  for (let n = CORRECTION_MARKER.length - 1; n >= 3; n--) {
    if (raw.endsWith(CORRECTION_MARKER.slice(0, n))) return raw.slice(0, -n);
  }
  return raw;
}
