"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <Logo />
      <p className="mt-8 text-6xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-sm text-slate-500 dark:text-slate-400">{t("body")}</p>
      <Link href="/" className="mt-6">
        <Button>{t("home")}</Button>
      </Link>
    </div>
  );
}
