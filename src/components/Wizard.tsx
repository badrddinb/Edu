"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { classOf, defaultLang, sameClass, withClass, withLevel, withProfile } from "@/lib/config";
import {
  CYCLES,
  DIFFICULTIES,
  EXAM_TYPES,
  LEVELS,
  MIX_PRESETS,
  QUESTION_FORMATS,
  defaultDuration,
  getLevel,
  subjectsFor,
  type Lang,
} from "@/lib/curriculum";
import { UI, classLabel, formatDuration, levelName, subjectName, trackName } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { ExamConfig, Mix } from "@/lib/types";
import AccessCode from "./AccessCode";
import MixBar from "./MixBar";
import { Check, Choices, Field, MultiChoices, PageTitle, btnCls, btnPrimaryCls, inputCls } from "./ui";

type MixChoice = "auto" | keyof typeof MIX_PRESETS | "custom";

function mixChoice(mix: Mix | null): MixChoice {
  if (!mix) return "auto";
  for (const [key, preset] of Object.entries(MIX_PRESETS)) {
    if (
      preset.knowledge === mix.knowledge &&
      preset.application === mix.application &&
      preset.reasoning === mix.reasoning
    ) {
      return key as MixChoice;
    }
  }
  return "custom";
}

export default function Wizard() {
  const { ui, draft, setDraft, profile, setProfile, createExam, server } = useStore();
  const t = UI[ui];
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [customMix, setCustomMix] = useState(false);

  const config = draft;
  const level = getLevel(config.levelId) ?? LEVELS[0];
  const set = <K extends keyof ExamConfig>(key: K, value: ExamConfig[K]) =>
    setDraft({ ...config, [key]: value });
  const subjects = subjectsFor(level, config.trackId);
  const type = EXAM_TYPES[config.examType];
  const num = (v: string, fallback: number) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const steps = [t.stepClass, t.stepExam, t.stepContent, t.stepComplexity];
  const subjectMissing = config.subjectId === "custom" && !config.customSubject.trim();
  const thisClass = classOf(config);
  const classSaved = profile.classes.some((c) => sameClass(c, thisClass));
  const choice: MixChoice = customMix && config.mix ? "custom" : mixChoice(config.mix);

  function generate() {
    const id = createExam({
      config: withProfile(config, profile),
      style: profile.style,
      pending: { mode: "generate" },
    });
    router.push(`/examens/${id}`);
  }

  const recap: [string, string][] = [
    [t.subject, subjectName(config, ui)],
    [t.level, [levelName(config, ui), trackName(config, ui)].filter(Boolean).join(" · ")],
    [t.examType, EXAM_TYPES[config.examType].short[ui]],
    [t.paperLang, { fr: t.langFr, ar: t.langAr, en: t.langEn }[config.lang]],
    [t.durationShort, `${formatDuration(config.duration, ui)} · /${config.total}`],
    [t.difficulty, t[`diff_${config.difficulty}`]],
    [
      t.mix,
      config.mix
        ? `${config.mix.knowledge} / ${config.mix.application} / ${config.mix.reasoning} %`
        : t.mix_auto,
    ],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title={t.newExam} sub={t.wizardSub} />

      <ol className="mb-5 grid grid-cols-4 gap-2">
        {steps.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm transition-colors ${
                i === step
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-card text-ink hover:border-brand/60"
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  i === step ? "bg-white text-brand" : "bg-brand-soft text-brand-deep"
                }`}
              >
                {i + 1}
              </span>
              <span className="hidden truncate font-medium sm:block">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-brand-deep sm:hidden">{steps[step]}</h2>
          <div className="space-y-5">
            {step === 0 && (
              <>
                {profile.classes.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-muted">{t.myClasses}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.classes.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={sameClass(c, thisClass)}
                          onClick={() => setDraft(withClass(config, c))}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            sameClass(c, thisClass)
                              ? "border-gold bg-gold/15 text-brand-deep"
                              : "border-line bg-white hover:border-gold"
                          }`}
                        >
                          {classLabel(c, ui)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Choices
                  label={t.cycle}
                  wrap={false}
                  value={level.cycle}
                  options={CYCLES.map((c) => ({ value: c.id, label: c.label[ui] }))}
                  onChange={(cycle) => {
                    if (cycle === level.cycle) return;
                    setDraft(withLevel(config, LEVELS.find((l) => l.cycle === cycle)!.id));
                  }}
                />
                <Choices
                  label={t.level}
                  value={level.id}
                  options={LEVELS.filter((l) => l.cycle === level.cycle).map((l) => ({
                    value: l.id,
                    label: l.label[ui],
                  }))}
                  onChange={(id) => setDraft(withLevel(config, id))}
                />
                {level.tracks && (
                  <Choices
                    label={t.track}
                    value={config.trackId}
                    options={level.tracks.map((tr) => ({ value: tr.id, label: tr.label[ui] }))}
                    onChange={(id) => setDraft(withLevel(config, level.id, id))}
                  />
                )}
                <Choices
                  label={t.subject}
                  value={config.subjectId}
                  options={[
                    ...subjects.map((s) => ({ value: s.id, label: s.label[ui] })),
                    { value: "custom", label: t.otherSubject },
                  ]}
                  onChange={(id) =>
                    setDraft({
                      ...config,
                      subjectId: id,
                      lang: id === "custom" ? config.lang : defaultLang(id, level),
                    })
                  }
                />
                {config.subjectId === "custom" && (
                  <Field label={t.otherSubject}>
                    <input
                      className={inputCls}
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
                <button
                  type="button"
                  className={btnCls}
                  disabled={classSaved || subjectMissing}
                  onClick={() => setProfile({ classes: [...profile.classes, thisClass].slice(-12) })}
                >
                  {classSaved ? `✓ ${t.classSaved}` : `+ ${t.saveClass}`}
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <Choices
                  label={t.examType}
                  value={config.examType}
                  options={level.examTypes.map((id) => ({ value: id, label: EXAM_TYPES[id].short[ui] }))}
                  onChange={(examType) =>
                    setDraft({ ...config, examType, duration: defaultDuration(level, examType) })
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
                  <div className="grid gap-4 sm:grid-cols-2">
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
                      className={inputCls}
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
                      className={inputCls}
                      type="number"
                      min={5}
                      max={100}
                      value={config.total}
                      onChange={(e) => set("total", num(e.target.value, config.total))}
                    />
                  </Field>
                  <Field label={t.coefficient}>
                    <input
                      className={inputCls}
                      inputMode="numeric"
                      maxLength={6}
                      value={config.coefficient}
                      onChange={(e) => set("coefficient", e.target.value)}
                    />
                  </Field>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  {t.headerFromProfile}{" "}
                  <Link href="/profil" className="font-medium text-brand underline">
                    {t.navProfile}
                  </Link>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <Field label={t.topics} help={t.topicsHelp}>
                  <textarea
                    className={`${inputCls} min-h-36`}
                    value={config.topics}
                    maxLength={4000}
                    placeholder={t.topicsPlaceholder}
                    onChange={(e) => set("topics", e.target.value)}
                  />
                </Field>
                <Field label={t.instructions}>
                  <textarea
                    className={`${inputCls} min-h-24`}
                    value={config.instructions}
                    maxLength={2000}
                    placeholder={t.instructionsPlaceholder}
                    onChange={(e) => set("instructions", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <div role="group" aria-label={t.difficulty}>
                  <div className="mb-1.5 text-xs font-medium text-muted">{t.difficulty}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DIFFICULTIES.map((d, i) => {
                      const active = config.difficulty === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={active}
                          onClick={() => set("difficulty", d)}
                          className={`rounded-xl border p-3 text-start transition-colors ${
                            active
                              ? "border-brand bg-brand-soft ring-1 ring-brand"
                              : "border-line bg-white hover:border-brand/60"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-brand-deep">
                            <span className="flex gap-0.5" aria-hidden="true">
                              {DIFFICULTIES.map((_, j) => (
                                <span
                                  key={j}
                                  className={`h-3 w-1.5 rounded-sm ${j <= i ? "bg-brand" : "bg-line"}`}
                                />
                              ))}
                            </span>
                            {t[`diff_${d}`]}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted">
                            {t[`diffHelp_${d}`]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Choices
                    label={t.mix}
                    value={choice}
                    options={[
                      { value: "auto" as MixChoice, label: t.mix_auto },
                      { value: "equilibre" as MixChoice, label: t.mix_equilibre },
                      { value: "application" as MixChoice, label: t.mix_application },
                      { value: "raisonnement" as MixChoice, label: t.mix_raisonnement },
                      { value: "custom" as MixChoice, label: t.mix_custom },
                    ]}
                    onChange={(c) => {
                      setCustomMix(c === "custom");
                      if (c === "auto") set("mix", null);
                      else if (c === "custom") set("mix", config.mix ?? { ...MIX_PRESETS.equilibre });
                      else set("mix", { ...MIX_PRESETS[c] });
                    }}
                  />
                  {config.mix ? (
                    <div className="mt-3">
                      <MixBar mix={config.mix} ui={ui} />
                      {choice === "custom" && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Field label={`${t.mixKnowledge} — ${config.mix.knowledge} %`}>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              className="w-full accent-brand"
                              value={config.mix.knowledge}
                              onChange={(e) => {
                                const knowledge = Number(e.target.value);
                                const reasoning = Math.min(config.mix!.reasoning, 100 - knowledge);
                                set("mix", { knowledge, reasoning, application: 100 - knowledge - reasoning });
                              }}
                            />
                          </Field>
                          <Field label={`${t.mixReasoning} — ${config.mix.reasoning} %`}>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              className="w-full accent-brand"
                              value={config.mix.reasoning}
                              onChange={(e) => {
                                const reasoning = Number(e.target.value);
                                const knowledge = Math.min(config.mix!.knowledge, 100 - reasoning);
                                set("mix", { knowledge, reasoning, application: 100 - knowledge - reasoning });
                              }}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.mixAutoHelp}</p>
                  )}
                </div>

                <Choices
                  label={t.exercises}
                  value={config.exercises}
                  options={[0, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: n ? String(n) : t.auto }))}
                  onChange={(n) => set("exercises", n)}
                />
                <MultiChoices
                  label={t.formats}
                  help={t.formatsHelp}
                  values={config.formats}
                  options={QUESTION_FORMATS.map((f) => ({ value: f, label: t[`format_${f}`] }))}
                  onChange={(v) => set("formats", v)}
                />
                <div className="space-y-2.5">
                  <Check checked={config.withCorrection} onChange={(v) => set("withCorrection", v)}>
                    {t.withCorrection}
                  </Check>
                  <Check
                    checked={config.specTable && config.withCorrection}
                    disabled={!config.withCorrection}
                    onChange={(v) => set("specTable", v)}
                  >
                    {t.specTable}
                  </Check>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-between border-t border-line pt-4">
            <button type="button" className={btnCls} disabled={step === 0} onClick={() => setStep(step - 1)}>
              {t.back}
            </button>
            {step < steps.length - 1 && (
              <button type="button" className={btnPrimaryCls} onClick={() => setStep(step + 1)}>
                {t.next}
              </button>
            )}
          </div>
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-brand-deep">{t.recap}</h2>
            <dl className="space-y-2 text-sm">
              {recap.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-muted">{k}</dt>
                  <dd className="text-end font-medium">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            {config.topics.trim() && (
              <p className="mt-3 line-clamp-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
                {config.topics}
              </p>
            )}
            <div className="mt-4 space-y-3">
              <AccessCode />
              <button
                type="button"
                className={`${btnPrimaryCls} w-full py-3`}
                disabled={subjectMissing}
                onClick={generate}
              >
                {t.generate}
              </button>
              {server && !server.ready && (
                <p className="text-xs leading-relaxed text-accent">{t.err_no_key}</p>
              )}
              <p className="text-xs leading-relaxed text-muted">{t.generateHelp}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
