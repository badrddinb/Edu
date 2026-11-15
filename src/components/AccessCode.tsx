"use client";

import { UI } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Field, inputCls } from "./ui";

/** Shown only on sites protected by an access code. */
export default function AccessCode({ force = false }: { force?: boolean }) {
  const { ui, code, setCode, server } = useStore();
  const t = UI[ui];
  if (!force && !server?.needsCode) return null;
  return (
    <Field label={t.accessCode} help={t.accessCodeHelp}>
      <input
        type="password"
        autoComplete="off"
        className={inputCls}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
    </Field>
  );
}
