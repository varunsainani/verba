"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, FileText, MessageSquare, Settings2 } from "lucide-react";
import { api } from "@/lib/api";
import { KbDetail } from "@/lib/types";
import { accent } from "@/lib/colors";
import { Button, Spinner, cn } from "@/components/ui";
import { DocumentsPanel } from "@/components/app/DocumentsPanel";
import { ChatPanel } from "@/components/app/ChatPanel";
import { SettingsPanel } from "@/components/app/SettingsPanel";

type Tab = "documents" | "chat" | "settings";

export default function KbPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("kb");
  const err = useTranslations("errors");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("documents");
  const [kb, setKb] = useState<KbDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const { knowledgeBase } = await api.get<{ knowledgeBase: KbDetail }>(
        `/kbs/${id}`,
      );
      setKb(knowledgeBase);
      loadedRef.current = true;
    } catch {
      // Only treat as "not found" on the first load; a transient failure while
      // refreshing counts (e.g. after adding a document) must not blank the page.
      if (!loadedRef.current) setMissing(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (missing || !kb) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">{err("generic")}</p>
        <Link href="/app" className="mt-4 inline-block">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            {t("backToDashboard")}
          </Button>
        </Link>
      </div>
    );
  }

  const a = accent(kb.color);
  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "documents", label: t("tabDocuments"), icon: FileText },
    { key: "chat", label: t("tabChat"), icon: MessageSquare },
    { key: "settings", label: t("tabSettings"), icon: Settings2 },
  ];

  return (
    <div>
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToDashboard")}
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-lg",
            a.chip,
          )}
        >
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {kb.name}
          </h1>
          {kb.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {kb.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-1">
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                <tb.icon className="h-4 w-4" />
                {tb.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {tab === "documents" && <DocumentsPanel kbId={kb.id} onChanged={load} />}
        {tab === "chat" && <ChatPanel kb={kb} />}
        {tab === "settings" && (
          <SettingsPanel
            kb={kb}
            onUpdated={(next) => setKb(next)}
            onDeleted={() => router.replace("/app")}
          />
        )}
      </div>
    </div>
  );
}
