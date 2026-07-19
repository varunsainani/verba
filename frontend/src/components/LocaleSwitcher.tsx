"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppLocale, localeNames, locales } from "@/i18n/config";
import { cn } from "./ui";

function applyLocale(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
  window.location.reload();
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const current = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{current}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => applyLocale(l)}
              className={cn(
                "flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                l === (current as AppLocale)
                  ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-600/20 dark:text-brand-300"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
