"use client";

import { EXAM_TYPES } from "@/lib/curriculum";
import {
  PAPER,
  academyName,
  examTitle,
  formatDuration,
  levelName,
  subjectName,
  trackName,
} from "@/lib/i18n";
import type { ExamConfig } from "@/lib/types";
import Markdown from "./Markdown";

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <b>{label} :</b> {value}
    </div>
  );
}

function Head({ config }: { config: ExamConfig }) {
  const lang = config.lang;
  const p = PAPER[lang];
  const { title, sub } = examTitle(config, lang);
  const academy = academyName(config, lang);
  return (
    <>
      <div className="sheet-head">
        <div>
          <div>
            <b>{p.kingdom}</b>
          </div>
          <div>{p.ministry}</div>
          {academy && (
            <div>
              {p.academy} : {academy}
            </div>
          )}
          <Row label={p.direction} value={config.direction} />
          <Row label={p.school} value={config.school} />
        </div>
        <div className="center">
          <div className="title">{title}</div>
          {sub && <div>{sub}</div>}
          <div>
            {p.schoolYear} : <span dir="ltr">{config.schoolYear}</span>
          </div>
        </div>
        <div>
          <Row label={p.subject} value={subjectName(config, lang)} />
          <Row label={p.level} value={levelName(config, lang)} />
          <Row label={p.track} value={trackName(config, lang)} />
          <Row label={p.duration} value={formatDuration(config.duration, lang)} />
          <Row label={p.coefficient} value={config.coefficient} />
          <Row label={p.teacher} value={config.teacher} />
        </div>
      </div>
      {!EXAM_TYPES[config.examType].normalized && (
        <div className="sheet-strip">
          <span className="fill">
            <b>{p.name} :</b>
          </span>
          <span className="fill" style={{ flex: "0 1 9rem" }}>
            <b>{p.klass} :</b>
          </span>
          <span className="fill" style={{ flex: "0 1 6rem" }}>
            <b>{p.number} :</b>
          </span>
          <span>
            <b>{p.mark} :</b> ……… / {config.total}
          </span>
        </div>
      )}
    </>
  );
}

export default function Paper({
  config,
  exam,
  correction,
  streaming,
}: {
  config: ExamConfig;
  exam: string;
  correction: string;
  streaming: boolean;
}) {
  const dir = config.lang === "ar" ? "rtl" : "ltr";
  const p = PAPER[config.lang];
  const { title } = examTitle(config, config.lang);
  return (
    <>
      <article className="sheet sheet-exam" dir={dir} lang={config.lang}>
        <Head config={config} />
        <Markdown text={exam} />
        {streaming && !correction && <span className="caret" />}
      </article>
      {correction && (
        <article className="sheet sheet-correction mt-6 print:mt-0" dir={dir} lang={config.lang}>
          <div className="sheet-head" style={{ gridTemplateColumns: "1fr" }}>
            <div className="center">
              <div className="title">{p.correction}</div>
              <div>
                {[title, subjectName(config, config.lang), levelName(config, config.lang), trackName(config, config.lang)]
                  .filter(Boolean)
                  .join(" — ")}
              </div>
            </div>
          </div>
          <Markdown text={correction} />
          {streaming && <span className="caret" />}
        </article>
      )}
    </>
  );
}
