"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ACADEMIES, EXAM_TYPES } from "@/lib/curriculum";
import { streamExam } from "@/lib/generate";
import { UI, examDisplayTitle, summary, type UiKey } from "@/lib/i18n";
import { sumMarks } from "@/lib/marks";
import { useStore } from "@/lib/store";
import {
  STATUSES,
  joinOutput,
  splitOutput,
  type ExamConfig,
  type SavedExam,
  type Status,
  type VersionKind,
} from "@/lib/types";
import AccessCode from "./AccessCode";
import MixBar from "./MixBar";
import Paper from "./Paper";
import StylePanel from "./StylePanel";
import { Choices, Field, btnCls, btnPrimaryCls, download, inputCls } from "./ui";

type Phase = "idle" | "thinking" | "writing";
type PrintMode = "exam" | "correction" | "both";
type Panel = "assistant" | "style" | "details" | "versions";

// Exams whose first generation has already been started in this visit, so a
// re-render (or React's development double-mount) never starts it twice.
const started = new Set<string>();

const QUICK: UiKey[] = [
  "quick_easier",
  "quick_harder",
  "quick_shorter",
  "quick_data",
  "quick_qcm",
  "quick_context",
];

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const exam = store.exams.find((e) => e.id === id);
  const t = UI[store.ui];
  if (!exam) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted">{t.examNotFound}</p>
        <Link href="/examens" className={`${btnPrimaryCls} mt-4`}>
          {t.myExams}
        </Link>
      </div>
    );
  }
  return <Workspace key={exam.id} exam={exam} />;
}

