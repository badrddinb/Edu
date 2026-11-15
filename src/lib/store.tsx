"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UiLang } from "./i18n";
import {
  DEFAULT_STYLE,
  type ExamConfig,
  type ExamStyle,
  type Pending,
  type Profile,
  type SavedExam,
  type Version,
  type VersionKind,
} from "./types";

const KEYS = {
  ui: "imtihan.ui",
  profile: "imtihan.profile",
  draft: "imtihan.prefs",
  exams: "imtihan.exams",
  code: "imtihan.code",
};
const MAX_EXAMS = 80;
const MAX_VERSIONS = 10;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app still works for this visit.
  }
}

function currentSchoolYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}/${start + 1}`;
}

export function defaultConfig(): ExamConfig {
  return {
    levelId: "2bac",
    trackId: "2bac_pc",
    subjectId: "maths",
    customSubject: "",
    examType: "cc",
    lang: "fr",
    semester: 1,
    examNumber: 1,
    session: "normale",
    duration: 120,
    total: 20,
    coefficient: "",
    schoolYear: currentSchoolYear(),
    academy: -1,
    direction: "",
    school: "",
    teacher: "",
    topics: "",
    difficulty: "standard",
    mix: null,
    exercises: 0,
    formats: [],
    instructions: "",
    withCorrection: true,
    specTable: false,
  };
}

const DEFAULT_PROFILE: Profile = {
  academy: -1,
  direction: "",
  school: "",
  teacher: "",
  logo: "",
  style: DEFAULT_STYLE,
  classes: [],
};

/** Fills in whatever an exam saved by an older version of the site is missing. */
export function normalizeExam(input: Partial<SavedExam> & { id: string }): SavedExam {
  const createdAt = input.createdAt ?? Date.now();
  return {
    id: input.id,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    title: input.title ?? "",
    status: input.status ?? "draft",
    starred: input.starred ?? false,
    config: { ...defaultConfig(), ...input.config },
    style: { ...DEFAULT_STYLE, ...input.style },
    exam: input.exam ?? "",
    correction: input.correction ?? "",
    versions: Array.isArray(input.versions) ? input.versions : [],
    pending: input.pending ?? null,
  };
}

function loadExams(): SavedExam[] {
  const raw = read<unknown>(KEYS.exams, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is SavedExam => Boolean(e) && typeof e === "object" && typeof e.id === "string")
    .map(normalizeExam);
}

interface Store {
  ui: UiLang;
  setUi: (ui: UiLang) => void;
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
  /** The form being filled in the creation screen, kept between visits. */
  draft: ExamConfig;
  setDraft: (config: ExamConfig) => void;
  exams: SavedExam[];
  createExam: (init: {
    config: ExamConfig;
    title?: string;
    exam?: string;
    correction?: string;
    style?: ExamStyle;
    pending?: Pending | null;
  }) => string;
  updateExam: (id: string, patch: Partial<SavedExam>) => void;
  /** Replaces the text of an exam and records the new state in its history. */
  commitText: (id: string, exam: string, correction: string, kind: VersionKind, note?: string) => void;
  removeExam: (id: string) => void;
  importExams: (list: unknown) => number;
  code: string;
  setCode: (code: string) => void;
  server: { ready: boolean; needsCode: boolean } | null;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore outside StoreProvider");
  return store;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ui, setUi] = useState<UiLang>(() => (read<string>(KEYS.ui, "fr") === "ar" ? "ar" : "fr"));
  const [profile, setProfileState] = useState<Profile>(() => {
    const saved = read<Partial<Profile>>(KEYS.profile, {});
    return {
      ...DEFAULT_PROFILE,
      ...saved,
      style: { ...DEFAULT_STYLE, ...saved.style },
      classes: Array.isArray(saved.classes) ? saved.classes : [],
    };
  });
  const [draft, setDraft] = useState<ExamConfig>(() => ({
    ...defaultConfig(),
    ...read<Partial<ExamConfig>>(KEYS.draft, {}),
  }));
  const [exams, setExams] = useState<SavedExam[]>(loadExams);
  const [code, setCode] = useState(() => read<string>(KEYS.code, ""));
  const [server, setServer] = useState<Store["server"]>(null);

  useEffect(() => {
    document.documentElement.lang = ui;
    document.documentElement.dir = ui === "ar" ? "rtl" : "ltr";
    write(KEYS.ui, ui);
  }, [ui]);
  useEffect(() => write(KEYS.profile, profile), [profile]);
  useEffect(() => write(KEYS.draft, draft), [draft]);
  useEffect(() => write(KEYS.exams, exams), [exams]);
  useEffect(() => write(KEYS.code, code), [code]);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setServer)
      .catch(() => setServer(null));
  }, []);

  const setProfile = useCallback(
    (patch: Partial<Profile>) => setProfileState((p) => ({ ...p, ...patch })),
    [],
  );

  const createExam = useCallback<Store["createExam"]>((init) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const entry = normalizeExam({ id, createdAt: now, ...init });
    if (entry.exam) {
      entry.versions = [
        { at: now, kind: "manual", note: "", exam: entry.exam, correction: entry.correction },
      ];
    }
    setExams((list) => [entry, ...list].slice(0, MAX_EXAMS));
    return id;
  }, []);

  const updateExam = useCallback((id: string, patch: Partial<SavedExam>) => {
    setExams((list) =>
      list.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)),
    );
  }, []);

  const commitText = useCallback<Store["commitText"]>((id, exam, correction, kind, note = "") => {
    setExams((list) =>
      list.map((e) => {
        if (e.id !== id) return e;
        const version: Version = { at: Date.now(), kind, note, exam, correction };
        return {
          ...e,
          exam,
          correction,
          pending: null,
          updatedAt: version.at,
          versions: [version, ...e.versions].slice(0, MAX_VERSIONS),
        };
      }),
    );
  }, []);

  const removeExam = useCallback(
    (id: string) => setExams((list) => list.filter((e) => e.id !== id)),
    [],
  );

  const importExams = useCallback((input: unknown) => {
    if (!Array.isArray(input)) return 0;
    const incoming = input
      .filter(
        (e): e is SavedExam =>
          Boolean(e) && typeof e === "object" && typeof e.id === "string" && typeof e.exam === "string",
      )
      .map(normalizeExam);
    setExams((list) => {
      const known = new Set(list.map((e) => e.id));
      return [...incoming.filter((e) => !known.has(e.id)), ...list].slice(0, MAX_EXAMS);
    });
    return incoming.length;
  }, []);

  const value = useMemo<Store>(
    () => ({
      ui,
      setUi,
      profile,
      setProfile,
      draft,
      setDraft,
      exams,
      createExam,
      updateExam,
      commitText,
      removeExam,
      importExams,
      code,
      setCode,
      server,
    }),
    [ui, profile, setProfile, draft, exams, createExam, updateExam, commitText, removeExam, importExams, code, server],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
