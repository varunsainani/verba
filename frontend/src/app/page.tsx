"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FileText,
  Quote,
  Upload,
  Code2,
  Languages,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button } from "@/components/ui";

function HeroChatMock() {
  const t = useTranslations("landing");
  return (
    <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs font-medium text-slate-400">Verba</span>
      </div>
      <div className="space-y-3 pt-4">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2 text-sm text-white">
          What is our refund window?
        </div>
        <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          Customers can request a refund within 30 days of purchase
          <sup className="ml-0.5 rounded bg-brand-100 px-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-600/30 dark:text-brand-200">
            1
          </sup>
          .
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
          <span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Refund Policy.pdf
            </span>{" "}
            &middot; &ldquo;Customers can request a refund within 30 days of
            purchase. Refunds are processed within 5 business days.&rdquo;
          </span>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-300">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
    </div>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const c = useTranslations("common");

  const features = [
    { icon: Sparkles, title: t("feature1Title"), body: t("feature1Body") },
    { icon: Quote, title: t("feature2Title"), body: t("feature2Body") },
    { icon: Upload, title: t("feature3Title"), body: t("feature3Body") },
    { icon: Code2, title: t("feature4Title"), body: t("feature4Body") },
    { icon: Languages, title: t("feature5Title"), body: t("feature5Body") },
    { icon: ShieldCheck, title: t("feature6Title"), body: t("feature6Body") },
  ];

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-950/40" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold leading-5 text-brand-700 shadow-sm dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-200">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                {t("heroBadge")}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                {t("heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button size="lg">
                    {t("heroCtaPrimary")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary">
                    {t("heroCtaDemo")}
                  </Button>
                </Link>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <Check className="h-4 w-4 text-emerald-500" />
                {t("trustLine")}
              </p>
            </div>
            <HeroChatMock />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("featuresTitle")}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              {t("featuresSubtitle")}
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Feature key={f.title} icon={f.icon} title={f.title} body={f.body} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t("howTitle")}
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                {t("howSubtitle")}
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="relative">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold text-slate-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Widget teaser */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-300">
                <Code2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t("widgetTeaserTitle")}
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                {t("widgetTeaserBody")}
              </p>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100 dark:bg-black/60">
              <code>{`<script
  src="https://verba.app/embed.js"
  data-verba-token="pk_your_kb_token"
  defer
></script>`}</code>
            </pre>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-4xl px-4 pb-20">
          <div className="rounded-2xl bg-brand-600 px-6 py-12 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">{t("ctaBody")}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
                  {t("ctaButton")}
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="border border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  {c("tryDemo")}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
