"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { UI } from "@/lib/i18n";
import { StoreProvider, useStore } from "@/lib/store";
import { Star } from "./ui";

const noop = () => () => {};

function Header() {
  const { ui, setUi, exams } = useStore();
  const t = UI[ui];
  const path = usePathname();
  const links = [
    { href: "/", label: t.navHome, active: path === "/" },
    { href: "/examens", label: t.myExams, active: path.startsWith("/examens"), count: exams.length },
    { href: "/profil", label: t.navProfile, active: path === "/profil" },
  ];
  return (
    <header className="no-print border-b border-brand-deep bg-brand text-white">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Star className="size-8 shrink-0 text-gold" />
          <span>
            <span className="block text-lg font-semibold leading-tight">
              {t.brand}
              <span className="ms-2 font-normal text-white/60">{ui === "fr" ? "امتحان" : "Imtihan"}</span>
            </span>
            <span className="hidden text-xs text-white/75 sm:block">{t.tagline}</span>
          </span>
        </Link>
        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto md:order-none md:ms-4 md:w-auto md:flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.active ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                l.active ? "bg-white/15 font-medium" : "text-white/85 hover:bg-white/10"
              }`}
            >
              {l.label}
              {l.count ? <span className="ms-1.5 text-white/60">{l.count}</span> : null}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/nouveau"
            className="rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-brand-deep hover:bg-[#c4963f]"
          >
            + {t.newExam}
          </Link>
          <button
            type="button"
            onClick={() => setUi(ui === "fr" ? "ar" : "fr")}
            lang={ui === "fr" ? "ar" : "fr"}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            {ui === "fr" ? "العربية" : "Français"}
          </button>
        </div>
      </div>
    </header>
  );
}

/** The teacher's data lives in the browser, so the app renders once it has mounted. */
export default function Shell({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return null;
  return (
    <StoreProvider>
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
    </StoreProvider>
  );
}
