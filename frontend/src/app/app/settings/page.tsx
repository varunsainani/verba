"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessagesSquare, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Usage } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { locales, localeNames } from "@/i18n/config";
import { Button, Card, Input, Label, Spinner } from "@/components/ui";

function UsageBar({
  icon: Icon,
  label,
  used,
  cap,
}: {
  icon: typeof Upload;
  label: string;
  used: number;
  cap: number;
}) {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Icon className="h-4 w-4 text-brand-500" />
          {label}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {used} / {cap}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const t = useTranslations("account");
  const c = useTranslations("common");
  const e = useTranslations("errors");
  const currentLocale = useLocale();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [locale, setLocale] = useState(currentLocale);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageError, setUsageError] = useState(false);

  const loadUsage = useCallback(async () => {
    try {
      const data = await api.get<Usage>("/kbs/usage/today");
      setUsage(data);
    } catch {
      setUsageError(true);
    }
  }, []);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await updateProfile({ name, locale });
      if (locale !== currentLocale) {
        document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
        window.location.reload();
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(e("generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t("title")}
      </h1>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {t("profileTitle")}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="acc-name">{t("nameLabel")}</Label>
            <Input id="acc-name" value={name} onChange={(ev) => setName(ev.target.value)} />
          </div>
          <div>
            <Label htmlFor="acc-lang">{t("languageLabel")}</Label>
            <select
              id="acc-lang"
              value={locale}
              onChange={(ev) => setLocale(ev.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeNames[l]}
                </option>
              ))}
            </select>
          </div>
          {saved && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("saved")}</p>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button onClick={save} loading={saving}>
            {t("save")}
          </Button>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {t("usageTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("usageBody")}</p>
        {usage ? (
          <div className="mt-4 space-y-4">
            <UsageBar
              icon={MessagesSquare}
              label={t("queries")}
              used={usage.queryCount}
              cap={usage.queryCap}
            />
            <UsageBar
              icon={Upload}
              label={t("uploads")}
              used={usage.ingestCount}
              cap={usage.ingestCap}
            />
          </div>
        ) : usageError ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{e("generic")}</p>
        ) : (
          <div className="flex py-6 justify-center">
            <Spinner className="h-5 w-5" />
          </div>
        )}
      </Card>
    </div>
  );
}
