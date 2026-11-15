"use client";

import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export const btnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink transition-colors hover:border-brand/60 hover:bg-brand-soft disabled:pointer-events-none disabled:opacity-50";

export const btnPrimaryCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:pointer-events-none disabled:opacity-50";

export function Star({ className = "" }: { className?: string }) {
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

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {help && <span className="mt-1.5 block text-xs leading-relaxed text-muted">{help}</span>}
    </label>
  );
}

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm transition-colors ${
    active
      ? "border-brand bg-brand text-white"
      : "border-line bg-white text-ink hover:border-brand/60 hover:bg-brand-soft"
  }`;

export function Choices<T extends string | number>({
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
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={chip(o.value === value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MultiChoices<T extends string>({
  label,
  help,
  values,
  options,
  onChange,
}: {
  label: string;
  help?: string;
  values: T[];
  options: { value: T; label: string }[];
  onChange: (v: T[]) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <div className="mb-1.5 text-xs font-medium text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(active ? values.filter((v) => v !== o.value) : [...values, o.value])
              }
              className={chip(active)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {help && <div className="mt-1.5 text-xs leading-relaxed text-muted">{help}</div>}
    </div>
  );
}

export function Check({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex items-start gap-2.5 text-sm ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-brand"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-brand-deep">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

/** Saves a text file on the teacher's device. */
export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
