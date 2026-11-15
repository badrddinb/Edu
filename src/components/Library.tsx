"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CYCLES, getLevel } from "@/lib/curriculum";
import { UI, examDisplayTitle, subjectName, summary } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { STATUSES, type Status } from "@/lib/types";
import ExamCard from "./ExamCard";
import { PageTitle, btnCls, btnPrimaryCls, download, inputCls } from "./ui";

export default function Library() {
  const { ui, exams, createExam, updateExam, removeExam, importExams } = useStore();
  const t = UI[ui];
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [cycle, setCycle] = useState("all");
  const [subject, setSubject] = useState("all");
  const [starred, setStarred] = useState(false);
  const [sort, setSort] = useState<"recent" | "title">("recent");
  const [notice, setNotice] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const subjects = useMemo(() => {
    const names = new Map<string, string>();
    for (const e of exams) {
      const key = e.config.subjectId === "custom" ? `custom:${e.config.customSubject}` : e.config.subjectId;
      names.set(key, subjectName(e.config, ui));
    }
    return [...names];
  }, [exams, ui]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exams
      .filter((e) => {
        if (status !== "all" && e.status !== status) return false;
        if (starred && !e.starred) return false;
        if (cycle !== "all" && getLevel(e.config.levelId)?.cycle !== cycle) return false;
        if (subject !== "all") {
          const key = e.config.subjectId === "custom" ? `custom:${e.config.customSubject}` : e.config.subjectId;
          if (key !== subject) return false;
        }
        if (!q) return true;
        return `${e.title} ${summary(e.config, "fr")} ${summary(e.config, "ar")} ${e.config.topics}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) =>
        sort === "title"
          ? examDisplayTitle(a, ui).localeCompare(examDisplayTitle(b, ui), ui)
          : Number(b.starred) - Number(a.starred) || b.updatedAt - a.updatedAt,
      );
  }, [exams, query, status, starred, cycle, subject, sort, ui]);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const n = importExams(Array.isArray(data) ? data : data.exams);
      setNotice(n ? `${n} ${t.imported}` : t.importFailed);
    } catch {
      setNotice(t.importFailed);
    }
  }

  const counts = STATUSES.map((s) => [s, exams.filter((e) => e.status === s).length] as const);

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title={t.myExams} sub={t.librarySub}>
        <button
          type="button"
          className={btnCls}
          disabled={!exams.length}
          onClick={() =>
            download(
              `imtihan-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify({ app: "imtihan", exams }, null, 1),
              "application/json",
            )
          }
        >
          {t.exportAll}
        </button>
        <button type="button" className={btnCls} onClick={() => file.current?.click()}>
          {t.importBackup}
        </button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={onImport} />
        <Link href="/nouveau" className={btnPrimaryCls}>
          + {t.newExam}
        </Link>
      </PageTitle>

      {notice && (
        <p role="status" className="mb-4 rounded-xl border border-line bg-card px-4 py-2.5 text-sm">
          {notice}
        </p>
      )}

      {exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card/60 px-6 py-16 text-center">
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">{t.historyEmpty}</p>
          <Link href="/nouveau" className={`${btnPrimaryCls} mt-5`}>
            {t.heroCta}
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={status === "all"}
              onClick={() => setStatus("all")}
              className={`rounded-full border px-3 py-1 text-sm ${
                status === "all" ? "border-brand bg-brand text-white" : "border-line bg-white"
              }`}
            >
              {t.all} {exams.length}
            </button>
            {counts.map(([s, n]) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  status === s ? "border-brand bg-brand text-white" : "border-line bg-white"
                }`}
              >
                {t[`status_${s}`]} {n}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={starred}
              onClick={() => setStarred(!starred)}
              className={`rounded-full border px-3 py-1 text-sm ${
                starred ? "border-gold bg-gold/20 text-brand-deep" : "border-line bg-white"
              }`}
            >
              ★ {t.starredOnly}
            </button>
          </div>

          <div className="mb-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <input
              type="search"
              className={inputCls}
              value={query}
              placeholder={t.search}
              aria-label={t.search}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className={inputCls} aria-label={t.cycle} value={cycle} onChange={(e) => setCycle(e.target.value)}>
              <option value="all">{t.cycle} : {t.all}</option>
              {CYCLES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label[ui]}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              aria-label={t.subject}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="all">{t.subject} : {t.all}</option>
              {subjects.map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              aria-label={t.sort}
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "title")}
            >
              <option value="recent">{t.sortRecent}</option>
              <option value="title">{t.sortTitle}</option>
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{t.noMatch}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((e) => (
                <ExamCard key={e.id} exam={e} ui={ui}>
                  <Link href={`/examens/${e.id}`} className={btnCls}>
                    {t.open}
                  </Link>
                  <button
                    type="button"
                    className={btnCls}
                    aria-pressed={e.starred}
                    aria-label={t.star}
                    onClick={() => updateExam(e.id, { starred: !e.starred })}
                  >
                    {e.starred ? "★" : "☆"}
                  </button>
                  <select
                    aria-label={t.status}
                    className={`${btnCls} pe-7`}
                    value={e.status}
                    onChange={(ev) => updateExam(e.id, { status: ev.target.value as Status })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t[`status_${s}`]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={btnCls}
                    onClick={() => {
                      const id = createExam({
                        config: e.config,
                        style: e.style,
                        title: `${examDisplayTitle(e, ui)} (${t.copySuffix})`,
                        exam: e.exam,
                        correction: e.correction,
                      });
                      router.push(`/examens/${id}`);
                    }}
                  >
                    {t.duplicate}
                  </button>
                  <button
                    type="button"
                    className={`${btnCls} text-accent`}
                    onClick={() => {
                      if (window.confirm(t.confirmDelete)) removeExam(e.id);
                    }}
                  >
                    {t.delete}
                  </button>
                </ExamCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
