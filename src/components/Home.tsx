"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { withClass, withProfile } from "@/lib/config";
import { UI, classLabel } from "@/lib/i18n";
import { SAMPLE_CONFIG, SAMPLE_CORRECTION, SAMPLE_EXAM } from "@/lib/sample";
import { defaultConfig, useStore } from "@/lib/store";
import ExamCard from "./ExamCard";
import { Star, btnCls } from "./ui";

export default function Home() {
  const { ui, exams, profile, draft, setDraft, createExam, server } = useStore();
  const t = UI[ui];
  const router = useRouter();
  const recent = [...exams].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  const profileEmpty = !profile.school && !profile.teacher && profile.academy < 0;

  function openSample() {
    const id = createExam({
      config: withProfile({ ...defaultConfig(), ...SAMPLE_CONFIG }, profile),
      style: profile.style,
      title: t.sampleTitle,
      exam: SAMPLE_EXAM,
      correction: SAMPLE_CORRECTION,
    });
    router.push(`/examens/${id}`);
  }

  const steps = [
    [t.how1, t.how1Body],
    [t.how2, t.how2Body],
    [t.how3, t.how3Body],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="overflow-hidden rounded-3xl bg-brand text-white">
        <div className="grid items-center gap-6 p-7 sm:p-10 md:grid-cols-[1fr_auto]">
          <div>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">{t.heroTitle}</h1>
            <p className="mt-3 max-w-2xl text-white/80">{t.heroBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/nouveau"
                className="rounded-xl bg-gold px-5 py-3 font-semibold text-brand-deep hover:bg-[#c4963f]"
              >
                {t.heroCta}
              </Link>
              <button
                type="button"
                onClick={openSample}
                className="rounded-xl border border-white/30 px-5 py-3 font-medium hover:bg-white/10"
              >
                {t.seeSample}
              </button>
            </div>
            {server && !server.ready && (
              <p className="mt-4 max-w-2xl rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">
                {t.err_no_key}
              </p>
            )}
          </div>
          <Star className="hidden size-40 text-gold/70 md:block" />
        </div>
      </section>

      {profile.classes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-brand-deep">{t.quickStart}</h2>
          <div className="flex flex-wrap gap-2">
            {profile.classes.map((c, i) => (
              <button
                key={i}
                type="button"
                className="rounded-xl border border-line bg-card px-4 py-3 text-start text-sm hover:border-brand hover:bg-brand-soft"
                onClick={() => {
                  setDraft({ ...withClass(draft, c), topics: "", instructions: "" });
                  router.push("/nouveau");
                }}
              >
                <span className="block text-xs text-muted">{t.newExamFor}</span>
                <span className="font-semibold text-brand-deep">{classLabel(c, ui)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-deep">{t.recent}</h2>
            <Link href="/examens" className={btnCls}>
              {t.seeAll} ({exams.length})
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((e) => (
              <ExamCard key={e.id} exam={e} ui={ui} />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-brand-deep">{t.howTitle}</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map(([title, body], i) => (
              <li key={title} className="rounded-2xl border border-line bg-card p-5">
                <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-brand-deep">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {profileEmpty && (
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-brand-deep">{t.profileNudge}</h2>
            <p className="mt-1 text-sm text-muted">{t.profileNudgeBody}</p>
          </div>
          <Link href="/profil" className={btnCls}>
            {t.navProfile}
          </Link>
        </section>
      )}
    </div>
  );
}
