import type { Difficulty, ExamTypeId, Lang, QuestionFormat } from "./curriculum";

/** Share of the marks given to each kind of question, in percent. */
export interface Mix {
  knowledge: number;
  application: number;
  reasoning: number;
}

/** Everything that describes one exam: who sits it, what it assesses, how hard it is. */
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
  /** null lets the official framework of the exam decide. */
  mix: Mix | null;
  /** 0 lets the model choose. */
  exercises: number;
  formats: QuestionFormat[];
  instructions: string;
  withCorrection: boolean;
  /** Add a table of specification to the marking guide. */
  specTable: boolean;
}

export const TEMPLATES = ["officiel", "moderne", "compact", "primaire"] as const;
export type Template = (typeof TEMPLATES)[number];
export const ACCENTS = ["black", "green", "blue", "red", "purple"] as const;
export type Accent = (typeof ACCENTS)[number];

/** How the printed sheet looks. Changing it never touches the content. */
export interface ExamStyle {
  template: Template;
  size: "s" | "m" | "l";
  marks: "margin" | "inline" | "hidden";
  accent: Accent;
  /** Name / class / mark line under the header. */
  strip: boolean;
  logo: boolean;
  /** Closing line such as "Bonne chance". */
  closing: boolean;
  /** Blank lines under each question so pupils answer on the sheet. */
  answerSpace: boolean;
}

export const DEFAULT_STYLE: ExamStyle = {
  template: "officiel",
  size: "m",
  marks: "margin",
  accent: "black",
  strip: true,
  logo: true,
  closing: false,
  answerSpace: false,
};

export type VersionKind = "generation" | "revision" | "variant" | "manual";

export interface Version {
  at: number;
  kind: VersionKind;
  note: string;
  exam: string;
  correction: string;
}

export const STATUSES = ["draft", "ready", "used"] as const;
export type Status = (typeof STATUSES)[number];

/** What the workspace must do when it opens an exam that has no text yet. */
export type Pending = ({ mode: "generate" } | { mode: "variant"; source: string }) & {
  /** Set once an attempt was stopped or failed: wait for the teacher to retry. */
  held?: boolean;
};

export interface SavedExam {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** Empty means "use the automatic title". */
  title: string;
  status: Status;
  starred: boolean;
  config: ExamConfig;
  style: ExamStyle;
  exam: string;
  correction: string;
  /** Earlier states of the text, newest first. */
  versions: Version[];
  pending: Pending | null;
}

export interface ClassPreset {
  levelId: string;
  trackId: string;
  subjectId: string;
  customSubject: string;
  lang: Lang;
}

/** The teacher's own details, entered once and printed on every paper. */
export interface Profile {
  academy: number;
  direction: string;
  school: string;
  teacher: string;
  /** Small data URL, or "". */
  logo: string;
  style: ExamStyle;
  classes: ClassPreset[];
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

export function joinOutput(exam: string, correction: string): string {
  return correction ? `${exam}\n\n${CORRECTION_MARKER}\n\n${correction}` : exam;
}

// While streaming, the marker arrives a few characters at a time; hide the
// partial tail so "===CORR" never flashes at the bottom of the paper.
function stripPartialMarker(raw: string): string {
  for (let n = CORRECTION_MARKER.length - 1; n >= 3; n--) {
    if (raw.endsWith(CORRECTION_MARKER.slice(0, n))) return raw.slice(0, -n);
  }
  return raw;
}
