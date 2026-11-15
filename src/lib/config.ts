import {
  SUBJECTS,
  defaultDuration,
  getLevel,
  subjectsFor,
  type Lang,
  type Level,
} from "./curriculum";
import type { ClassPreset, ExamConfig, Profile } from "./types";

/** Language a paper in this subject is normally written in at this level. */
export function defaultLang(subjectId: string, level: Level): Lang {
  const s = SUBJECTS[subjectId];
  if (!s) return "fr";
  if (s.bilingual && level.cycle === "primaire") return "ar";
  return s.lang;
}

/** Changing the level cascades: track, subject, exam type and defaults must stay coherent. */
export function withLevel(config: ExamConfig, levelId: string, trackId?: string): ExamConfig {
  const level = getLevel(levelId);
  if (!level) return config;
  const track = level.tracks
    ? (level.tracks.find((t) => t.id === (trackId ?? config.trackId)) ?? level.tracks[0]).id
    : "";
  const subjects = subjectsFor(level, track);
  const keepSubject =
    config.subjectId === "custom" || subjects.some((s) => s.id === config.subjectId);
  const subjectId = keepSubject ? config.subjectId : subjects[0].id;
  const examType = level.examTypes.includes(config.examType) ? config.examType : "cc";
  const levelChanged = level.id !== config.levelId;
  return {
    ...config,
    levelId: level.id,
    trackId: track,
    subjectId,
    examType,
    lang: keepSubject ? config.lang : defaultLang(subjectId, level),
    total: levelChanged ? level.defaultTotal : config.total,
    duration:
      levelChanged || examType !== config.examType ? defaultDuration(level, examType) : config.duration,
  };
}

export function withClass(config: ExamConfig, c: ClassPreset): ExamConfig {
  const next = withLevel({ ...config, subjectId: c.subjectId, customSubject: c.customSubject }, c.levelId, c.trackId);
  return { ...next, lang: c.lang };
}

export function classOf(config: ExamConfig): ClassPreset {
  return {
    levelId: config.levelId,
    trackId: config.trackId,
    subjectId: config.subjectId,
    customSubject: config.customSubject,
    lang: config.lang,
  };
}

export const sameClass = (a: ClassPreset, b: ClassPreset) =>
  a.levelId === b.levelId &&
  a.trackId === b.trackId &&
  a.subjectId === b.subjectId &&
  a.customSubject === b.customSubject &&
  a.lang === b.lang;

/** The header of a new paper comes from the teacher's profile. */
export function withProfile(config: ExamConfig, profile: Profile): ExamConfig {
  return {
    ...config,
    academy: profile.academy,
    direction: profile.direction,
    school: profile.school,
    teacher: profile.teacher,
  };
}
