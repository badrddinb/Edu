"use client";

import { UI, type UiLang } from "@/lib/i18n";
import { ACCENTS, TEMPLATES, type Accent, type ExamStyle, type Template } from "@/lib/types";
import { Check, Choices, btnCls } from "./ui";

const ACCENT_COLOR: Record<Accent, string> = {
  black: "#000000",
  green: "#0b5d4b",
  blue: "#1d4e89",
  red: "#a3261e",
  purple: "#5b3a8c",
};

/** A tiny drawing of each template, so the choice is visual. */
function Thumb({ template, color }: { template: Template; color: string }) {
  const boxed = template === "officiel" || template === "compact";
  const rounded = template === "primaire" ? 5 : 0;
  const gap = template === "compact" ? 5 : template === "primaire" ? 9 : 7;
  const lines = template === "compact" ? 7 : template === "primaire" ? 4 : 5;
  return (
    <svg viewBox="0 0 70 90" className="w-full rounded border border-line bg-white" aria-hidden="true">
      {boxed || template === "primaire" ? (
        <rect x="6" y="6" width="58" height="14" rx={rounded} fill="none" stroke={color} strokeWidth="1.5" />
      ) : (
        <line x1="6" y1="20" x2="64" y2="20" stroke={color} strokeWidth="2.5" />
      )}
      <rect x="24" y="10" width="22" height="3" fill={template === "officiel" || template === "compact" ? "#000" : color} />
      {template === "moderne" ? (
        <line x1="6" y1="33" x2="64" y2="33" stroke={color} strokeWidth="1.2" />
      ) : (
        <rect
          x="6"
          y="26"
          width="58"
          height="7"
          rx={rounded}
          fill={template === "primaire" ? "none" : "#e6e6e6"}
          stroke={template === "primaire" ? color : "none"}
        />
      )}
      {template !== "primaire" && template !== "moderne" && (
        <rect x="6" y="26" width="2.5" height="7" fill={color} />
      )}
      {Array.from({ length: lines }, (_, i) => (
        <rect key={i} x="9" y={40 + i * gap} width={i % 2 ? 40 : 50} height="2" fill="#9a9a9a" />
      ))}
    </svg>
  );
}

export default function StylePanel({
  ui,
  style,
  hasLogo,
  isDefault,
  onChange,
  onMakeDefault,
}: {
  ui: UiLang;
  style: ExamStyle;
  hasLogo: boolean;
  isDefault: boolean;
  onChange: (style: ExamStyle) => void;
  onMakeDefault: () => void;
}) {
  const t = UI[ui];
  const set = <K extends keyof ExamStyle>(key: K, value: ExamStyle[K]) =>
    onChange({ ...style, [key]: value });

  return (
    <div className="space-y-5">
      <div role="group" aria-label={t.styleTemplate}>
        <div className="mb-1.5 text-xs font-medium text-muted">{t.styleTemplate}</div>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tpl) => {
            const active = style.template === tpl;
            return (
              <button
                key={tpl}
                type="button"
                aria-pressed={active}
                onClick={() => set("template", tpl)}
                className={`rounded-xl border p-2 text-start transition-colors ${
                  active ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line bg-white hover:border-brand/60"
                }`}
              >
                <Thumb template={tpl} color={ACCENT_COLOR[style.accent]} />
                <span className="mt-1.5 block text-sm font-medium">{t[`tpl_${tpl}`]}</span>
                <span className="block text-xs leading-snug text-muted">{t[`tplHelp_${tpl}`]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="group" aria-label={t.styleAccent}>
        <div className="mb-1.5 text-xs font-medium text-muted">{t.styleAccent}</div>
        <div className="flex gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={style.accent === a}
              aria-label={t[`accent_${a}`]}
              title={t[`accent_${a}`]}
              onClick={() => set("accent", a)}
              className={`size-8 rounded-full border-2 ${
                style.accent === a ? "border-gold ring-2 ring-gold/40" : "border-white shadow"
              }`}
              style={{ background: ACCENT_COLOR[a] }}
            />
          ))}
        </div>
      </div>

      <Choices
        label={t.styleSize}
        wrap={false}
        value={style.size}
        options={[
          { value: "s" as const, label: t.size_s },
          { value: "m" as const, label: t.size_m },
          { value: "l" as const, label: t.size_l },
        ]}
        onChange={(v) => set("size", v)}
      />

      <Choices
        label={t.styleMarks}
        wrap={false}
        value={style.marks}
        options={[
          { value: "margin" as const, label: t.marks_margin },
          { value: "inline" as const, label: t.marks_inline },
          { value: "hidden" as const, label: t.marks_hidden },
        ]}
        onChange={(v) => set("marks", v)}
      />

      <div className="space-y-2.5">
        <Check checked={style.strip} onChange={(v) => set("strip", v)}>
          {t.styleStrip}
        </Check>
        <Check checked={style.logo && hasLogo} disabled={!hasLogo} onChange={(v) => set("logo", v)}>
          {t.styleLogo}
          {!hasLogo && <span className="block text-xs text-muted">{t.styleLogoHelp}</span>}
        </Check>
        <Check checked={style.answerSpace} onChange={(v) => set("answerSpace", v)}>
          {t.styleAnswers}
        </Check>
        <Check checked={style.closing} onChange={(v) => set("closing", v)}>
          {t.styleClosing}
        </Check>
      </div>

      <button type="button" className={`${btnCls} w-full`} disabled={isDefault} onClick={onMakeDefault}>
        {isDefault ? `✓ ${t.styleIsDefault}` : t.styleMakeDefault}
      </button>
    </div>
  );
}
