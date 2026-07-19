"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  Globe,
  AlignLeft,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { DocItem, SourceType } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Button, Card, Input, Label, Spinner, Textarea, cn } from "@/components/ui";

const MAX_MB = 8;
type Mode = "file" | "url" | "text";

function SourceIcon({ type }: { type: SourceType }) {
  if (type === "URL") return <Globe className="h-4 w-4" />;
  if (type === "TEXT") return <AlignLeft className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function DocumentsPanel({
  kbId,
  onChanged,
}: {
  kbId: string;
  onChanged?: () => void;
}) {
  const t = useTranslations("documents");
  const e = useTranslations("errors");
  const c = useTranslations("common");
  const locale = useLocale();

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await api.get<{ documents: DocItem[] }>(`/kbs/${kbId}/documents`);
      setDocs(data.documents);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [kbId]);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmit =
    (mode === "file" && !!file) ||
    (mode === "url" && url.trim().length > 0) ||
    (mode === "text" && textTitle.trim().length > 0 && text.trim().length > 0);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      let doc: DocItem;
      if (mode === "file" && file) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await api.postForm<{ document: DocItem }>(
          `/kbs/${kbId}/documents`,
          fd,
        );
        doc = r.document;
      } else if (mode === "url") {
        const r = await api.post<{ document: DocItem }>(`/kbs/${kbId}/documents`, {
          mode: "url",
          url: url.trim(),
        });
        doc = r.document;
      } else {
        const r = await api.post<{ document: DocItem }>(`/kbs/${kbId}/documents`, {
          mode: "text",
          title: textTitle.trim(),
          text,
        });
        doc = r.document;
      }
      setDocs((d) => [doc, ...d]);
      setFile(null);
      setUrl("");
      setText("");
      setTextTitle("");
      if (fileInput.current) fileInput.current.value = "";
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 0 ? err.message : e("generic"));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("deleteConfirm"))) return;
    const prev = docs;
    setDocs((d) => d.filter((x) => x.id !== id));
    try {
      await api.del(`/kbs/${kbId}/documents/${id}`);
      onChanged?.();
    } catch {
      setDocs(prev);
    }
  }

  const modes: { key: Mode; label: string }[] = [
    { key: "file", label: t("tabFile") },
    { key: "url", label: t("tabUrl") },
    { key: "text", label: t("tabText") },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Add document */}
      <Card className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">{t("add")}</h2>
        <div className="mt-4 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                mode === m.key
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          {mode === "file" && (
            <div>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.docx,.txt,.md,.markdown"
                className="hidden"
                onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:border-brand-500 dark:hover:bg-brand-950/20"
              >
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {file ? file.name : t("dropHere")}
                </span>
                <span className="text-xs text-slate-400">
                  {t("fileHint", { mb: MAX_MB })}
                </span>
              </button>
            </div>
          )}

          {mode === "url" && (
            <div>
              <Label htmlFor="doc-url">{t("urlLabel")}</Label>
              <Input
                id="doc-url"
                type="url"
                value={url}
                onChange={(ev) => setUrl(ev.target.value)}
                placeholder={t("urlPlaceholder")}
              />
              <p className="mt-1.5 text-xs text-slate-400">{t("urlHint")}</p>
            </div>
          )}

          {mode === "text" && (
            <>
              <div>
                <Label htmlFor="doc-title">{t("textTitleLabel")}</Label>
                <Input
                  id="doc-title"
                  value={textTitle}
                  onChange={(ev) => setTextTitle(ev.target.value)}
                  placeholder={t("textTitlePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="doc-text">{t("textLabel")}</Label>
                <Textarea
                  id="doc-text"
                  rows={6}
                  value={text}
                  onChange={(ev) => setText(ev.target.value)}
                  placeholder={t("textPlaceholder")}
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={submitting} disabled={!canSubmit}>
            {submitting ? t("adding") : t("addButton")}
          </Button>
        </form>
      </Card>

      {/* Document list */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : loadError ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">{e("generic")}</p>
            <Button className="mt-4" variant="secondary" size="sm" onClick={load}>
              {c("retry")}
            </Button>
          </Card>
        ) : docs.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-14 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <FileText className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              {t("emptyTitle")}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              {t("emptyBody")}
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <SourceIcon type={d.sourceType} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">
                    {d.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <StatusBadge status={d.status} />
                    {d.status === "READY" && (
                      <span>{t("passages", { count: d.chunkCount })}</span>
                    )}
                    <span>{t("addedOn", { date: formatDate(d.createdAt, locale) })}</span>
                  </div>
                  {d.status === "FAILED" && d.error && (
                    <p className="mt-1 truncate text-xs text-red-500" title={d.error}>
                      {d.error}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  aria-label={c("delete")}
                  className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-600 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DocItem["status"] }) {
  const t = useTranslations("documents");
  if (status === "READY") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("ready")}
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 text-red-500">
        <AlertCircle className="h-3.5 w-3.5" />
        {t("failed")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-500">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {t("processing")}
    </span>
  );
}
