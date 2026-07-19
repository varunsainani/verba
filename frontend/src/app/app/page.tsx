"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Library, FileText, Layers, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { KbSummary } from "@/lib/types";
import { accent } from "@/lib/colors";
import { formatDate } from "@/lib/format";
import { Button, Card, Input, Label, Spinner, Textarea } from "@/components/ui";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const c = useTranslations("common");
  const e = useTranslations("errors");
  const locale = useLocale();

  const [kbs, setKbs] = useState<KbSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ knowledgeBases: KbSummary[] }>("/kbs");
      setKbs(data.knowledgeBases);
    } catch {
      setError(e("generic"));
    } finally {
      setLoading(false);
    }
  }, [e]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(ev: React.FormEvent) {
    ev.preventDefault();
    setCreating(true);
    setError("");
    try {
      const { knowledgeBase } = await api.post<{ knowledgeBase: KbSummary }>("/kbs", {
        name,
        description,
      });
      setKbs((prev) => [
        { ...knowledgeBase, documentCount: 0, chunkCount: 0 },
        ...prev,
      ]);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 0 ? err.message : e("generic"));
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    const prev = kbs;
    setKbs((k) => k.filter((x) => x.id !== id));
    try {
      await api.del(`/kbs/${id}`);
    } catch {
      setKbs(prev);
      setError(e("generic"));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            {t("newKb")}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {t("createTitle")}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <Label htmlFor="kbname">{t("nameLabel")}</Label>
              <Input
                id="kbname"
                required
                autoFocus
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="kbdesc">{t("descLabel")}</Label>
              <Textarea
                id="kbdesc"
                rows={2}
                value={description}
                onChange={(ev) => setDescription(ev.target.value)}
                placeholder={t("descPlaceholder")}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={creating}>
                {t("createButton")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                {c("cancel")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      ) : kbs.length === 0 && !showForm ? (
        <Card className="mt-8 flex flex-col items-center px-6 py-16 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-600/20 dark:text-brand-300">
            <Library className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            {t("emptyTitle")}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {t("emptyBody")}
          </p>
          <Button className="mt-6" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            {t("createFirst")}
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kbs.map((kb) => {
            const a = accent(kb.color);
            return (
              <div
                key={kb.id}
                className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => onDelete(kb.id)}
                  title={c("delete")}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link href={`/app/kb/${kb.id}`} className="flex flex-1 flex-col">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${a.chip}`}
                  >
                    <Library className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 line-clamp-1 font-semibold text-slate-900 dark:text-white">
                    {kb.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">
                    {kb.description || " "}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {t("documents", { count: kb.documentCount })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {t("sources", { count: kb.chunkCount })}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