function Workspace({ exam }: { exam: SavedExam }) {
  const { ui, profile, setProfile, setDraft, code, createExam, updateExam, commitText, removeExam } =
    useStore();
  const t = UI[ui];
  const router = useRouter();
  const { id, config, style } = exam;

  const [phase, setPhase] = useState<Phase>("idle");
  const [live, setLive] = useState<{ exam: string; correction: string } | null>(null);
  const [error, setError] = useState<UiKey | null>(null);
  const [tab, setTab] = useState<"exam" | "correction">("exam");
  const [panel, setPanel] = useState<Panel>("assistant");
  // On a phone the tools sit above the paper, folded until a tab is tapped.
  const [toolsOpen, setToolsOpen] = useState(false);
  const [buffer, setBuffer] = useState<{ exam: string; correction: string } | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>("exam");
  const [menu, setMenu] = useState<"print" | "more" | null>(null);
  const [copied, setCopied] = useState(false);
  const [revision, setRevision] = useState("");
  const abort = useRef<AbortController | null>(null);

  const busy = phase !== "idle";
  const editing = buffer !== null;
  const shown = live ?? buffer ?? { exam: exam.exam, correction: exam.correction };
  const hasText = Boolean(exam.exam);

  // A first attempt that failed or was stopped must not restart by itself.
  const hold = useCallback(() => {
    if (exam.pending && !exam.pending.held) {
      updateExam(id, { pending: { ...exam.pending, held: true } });
    }
  }, [exam.pending, id, updateExam]);

  const run = useCallback(
    async (opts: { mode?: "revise" | "variant"; current?: string; revision?: string; kind: VersionKind }) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setError(null);
      setBuffer(null);
      setPhase("thinking");
      setTab("exam");
      setLive({ exam: "", correction: "" });
      let last = 0;
      try {
        const raw = await streamExam({
          config,
          code,
          mode: opts.mode,
          current: opts.current,
          revision: opts.revision,
          signal: controller.signal,
          onPhase: setPhase,
          onText: (text) => {
            const now = performance.now();
            if (now - last < 150) return;
            last = now;
            const parts = splitOutput(text);
            setLive(parts);
            if (parts.correction) setTab("correction");
          },
        });
        const parts = splitOutput(raw);
        commitText(id, parts.exam, parts.correction, opts.kind, opts.revision ?? "");
        setRevision("");
        setTab("exam");
      } catch (err) {
        if (!controller.signal.aborted) {
          const key = `err_${(err as Error).message}` as UiKey;
          setError(key in UI.fr ? key : "err_unknown");
          hold();
        }
      } finally {
        if (abort.current === controller) {
          abort.current = null;
          setLive(null);
          setPhase("idle");
        }
      }
    },
    [config, code, id, commitText, hold],
  );

  const startPending = useCallback(() => {
    const pending = exam.pending;
    return run(
      pending?.mode === "variant"
        ? { mode: "variant", current: pending.source, kind: "variant" }
        : { kind: "generation" },
    );
  }, [exam.pending, run]);

  // A freshly created exam writes itself as soon as its workspace opens.
  useEffect(() => {
    if (!exam.pending || exam.pending.held || started.has(id)) return;
    started.add(id);
    // Starting the request is the point of this effect; it sets state as it goes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startPending();
  }, [exam.pending, id, startPending]);

  useEffect(
    () => () => {
      abort.current?.abort();
      started.delete(id);
    },
    [id],
  );

  const setConfig = (patch: Partial<ExamConfig>) => updateExam(id, { config: { ...config, ...patch } });

  function finishEditing() {
    if (!buffer) return;
    if (buffer.exam !== exam.exam || buffer.correction !== exam.correction) {
      commitText(id, buffer.exam, buffer.correction, "manual");
    }
    setBuffer(null);
  }

  function print(mode: PrintMode) {
    setMenu(null);
    flushSync(() => setPrintMode(mode));
    window.print();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(tab === "exam" ? shown.exam : shown.correction);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable: the text can still be selected by hand.
    }
  }

  function duplicate() {
    const copyId = createExam({
      config,
      style,
      title: `${examDisplayTitle(exam, ui)} (${t.copySuffix})`,
      exam: exam.exam,
      correction: exam.correction,
    });
    router.push(`/examens/${copyId}`);
  }

  function variant() {
    const variantId = createExam({
      config,
      style,
      title: `${examDisplayTitle(exam, ui)} — ${t.variantSuffix}`,
      pending: { mode: "variant", source: joinOutput(exam.exam, exam.correction) },
    });
    router.push(`/examens/${variantId}`);
  }

  function remove() {
    if (!window.confirm(t.confirmDelete)) return;
    removeExam(id);
    router.push("/examens");
  }

  const marks = sumMarks(shown.exam);
  const marksOk = Math.abs(marks.sum - config.total) < 0.01;
  const phaseLabel =
    phase === "thinking" ? t.phaseThinking : shown.correction ? t.phaseCorrection : t.phaseWriting;
  const type = EXAM_TYPES[config.examType];
  const panels: [Panel, string][] = [
    ["assistant", t.panelAssistant],
    ["style", t.panelStyle],
    ["details", t.panelDetails],
    ["versions", `${t.panelVersions}${exam.versions.length ? ` ${exam.versions.length}` : ""}`],
  ];

  return (
    <div data-tab={tab} data-print={printMode}>
      {/* Identity of the exam */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Link href="/examens" className={btnCls} aria-label={t.myExams}>
          <span className="rtl:rotate-180">←</span>
        </Link>
        <input
          aria-label={t.examTitle}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-lg font-semibold text-brand-deep hover:border-line focus:border-brand focus:bg-white focus:outline-none"
          value={exam.title}
          placeholder={summary(config, ui)}
          maxLength={120}
          onChange={(e) => updateExam(id, { title: e.target.value })}
        />
        <button
          type="button"
          aria-pressed={exam.starred}
          aria-label={t.star}
          title={t.star}
          onClick={() => updateExam(id, { starred: !exam.starred })}
          className={`${btnCls} text-base ${exam.starred ? "border-gold text-gold" : "text-muted"}`}
        >
          {exam.starred ? "★" : "☆"}
        </button>
        <select
          aria-label={t.status}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
          value={exam.status}
          onChange={(e) => updateExam(id, { status: e.target.value as Status })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t[`status_${s}`]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 print:block">
        <section className="min-w-0">
          {error && (
            <div
              role="alert"
              className="no-print mb-4 space-y-3 rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent"
            >
              <p>{t[error]}</p>
              {error === "err_bad_code" && (
                <div className="max-w-xs text-ink">
                  <AccessCode force />
                </div>
              )}
            </div>
          )}

          {!hasText && !busy ? (
            <div className="grid min-h-[50vh] place-items-center rounded-2xl border border-dashed border-line bg-card/60 px-6 py-16 text-center">
              <div className="max-w-md">
                <h2 className="text-lg font-semibold text-brand-deep">{t.notWritten}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.notWrittenHelp}</p>
                <button
                  type="button"
                  className={`${btnPrimaryCls} mt-5`}
                  onClick={startPending}
                >
                  {t.generate}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="no-print mb-4 flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-line bg-white p-0.5">
                  {(["exam", "correction"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={tab === key}
                      disabled={key === "correction" && !shown.correction}
                      onClick={() => setTab(key)}
                      className={`rounded-md px-3 py-1 text-sm disabled:opacity-40 ${
                        tab === key ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
                      }`}
                    >
                      {key === "exam" ? t.tabExam : t.tabCorrection}
                    </button>
                  ))}
                </div>
                {!busy && marks.count > 0 && (
                  <span
                    title={t.marksHelp}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      marksOk ? "bg-brand-soft text-brand-deep" : "bg-gold/20 text-[#7a5a1c]"
                    }`}
                  >
                    {t.marksTotal} : <span dir="ltr">{marks.sum} / {config.total}</span> {marksOk ? "✓" : `— ${t.marksCheck}`}
                  </span>
                )}
                <div className="flex-1" />
                {busy ? (
                  <>
                    <span className="flex items-center gap-2 text-sm text-muted" role="status">
                      <span className="size-2 animate-pulse rounded-full bg-brand" />
                      {phaseLabel}
                    </span>
                    <button
                      type="button"
                      className={`${btnCls} border-accent text-accent`}
                      onClick={() => {
                        abort.current?.abort();
                        hold();
                      }}
                    >
                      {t.stop}
                    </button>
                  </>
                ) : (
                  <>
                    {editing ? (
                      <button type="button" className={btnPrimaryCls} onClick={finishEditing}>
                        {t.doneEditing}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={btnCls}
                        onClick={() => setBuffer({ exam: exam.exam, correction: exam.correction })}
                      >
                        {t.edit}
                      </button>
                    )}
                    <div className="relative">
                      <button
                        type="button"
                        className={btnCls}
                        aria-expanded={menu === "more"}
                        onClick={() => setMenu(menu === "more" ? null : "more")}
                      >
                        {t.more} ▾
                      </button>
                      {menu === "more" && (
                        <Menu
                          onClose={() => setMenu(null)}
                          items={[
                            [copied ? t.copied : t.copy, copy],
                            [t.downloadMd, () => download(`${examDisplayTitle(exam, ui)}.md`, joinOutput(exam.exam, exam.correction), "text/markdown")],
                            [t.duplicate, duplicate],
                            [t.makeVariant, variant],
                            [t.reuseSettings, () => { setDraft({ ...config }); router.push("/nouveau"); }],
                            [t.delete, remove],
                          ]}
                        />
                      )}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        aria-expanded={menu === "print"}
                        onClick={() => (exam.correction ? setMenu(menu === "print" ? null : "print") : print("exam"))}
                        className={btnPrimaryCls}
                      >
                        {t.print}
                      </button>
                      {menu === "print" && (
                        <Menu
                          onClose={() => setMenu(null)}
                          items={[
                            [t.printExam, () => print("exam")],
                            [t.printCorrection, () => print("correction")],
                            [t.printBoth, () => print("both")],
                          ]}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              {editing && (
                <div className="no-print mb-4">
                  <textarea
                    dir={config.lang === "ar" ? "rtl" : "ltr"}
                    value={tab === "exam" ? buffer.exam : buffer.correction}
                    onChange={(e) =>
                      setBuffer(
                        tab === "exam"
                          ? { ...buffer, exam: e.target.value }
                          : { ...buffer, correction: e.target.value },
                      )
                    }
                    spellCheck={false}
                    className="h-72 w-full resize-y rounded-xl border border-line bg-white p-3 font-mono text-[13px] leading-relaxed focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <p className="mt-1 text-xs text-muted">{t.editHelp}</p>
                </div>
              )}

              <Paper
                config={config}
                style={style}
                logo={profile.logo}
                exam={shown.exam}
                correction={shown.correction}
                streaming={busy}
              />
              {!busy && <p className="no-print mt-4 text-center text-xs text-muted">{t.reviewNote}</p>}
            </>
          )}
        </section>

        {/* Tools */}
        <aside className="no-print order-first lg:sticky lg:top-4 lg:order-none lg:max-h-[calc(100vh-2rem)] lg:self-start">
          <div className="flex max-h-[inherit] flex-col overflow-hidden rounded-2xl border border-line bg-card">
            <div className="grid grid-cols-4 border-b border-line text-sm" role="tablist">
              {panels.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={panel === key}
                  onClick={() => {
                    setToolsOpen(panel === key ? !toolsOpen : true);
                    setPanel(key);
                  }}
                  className={`truncate px-1 py-2.5 ${
                    panel === key
                      ? "border-b-2 border-brand font-semibold text-brand-deep"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className={`min-h-0 flex-1 overflow-y-auto p-4 lg:block ${toolsOpen ? "" : "hidden"}`}>
              {panel === "assistant" && (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-muted">{t.assistantHelp}</p>
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!revision.trim() || busy || !hasText) return;
                      run({
                        mode: "revise",
                        revision,
                        current: joinOutput(exam.exam, exam.correction),
                        kind: "revision",
                      });
                    }}
                  >
                    <textarea
                      value={revision}
                      maxLength={2000}
                      onChange={(e) => setRevision(e.target.value)}
                      placeholder={t.revisePlaceholder}
                      aria-label={t.revise}
                      className={`${inputCls} min-h-20`}
                    />
                    <button
                      type="submit"
                      className={`${btnPrimaryCls} w-full`}
                      disabled={!revision.trim() || busy || !hasText || editing}
                    >
                      {t.revise}
                    </button>
                  </form>
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted">{t.quickActions}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK.map((key) => (
                        <button
                          key={key}
                          type="button"
                          className={btnCls}
                          disabled={busy || !hasText || editing}
                          onClick={() =>
                            run({
                              mode: "revise",
                              revision: t[key],
                              current: joinOutput(exam.exam, exam.correction),
                              kind: "revision",
                            })
                          }
                        >
                          {t[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-line pt-4">
                    <button type="button" className={`${btnCls} w-full`} disabled={busy || !hasText} onClick={variant}>
                      {t.makeVariant}
                    </button>
                    <button
                      type="button"
                      className={`${btnCls} w-full`}
                      disabled={busy}
                      onClick={() => {
                        if (!hasText || window.confirm(t.confirmRegenerate)) run({ kind: "generation" });
                      }}
                    >
                      {t.regenerate}
                    </button>
                  </div>
                  <div className="space-y-2 border-t border-line pt-4 text-xs text-muted">
                    <div className="font-medium">{t.stepComplexity}</div>
                    <div>
                      {t.difficulty} : <b className="text-ink">{t[`diff_${config.difficulty}`]}</b>
                    </div>
                    {config.mix && <MixBar mix={config.mix} ui={ui} />}
                    {config.topics && <p className="line-clamp-4 leading-relaxed">{config.topics}</p>}
                  </div>
                </div>
              )}

              {panel === "style" && (
                <StylePanel
                  ui={ui}
                  style={style}
                  hasLogo={Boolean(profile.logo)}
                  isDefault={JSON.stringify(profile.style) === JSON.stringify(style)}
                  onChange={(next) => updateExam(id, { style: next })}
                  onMakeDefault={() => setProfile({ style })}
                />
              )}

              {panel === "details" && (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-muted">{t.detailsHelp}</p>
                  {type.normalized ? (
                    <Choices
                      label={t.session}
                      wrap={false}
                      value={config.session}
                      options={[
                        { value: "normale" as const, label: t.sessionNormale },
                        { value: "rattrapage" as const, label: t.sessionRattrapage },
                      ]}
                      onChange={(v) => setConfig({ session: v })}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Choices
                        label={t.semester}
                        wrap={false}
                        value={config.semester}
                        options={[
                          { value: 1 as const, label: "1" },
                          { value: 2 as const, label: "2" },
                        ]}
                        onChange={(v) => setConfig({ semester: v })}
                      />
                      {config.examType === "cc" && (
                        <Field label={t.examNumber}>
                          <input
                            className={inputCls}
                            type="number"
                            min={1}
                            max={9}
                            value={config.examNumber}
                            onChange={(e) => setConfig({ examNumber: Number(e.target.value) || 1 })}
                          />
                        </Field>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <Field label={t.duration}>
                      <input
                        className={inputCls}
                        type="number"
                        min={15}
                        max={300}
                        step={5}
                        value={config.duration}
                        onChange={(e) => setConfig({ duration: Number(e.target.value) || config.duration })}
                      />
                    </Field>
                    <Field label={t.total}>
                      <input
                        className={inputCls}
                        type="number"
                        min={5}
                        max={100}
                        value={config.total}
                        onChange={(e) => setConfig({ total: Number(e.target.value) || config.total })}
                      />
                    </Field>
                    <Field label={t.coefficient}>
                      <input
                        className={inputCls}
                        maxLength={6}
                        value={config.coefficient}
                        onChange={(e) => setConfig({ coefficient: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label={t.schoolYear}>
                    <input
                      className={inputCls}
                      dir="ltr"
                      maxLength={12}
                      value={config.schoolYear}
                      onChange={(e) => setConfig({ schoolYear: e.target.value })}
                    />
                  </Field>
                  <Field label={t.academy}>
                    <select
                      className={inputCls}
                      value={config.academy}
                      onChange={(e) => setConfig({ academy: Number(e.target.value) })}
                    >
                      <option value={-1}>{t.none}</option>
                      {ACADEMIES.map((a, i) => (
                        <option key={a.fr} value={i}>
                          {a[ui]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.direction}>
                    <input
                      className={inputCls}
                      maxLength={80}
                      value={config.direction}
                      onChange={(e) => setConfig({ direction: e.target.value })}
                    />
                  </Field>
                  <Field label={t.school}>
                    <input
                      className={inputCls}
                      maxLength={100}
                      value={config.school}
                      onChange={(e) => setConfig({ school: e.target.value })}
                    />
                  </Field>
                  <Field label={t.teacher}>
                    <input
                      className={inputCls}
                      maxLength={80}
                      value={config.teacher}
                      onChange={(e) => setConfig({ teacher: e.target.value })}
                    />
                  </Field>
                </div>
              )}

              {panel === "versions" && (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-muted">{t.versionsHelp}</p>
                  {exam.versions.length === 0 && <p className="text-sm text-muted">{t.versionsEmpty}</p>}
                  {exam.versions.map((v, i) => {
                    const current = v.exam === exam.exam && v.correction === exam.correction;
                    return (
                      <div key={v.at} className="rounded-xl border border-line bg-white p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{t[`version_${v.kind}`]}</span>
                          {current && i === 0 ? (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-deep">
                              {t.versionCurrent}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={btnCls}
                              disabled={busy || editing}
                              onClick={() => commitText(id, v.exam, v.correction, "manual", t.versionRestored)}
                            >
                              {t.restore}
                            </button>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {new Date(v.at).toLocaleString(ui === "ar" ? "ar-MA" : "fr-MA", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                        {v.note && <p className="mt-1 line-clamp-2 text-xs text-muted">« {v.note} »</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Menu({ items, onClose }: { items: [string, () => void][]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute end-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
        {items.map(([label, action]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              onClose();
              action();
            }}
            className="block w-full px-3 py-2 text-start text-sm hover:bg-brand-soft"
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
