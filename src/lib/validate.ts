import {
  ACADEMIES,
  DIFFICULTIES,
  QUESTION_FORMATS,
  SUBJECTS,
  getLevel,
  subjectsFor,
} from "./curriculum";
import type { ExamConfig, Mix } from "./types";

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.slice(0, max) : "";

const int = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

function parseMix(v: unknown): Mix | null {
  if (!v || typeof v !== "object") return null;
  const m = v as Record<string, unknown>;
  const knowledge = int(m.knowledge, 0, 100, -1);
  const application = int(m.application, 0, 100, -1);
  const reasoning = int(m.reasoning, 0, 100, -1);
  if (knowledge < 0 || application < 0 || reasoning < 0) return null;
  if (knowledge + application + reasoning !== 100) return null;
  return { knowledge, application, reasoning };
}

/** Returns a clean config, or null when the request does not describe a real exam. */
export function parseConfig(input: unknown): ExamConfig | null {
  if (!input || typeof input !== "object") return null;
  const c = input as Record<string, unknown>;

  const level = getLevel(str(c.levelId, 20));
  if (!level) return null;

  const trackId = str(c.trackId, 30);
  if (level.tracks && !level.tracks.some((t) => t.id === trackId)) return null;

  const subjectId = str(c.subjectId, 30);
  const customSubject = str(c.customSubject, 80).trim();
  if (subjectId === "custom") {
    if (!customSubject) return null;
  } else if (!SUBJECTS[subjectId] || !subjectsFor(level, trackId).some((s) => s.id === subjectId)) {
    return null;
  }

  const examType = str(c.examType, 20) as ExamConfig["examType"];
  if (!level.examTypes.includes(examType)) return null;

  const lang = c.lang === "ar" || c.lang === "en" ? c.lang : "fr";
  const difficulty = DIFFICULTIES.find((d) => d === c.difficulty) ?? "standard";

  return {
    levelId: level.id,
    trackId: level.tracks ? trackId : "",
    subjectId,
    customSubject,
    examType,
    lang,
    semester: c.semester === 2 ? 2 : 1,
    examNumber: int(c.examNumber, 1, 9, 1),
    session: c.session === "rattrapage" ? "rattrapage" : "normale",
    duration: int(c.duration, 15, 300, 120),
    total: int(c.total, 5, 100, level.defaultTotal),
    coefficient: str(c.coefficient, 6),
    schoolYear: str(c.schoolYear, 12),
    academy: int(c.academy, -1, ACADEMIES.length - 1, -1),
    direction: str(c.direction, 80),
    school: str(c.school, 100),
    teacher: str(c.teacher, 80),
    topics: str(c.topics, 4000),
    difficulty,
    mix: parseMix(c.mix),
    exercises: int(c.exercises, 2, 8, 0),
    formats: Array.isArray(c.formats)
      ? QUESTION_FORMATS.filter((f) => (c.formats as unknown[]).includes(f))
      : [],
    instructions: str(c.instructions, 2000),
    withCorrection: c.withCorrection !== false,
    specTable: c.specTable === true,
  };
}
