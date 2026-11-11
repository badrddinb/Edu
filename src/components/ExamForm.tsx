"use client";

import type { ReactNode } from "react";
import {
  ACADEMIES,
  CYCLES,
  DIFFICULTIES,
  EXAM_TYPES,
  LEVELS,
  SUBJECTS,
  defaultDuration,
  getLevel,
  subjectsFor,
  type Lang,
  type Level,
} from "@/lib/curriculum";
import { UI, type UiLang } from "@/lib/i18n";
import type { ExamConfig } from "@/lib/types";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-5 first:border-t-0">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-deep">
        <span className="grid size-6 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {help && <span className="mt-1.5 block text-xs leading-relaxed text-muted">{help}</span>}
    </label>
  );
}

function Choices<T extends string | number>({
  label,
  value,
  options,
  onChange,
  wrap = true,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  wrap?: boolean;
}) {
  return (
    <div role="group" aria-label={label}>
      <div className="mb-1.5 text-xs font-medium text-muted">{label}</div>
      <div className={wrap ? "flex flex-wrap gap-1.5" : "grid auto-cols-fr grid-flow-col gap-1.5"}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink hover:border-brand/60 hover:bg-brand-soft"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Language a paper in this subject is normally written in at this level. */
function defaultLang(subjectId: string, level: Level): Lang {
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

export default function ExamForm({
  ui,
  config,
  onChange,
}: {
  ui: UiLang;
  config: ExamConfig;
  onChange: (c: ExamConfig) => void;
}) {
  const t = UI[ui];
  const level = getLevel(config.levelId)!;
  const set = <K extends keyof ExamConfig>(key: K, value: ExamConfig[K]) =>
    onChange({ ...config, [key]: value });
  const subjects = subjectsFor(level, config.trackId);
  const type = EXAM_TYPES[config.examType];
  const num = (v: string, fallback: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <div>
      <Section n={1} title={t.level}>
        <Choices
          label={t.cycle}
          wrap={false}
          value={level.cycle}
          options={CYCLES.map((c) => ({ value: c.id, label: c.label[ui] }))}
          onChange={(cycle) => {
            if (cycle === level.cycle) return;
            onChange(withLevel(config, LEVELS.find((l) => l.cycle === cycle)!.id));
          }}
        />
        <Choices
          label={t.level}
          value={level.id}
          options={LEVELS.filter((l) => l.cycle === level.cycle).map((l) => ({
            value: l.id,
            label: l.label[ui],
          }))}
          onChange={(id) => onChange(withLevel(config, id))}
        />
        {level.tracks && (
          <Field label={t.track}>
            <select
              className={input}
              value={config.trackId}
              onChange={(e) => onChange(withLevel(config, level.id, e.target.value))}
            >
              {level.tracks.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.label[ui]}
                </option>
              ))}
            </select>
          </Field>
        )}
      </Section>

      <Section n={2} title={t.subject}>
        <Choices
          label={t.subject}
          value={config.subjectId}
          options={[
            ...subjects.map((s) => ({ value: s.id, label: s.label[ui] })),
            { value: "custom", label: t.otherSubject },
          ]}
          onChange={(id) =>
            onChange({
              ...config,
              subjectId: id,
              lang: id === "custom" ? config.lang : defaultLang(id, level),
            })
          }
        />
        {config.subjectId === "custom" && (
          <Field label={t.otherSubject}>
            <input
              className={input}
              value={config.customSubject}
              maxLength={80}
              placeholder={t.otherSubjectPlaceholder}
              onChange={(e) => set("customSubject", e.target.value)}
            />
          </Field>
        )}
        <Choices
          label={t.paperLang}
          wrap={false}
          value={config.lang}
          options={[
            { value: "ar" as Lang, label: t.langAr },
            { value: "fr" as Lang, label: t.langFr },
            { value: "en" as Lang, label: t.langEn },
          ]}
          onChange={(lang) => set("lang", lang)}
        />
      </Section>

      <Section n={3} title={t.examType}>
        <Choices
          label={t.examType}
          value={config.examType}
          options={level.examTypes.map((id) => ({ value: id, label: EXAM_TYPES[id].short[ui] }))}
          onChange={(examType) =>
            onChange({ ...config, examType, duration: defaultDuration(level, examType) })
          }
        />
        {type.normalized ? (
          <Choices
            label={t.session}
            wrap={false}
            value={config.session}
            options={[
              { value: "normale" as const, label: t.sessionNormale },
              { value: "rattrapage" as const, label: t.sessionRattrapage },
            ]}
            onChange={(v) => set("session", v)}
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
              onChange={(v) => set("semester", v)}
            />
            {config.examType === "cc" && (
              <Choices
                label={t.examNumber}
                wrap={false}
                value={config.examNumber}
                options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
                onChange={(v) => set("examNumber", v)}
              />
            )}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label={t.duration}>
            <input
              className={input}
              type="number"
              min={15}
              max={300}
              step={5}
              value={config.duration}
              onChange={(e) => set("duration", num(e.target.value, config.duration))}
            />
          </Field>
          <Field label={t.total}>
            <input
              className={input}
              type="number"
              min={5}
              max={100}
              value={config.total}
              onChange={(e) => set("total", num(e.target.value, config.total))}
            />
          </Field>
          <Field label={t.coefficient}>
            <input
              className={input}
              inputMode="numeric"
              maxLength={6}
              value={config.coefficient}
              onChange={(e) => set("coefficient", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section n={4} title={t.content}>
        <Field label={t.topics} help={t.topicsHelp}>
          <textarea
            className={`${input} min-h-24`}
            value={config.topics}
            maxLength={4000}
            placeholder={t.topicsPlaceholder}
            onChange={(e) => set("topics", e.target.value)}
          />
        </Field>
        <Choices
          label={t.difficulty}
          wrap={false}
          value={config.difficulty}
          options={DIFFICULTIES.map((d) => ({ value: d, label: t[`diff_${d}`] }))}
          onChange={(v) => set("difficulty", v)}
        />
        <Field label={t.instructions}>
          <textarea
            className={`${input} min-h-16`}
            value={config.instructions}
            maxLength={2000}
            placeholder={t.instructionsPlaceholder}
            onChange={(e) => set("instructions", e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand"
            checked={config.withCorrection}
            onChange={(e) => set("withCorrection", e.target.checked)}
          />
          {t.withCorrection}
        </label>
      </Section>

      <Section n={5} title={t.header}>
        <Field label={t.academy}>
          <select
            className={input}
            value={config.academy}
            onChange={(e) => set("academy", Number(e.target.value))}
          >
            <option value={-1}>{t.none}</option>
            {ACADEMIES.map((a, i) => (
              <option key={a.fr} value={i}>
                {a[ui]}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.direction}>
            <input
              className={input}
              value={config.direction}
              maxLength={80}
              onChange={(e) => set("direction", e.target.value)}
            />
          </Field>
          <Field label={t.schoolYear}>
            <input
              className={input}
              dir="ltr"
              value={config.schoolYear}
              maxLength={12}
              onChange={(e) => set("schoolYear", e.target.value)}
            />
          </Field>
        </div>
        <Field label={t.school}>
          <input
            className={input}
            value={config.school}
            maxLength={100}
            onChange={(e) => set("school", e.target.value)}
          />
        </Field>
        <Field label={t.teacher} help={t.headerHelp}>
          <input
            className={input}
            value={config.teacher}
            maxLength={80}
            onChange={(e) => set("teacher", e.target.value)}
          />
        </Field>
      </Section>
    </div>
  );
}
