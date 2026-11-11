"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { UI, summary, type UiKey, type UiLang } from "@/lib/i18n";
import { SAMPLE_CONFIG, SAMPLE_CORRECTION, SAMPLE_EXAM } from "@/lib/sample";
import { CORRECTION_MARKER, splitOutput, type ExamConfig, type SavedExam } from "@/lib/types";
import ExamForm from "./ExamForm";
import Paper from "./Paper";

const KEYS = {
  ui: "imtihan.ui",
  prefs: "imtihan.prefs",
  exams: "imtihan.exams",
  code: "imtihan.code",
};
const MAX_SAVED = 40;

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

function initialConfig(): ExamConfig {
  const base: ExamConfig = {
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
    instructions: "",
    withCorrection: true,
  };
  // Header details and the last level used are remembered between visits.
  return { ...base, ...read<Partial<ExamConfig>>(KEYS.prefs, {}) };
}

type Status = "idle" | "thinking" | "writing";
type PrintMode = "exam" | "correction" | "both";

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="6" y="6" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect
        x="6"
        y="6"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        transform="rotate(45 16 16)"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink transition-colors hover:border-brand/60 hover:bg-brand-soft disabled:opacity-50";

export default function App() {
  const [ui, setUi] = useState<UiLang>(() => read<UiLang>(KEYS.ui, "fr"));
  const [config, setConfig] = useState<ExamConfig>(initialConfig);
  // The settings the visible paper was generated with; the form may have moved on since.
  const [paperConfig, setPaperConfig] = useState<ExamConfig | null>(null);
  const [exam, setExam] = useState("");
  const [correction, setCorrection] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<UiKey | null>(null);
  const [tab, setTab] = useState<"exam" | "correction">("exam");
  const [editing, setEditing] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("exam");
  const [printMenu, setPrintMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revision, setRevision] = useState("");
  const [saved, setSaved] = useState<SavedExam[]>(() => read<SavedExam[]>(KEYS.exams, []));
  const [drawer, setDrawer] = useState(false);
  const [server, setServer] = useState<{ ready: boolean; needsCode: boolean } | null>(null);
  const [code, setCode] = useState(() => read<string>(KEYS.code, ""));
  const abort = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const t = UI[ui];
  const busy = status !== "idle";

  useEffect(() => {
    document.documentElement.lang = ui;
    document.documentElement.dir = ui === "ar" ? "rtl" : "ltr";
    write(KEYS.ui, ui);
  }, [ui]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setServer)
      .catch(() => setServer(null));
  }, []);

  useEffect(() => {
    // Topics and instructions belong to one exam; everything else is a preference.
    const { topics, instructions, ...prefs } = config;
    void topics;
    void instructions;
    write(KEYS.prefs, prefs);
  }, [config]);

  useEffect(() => write(KEYS.code, code), [code]);

  const persist = useCallback((list: SavedExam[]) => {
    setSaved(list);
    write(KEYS.exams, list);
  }, []);

  /** Keeps the saved copy in step with the paper, including the teacher's own edits. */
  const saveCurrent = useCallback(
    (id: string, cfg: ExamConfig, examText: string, correctionText: string) => {
      setSaved((list) => {
        const existing = list.find((e) => e.id === id);
        const entry: SavedExam = {
          id,
          createdAt: existing?.createdAt ?? Date.now(),
          config: cfg,
          exam: examText,
          correction: correctionText,
        };
        const next = [entry, ...list.filter((e) => e.id !== id)].slice(0, MAX_SAVED);
        write(KEYS.exams, next);
        return next;
      });
    },
    [],
  );

  async function run(cfg: ExamConfig, revise?: { request: string; current: string }) {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    setEditing(false);
    setIsSample(false);
    setStatus("thinking");
    setTab("exam");
    setPaperConfig(cfg);
    const before = { exam, correction };
    setExam("");
    setCorrection("");
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const id = revise && currentId ? currentId : crypto.randomUUID();
    let raw = "";
    let lastPaint = 0;
    const paint = (force = false) => {
      const now = performance.now();
      if (!force && now - lastPaint < 150) return;
      lastPaint = now;
      const parts = splitOutput(raw);
      setExam(parts.exam);
      setCorrection(parts.correction);
      if (parts.correction) setTab("correction");
    };
    const restore = () => {
      // Nothing usable arrived: put back what the teacher had.
      if (raw.trim()) return;
      setExam(before.exam);
      setCorrection(before.correction);
      if (!before.exam) setPaperConfig(null);
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": code },
        body: JSON.stringify({ config: cfg, revision: revise?.request, current: revise?.current }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.code === "string" ? body.code : "unknown");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let failure: string | null = null;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.t === "delta") {
            raw += event.v;
            paint();
          } else if (event.t === "phase") {
            setStatus(event.v);
          } else if (event.t === "reset") {
            raw = "";
            paint(true);
          } else if (event.t === "error") {
            failure = event.code;
          }
        }
      }
      paint(true);
      if (failure) throw new Error(failure);
      if (!raw.trim()) throw new Error("unknown");

      const parts = splitOutput(raw);
      setCurrentId(id);
      saveCurrent(id, cfg, parts.exam, parts.correction);
      setTab("exam");
      setRevision("");
    } catch (err) {
      if (controller.signal.aborted) {
        restore();
      } else {
        const codeName = err instanceof TypeError ? "network" : (err as Error).message;
        const key = `err_${codeName}` as UiKey;
        setError(key in t ? key : "err_unknown");
        restore();
      }
    } finally {
      if (abort.current === controller) {
        abort.current = null;
        setStatus("idle");
      }
    }
  }

  function showSample() {
    const cfg: ExamConfig = { ...config, ...SAMPLE_CONFIG };
    setConfig(cfg);
    setPaperConfig(cfg);
    setExam(SAMPLE_EXAM);
    setCorrection(SAMPLE_CORRECTION);
    setCurrentId(null);
    setIsSample(true);
    setError(null);
    setTab("exam");
    setEditing(false);
  }

  function openSaved(entry: SavedExam) {
    setConfig({ ...config, ...entry.config });
    setPaperConfig(entry.config);
    setExam(entry.exam);
    setCorrection(entry.correction);
    setCurrentId(entry.id);
    setIsSample(false);
    setError(null);
    setTab("exam");
    setEditing(false);
    setDrawer(false);
  }

  function edit(text: string) {
    const next = tab === "exam" ? { exam: text, correction } : { exam, correction: text };
    setExam(next.exam);
    setCorrection(next.correction);
    if (currentId && paperConfig) saveCurrent(currentId, paperConfig, next.exam, next.correction);
  }

  function print(mode: PrintMode) {
    setPrintMenu(false);
    flushSync(() => setPrintMode(mode));
    window.print();
  }

  async function copy() {
    const text = tab === "exam" ? exam : correction;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable: nothing to report, the text is still editable.
    }
  }

  const canGenerate =
    !busy && (config.subjectId !== "custom" || config.customSubject.trim().length > 0);
  const hasPaper = Boolean(paperConfig && (exam || busy));
  const phase =
    status === "thinking" ? t.phaseThinking : correction ? t.phaseCorrection : t.phaseWriting;
  const needsCode = server?.needsCode || error === "err_bad_code";

  return (
    <div className="min-h-screen" data-tab={tab} data-print={printMode}>
      <header className="no-print border-b border-brand-deep bg-brand text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
          <Star className="size-8 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold leading-tight">
              {t.brand}
              <span className="ms-2 font-normal text-white/60">{ui === "fr" ? "امتحان" : "Imtihan"}</span>
            </div>
            <div className="truncate text-xs text-white/75">{t.tagline}</div>
          </div>
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            {t.myExams}
            {saved.length > 0 && <span className="ms-1.5 text-white/70">{saved.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setUi(ui === "fr" ? "ar" : "fr")}
            lang={ui === "fr" ? "ar" : "fr"}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            {ui === "fr" ? "العربية" : "Français"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[430px_minmax(0,1fr)] print:block print:p-0">
        <aside className="no-print lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start">
          <div className="flex max-h-[inherit] flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ExamForm ui={ui} config={config} onChange={setConfig} />
            </div>
            <div className="space-y-2.5 border-t border-line bg-card p-4">
              {needsCode && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">{t.accessCode}</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <span className="mt-1.5 block text-xs text-muted">{t.accessCodeHelp}</span>
                </label>
              )}
              {busy ? (
                <button
                  type="button"
                  onClick={() => abort.current?.abort()}
                  className="w-full rounded-xl border border-accent px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/5"
                >
                  {t.stop}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canGenerate}
                  onClick={() => run(config)}
                  className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
                >
                  {t.generate}
                </button>
              )}
              {server && !server.ready && (
                <p className="text-xs leading-relaxed text-muted">{t.err_no_key}</p>
              )}
            </div>
          </div>
        </aside>

        <section ref={previewRef} className="min-w-0 scroll-mt-4">
          {error && (
            <div
              role="alert"
              className="no-print mb-4 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent"
            >
              {t[error]}
            </div>
          )}

          {!hasPaper || !paperConfig ? (
            <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-dashed border-line bg-card/60 px-6 py-16 text-center">
              <div className="max-w-md">
                <Star className="mx-auto mb-4 size-12 text-gold" />
                <h1 className="text-xl font-semibold text-brand-deep">{t.emptyTitle}</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.emptyBody}</p>
                <button type="button" onClick={showSample} className={`${btn} mt-5`}>
                  {t.seeSample}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="no-print mb-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-line bg-white p-0.5">
                    {(["exam", "correction"] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={tab === id}
                        disabled={id === "correction" && !correction}
                        onClick={() => setTab(id)}
                        className={`rounded-md px-3 py-1 text-sm disabled:opacity-40 ${
                          tab === id ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
                        }`}
                      >
                        {id === "exam" ? t.tabExam : t.tabCorrection}
                      </button>
                    ))}
                  </div>
                  {isSample && (
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold">
                      {t.sampleBadge}
                    </span>
                  )}
                  <div className="flex-1" />
                  {busy ? (
                    <span className="flex items-center gap-2 text-sm text-muted" role="status">
                      <span className="size-2 animate-pulse rounded-full bg-brand" />
                      {phase}
                    </span>
                  ) : (
                    <>
                      <button type="button" className={btn} onClick={() => setEditing(!editing)}>
                        {editing ? t.preview : t.edit}
                      </button>
                      <button type="button" className={btn} onClick={copy}>
                        {copied ? t.copied : t.copy}
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          aria-expanded={printMenu}
                          onClick={() => (correction ? setPrintMenu(!printMenu) : print("exam"))}
                          className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-deep"
                        >
                          {t.print}
                        </button>
                        {printMenu && (
                          <div className="absolute end-0 z-10 mt-1 w-52 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
                            {(
                              [
                                ["exam", t.printExam],
                                ["correction", t.printCorrection],
                                ["both", t.printBoth],
                              ] as const
                            ).map(([mode, label]) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => print(mode)}
                                className="block w-full px-3 py-2 text-start text-sm hover:bg-brand-soft"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!busy && !isSample && (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!revision.trim()) return;
                      const current = correction
                        ? `${exam}\n\n${CORRECTION_MARKER}\n\n${correction}`
                        : exam;
                      run(paperConfig, { request: revision, current });
                    }}
                  >
                    <input
                      value={revision}
                      maxLength={2000}
                      onChange={(e) => setRevision(e.target.value)}
                      placeholder={t.revisePlaceholder}
                      aria-label={t.revise}
                      className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <button type="submit" className={btn} disabled={!revision.trim()}>
                      {t.revise}
                    </button>
                  </form>
                )}

                {editing && !busy && (
                  <div>
                    <textarea
                      dir={paperConfig.lang === "ar" ? "rtl" : "ltr"}
                      value={tab === "exam" ? exam : correction}
                      onChange={(e) => edit(e.target.value)}
                      spellCheck={false}
                      className="h-72 w-full resize-y rounded-xl border border-line bg-white p-3 font-mono text-[13px] leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <p className="mt-1 text-xs text-muted">{t.editHelp}</p>
                  </div>
                )}

                {!isSample && !busy && <p className="text-xs text-muted">{t.reviewNote}</p>}
              </div>

              <Paper config={paperConfig} exam={exam} correction={correction} streaming={busy} />
            </>
          )}
        </section>
      </main>

      {drawer && (
        <div className="no-print fixed inset-0 z-20 flex justify-end bg-ink/40" onClick={() => setDrawer(false)}>
          <div
            role="dialog"
            aria-label={t.myExams}
            className="flex h-full w-full max-w-md flex-col bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-brand-deep">{t.myExams}</h2>
              <button type="button" className={btn} onClick={() => setDrawer(false)}>
                {t.close}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {saved.length === 0 && (
                <p className="p-4 text-sm leading-relaxed text-muted">{t.historyEmpty}</p>
              )}
              {saved.map((entry) => (
                <div key={entry.id} className="mb-2 rounded-xl border border-line bg-white p-3">
                  <div className="text-sm font-medium">{summary(entry.config, ui)}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {new Date(entry.createdAt).toLocaleDateString(ui === "ar" ? "ar-MA" : "fr-MA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {entry.config.topics && ` · ${entry.config.topics.slice(0, 70)}`}
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button type="button" className={btn} onClick={() => openSaved(entry)}>
                      {t.open}
                    </button>
                    <button
                      type="button"
                      className={`${btn} text-accent`}
                      onClick={() => {
                        persist(saved.filter((e) => e.id !== entry.id));
                        if (currentId === entry.id) setCurrentId(null);
                      }}
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
