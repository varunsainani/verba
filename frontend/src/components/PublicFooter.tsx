"use client";

import { useTranslations } from "next-intl";
import { Logo } from "./Logo";

export function PublicFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 py-10 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {year} Verba. {t("landing.footerRights")}
        </p>
      </div>
    </footer>
  );
}
