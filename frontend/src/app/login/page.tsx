"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const e = useTranslations("errors");
  const { user, login, demo } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/app");
  }, [user, router]);

  const errText = (err: unknown) =>
    err instanceof ApiError
      ? err.status === 0
        ? e("network")
        : err.message
      : e("generic");

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/app");
    } catch (err) {
      setError(errText(err));
    } finally {
      setLoading(false);
    }
  }

  async function onDemo() {
    setError("");
    setDemoLoading(true);
    try {
      await demo();
      router.replace("/app");
    } catch (err) {
      setError(errText(err));
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("loginSubtitle")}
        </p>

        <button
          type="button"
          onClick={onDemo}
          disabled={demoLoading}
          className="mt-6 flex w-full items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-left transition-colors hover:bg-brand-100 disabled:opacity-60 dark:border-brand-800 dark:bg-brand-950/40 dark:hover:bg-brand-950/70"
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-800 dark:text-brand-200">
                {t("demoButton")}
              </span>
              <span className="block text-xs text-brand-600/80 dark:text-brand-300/70">
                {t("demoHint")}
              </span>
            </span>
          </span>
          {demoLoading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          )}
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs uppercase text-slate-400">{t("or")}</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder={t("passwordPlaceholder")}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            {t("loginButton")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {t("signUpLink")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
