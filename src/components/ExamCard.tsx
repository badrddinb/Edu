"use client";

import Link from "next/link";
import { UI, examDisplayTitle, summary, type UiLang } from "@/lib/i18n";
import type { SavedExam } from "@/lib/types";

export const STATUS_TONE = {
  draft: "bg-line/70 text-muted",
  ready: "bg-brand-soft text-brand-deep",
  used: "bg-gold/20 text-[#7a5a1c]",
} as const;

export function formatDate(at: number, ui: UiLang) {
  return new Date(at).toLocaleDateString(ui === "ar" ? "ar-MA" : "fr-MA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** One exam in a list: what it is, where it stands, and a way in. */
export default function ExamCard({
  exam,
  ui,
  children,
}: {
  exam: SavedExam;
  ui: UiLang;
  children?: React.ReactNode;
}) {
  const t = UI[ui];
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <Link href={`/examens/${exam.id}`} className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug text-brand-deep hover:underline">
            {exam.starred && <span className="me-1 text-gold">★</span>}
            {examDisplayTitle(exam, ui)}
          </h3>
        </Link>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[exam.status]}`}>
          {t[`status_${exam.status}`]}
        </span>
      </div>
      {exam.title && <p className="mt-1 line-clamp-1 text-xs text-muted">{summary(exam.config, ui)}</p>}
      {exam.config.topics && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{exam.config.topics}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs text-muted">
        <span>{formatDate(exam.updatedAt, ui)}</span>
        <span>· {t[`diff_${exam.config.difficulty}`]}</span>
        {exam.correction && <span>· {t.tabCorrection}</span>}
      </div>
      {children && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">{children}</div>}
    </article>
  );
}
