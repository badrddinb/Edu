"use client";

import { UI, type UiLang } from "@/lib/i18n";
import type { Mix } from "@/lib/types";

/** The balance of a paper between restitution, application and reasoning. */
export default function MixBar({ mix, ui }: { mix: Mix; ui: UiLang }) {
  const t = UI[ui];
  const parts = [
    { key: "knowledge", value: mix.knowledge, label: t.mixKnowledge, color: "bg-brand/35" },
    { key: "application", value: mix.application, label: t.mixApplication, color: "bg-brand/70" },
    { key: "reasoning", value: mix.reasoning, label: t.mixReasoning, color: "bg-brand-deep" },
  ];
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
        {parts.map((p) => (
          <div key={p.key} className={p.color} style={{ width: `${p.value}%` }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${p.color}`} aria-hidden="true" />
            {p.label} <b className="text-ink">{p.value} %</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
