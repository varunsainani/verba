"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AuthShell } from "@/components/AuthShell";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const e = useTranslations("errors");
  const locale = useLocale();
  const { user, register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/app");
  }, [user, router]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, locale);
      router.replace("/app");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 0
            ? e("network")
            : err.message
          : e("generic"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("registerTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("registerSubtitle")}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={6}
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
            {t("registerButton")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {t("signInLink")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
