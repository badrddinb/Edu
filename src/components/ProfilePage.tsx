"use client";

import { useRef, useState } from "react";
import { ACADEMIES } from "@/lib/curriculum";
import { UI, classLabel } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import AccessCode from "./AccessCode";
import { Field, PageTitle, btnCls, inputCls } from "./ui";

/** Shrinks an uploaded image so it fits comfortably in the browser's storage. */
function shrink(file: File, max = 260): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export default function ProfilePage() {
  const { ui, profile, setProfile } = useStore();
  const t = UI[ui];
  const file = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={t.navProfile} sub={t.profileSub} />

      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
          <h2 className="font-semibold text-brand-deep">{t.header}</h2>
          <Field label={t.academy}>
            <select
              className={inputCls}
              value={profile.academy}
              onChange={(e) => setProfile({ academy: Number(e.target.value) })}
            >
              <option value={-1}>{t.none}</option>
              {ACADEMIES.map((a, i) => (
                <option key={a.fr} value={i}>
                  {a[ui]}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.direction}>
              <input
                className={inputCls}
                maxLength={80}
                value={profile.direction}
                onChange={(e) => setProfile({ direction: e.target.value })}
              />
            </Field>
            <Field label={t.school}>
              <input
                className={inputCls}
                maxLength={100}
                value={profile.school}
                onChange={(e) => setProfile({ school: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t.teacher} help={t.headerHelp}>
            <input
              className={inputCls}
              maxLength={80}
              value={profile.teacher}
              onChange={(e) => setProfile({ teacher: e.target.value })}
            />
          </Field>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <h2 className="font-semibold text-brand-deep">{t.logo}</h2>
          <p className="mt-1 text-sm text-muted">{t.logoHelp}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="grid size-24 place-items-center rounded-xl border border-line bg-white">
              {profile.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- a local data URL
                <img src={profile.logo} alt="" className="max-h-20 max-w-20 object-contain" />
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnCls} onClick={() => file.current?.click()}>
                {profile.logo ? t.logoChange : t.logoAdd}
              </button>
              {profile.logo && (
                <button type="button" className={`${btnCls} text-accent`} onClick={() => setProfile({ logo: "" })}>
                  {t.delete}
                </button>
              )}
              <input
                ref={file}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    setProfile({ logo: await shrink(f) });
                    setLogoError(false);
                  } catch {
                    setLogoError(true);
                  }
                }}
              />
            </div>
          </div>
          {logoError && <p className="mt-2 text-sm text-accent">{t.logoError}</p>}
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <h2 className="font-semibold text-brand-deep">{t.myClasses}</h2>
          <p className="mt-1 text-sm text-muted">{t.myClassesHelp}</p>
          {profile.classes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {profile.classes.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium">{classLabel(c, ui)}</span>
                  <button
                    type="button"
                    className={`${btnCls} text-accent`}
                    onClick={() => setProfile({ classes: profile.classes.filter((_, j) => j !== i) })}
                  >
                    {t.delete}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <h2 className="mb-3 font-semibold text-brand-deep">{t.accessCode}</h2>
          <AccessCode force />
        </section>
      </div>
    </div>
  );
}
