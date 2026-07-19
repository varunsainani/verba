"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { KbDetail } from "@/lib/types";
import { ACCENT_KEYS, accent } from "@/lib/colors";
import { Button, Card, Input, Label, Textarea, cn } from "@/components/ui";

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function SettingsPanel({
  kb,
  onUpdated,
  onDeleted,
}: {
  kb: KbDetail;
  onUpdated: (next: KbDetail) => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const e = useTranslations("errors");

  const [name, setName] = useState(kb.name);
  const [description, setDescription] = useState(kb.description);
  const [color, setColor] = useState(kb.color);
  const [topK, setTopK] = useState(kb.topK);
  const [minScore, setMinScore] = useState(kb.minScore);

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingRetrieval, setSavingRetrieval] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const embedCode = `<script src="${origin}/embed.js" data-verba-token="${kb.publicToken}" defer></script>`;
  const widgetUrl = `${origin}/widget/${kb.publicToken}`;

  async function patch(data: Partial<KbDetail>, which: "general" | "retrieval") {
    which === "general" ? setSavingGeneral(true) : setSavingRetrieval(true);
    setError("");
    try {
      const { knowledgeBase } = await api.patch<{ knowledgeBase: KbDetail }>(
        `/kbs/${kb.id}`,
        data,
      );
      onUpdated(knowledgeBase);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 0 ? err.message : e("generic"));
    } finally {
      setSavingGeneral(false);
      setSavingRetrieval(false);
    }
  }

  async function toggleWidget(v: boolean) {
    try {
      const { knowledgeBase } = await api.patch<{ knowledgeBase: KbDetail }>(
        `/kbs/${kb.id}`,
        { widgetEnabled: v },
      );
      onUpdated(knowledgeBase);
    } catch {
      setError(e("generic"));
    }
  }

  async function rotate() {
    if (!window.confirm(t("rotateConfirm"))) return;
    try {
      const { publicToken } = await api.post<{ publicToken: string }>(
        `/kbs/${kb.id}/widget/rotate`,
      );
      onUpdated({ ...kb, publicToken });
    } catch {
      setError(e("generic"));
    }
  }

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function del() {
    if (!window.confirm(t("dangerBody"))) return;
    try {
      await api.del(`/kbs/${kb.id}`);
      onDeleted();
    } catch {
      setError(e("generic"));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          {t("saved")}
        </p>
      )}

      {/* General */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {t("generalTitle")}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="s-name">{t("nameLabel")}</Label>
            <Input id="s-name" value={name} onChange={(ev) => setName(ev.target.value)} />
          </div>
          <div>
            <Label htmlFor="s-desc">{t("descLabel")}</Label>
            <Textarea
              id="s-desc"
              rows={2}
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
            />
          </div>
          <div>
            <Label>{t("colorLabel")}</Label>
            <div className="flex gap-2">
              {ACCENT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-slate-900",
                    accent(key).solid,
                    color === key ? accent(key).ring : "ring-transparent",
                  )}
                  aria-label={key}
                />
              ))}
            </div>
          </div>
          <Button
            loading={savingGeneral}
            onClick={() => patch({ name, description, color }, "general")}
          >
            {c("save")}
          </Button>
        </div>
      </Card>

      {/* Widget */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {t("widgetTitle")}
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("widgetBody")}
            </p>
          </div>
          <Switch checked={kb.widgetEnabled} onChange={toggleWidget} />
        </div>

        {kb.widgetEnabled && (
          <div className="mt-5 space-y-4">
            <div>
              <Label>{t("embedTitle")}</Label>
              <p className="mb-1.5 text-xs text-slate-400">{t("embedBody")}</p>
              <div className="relative">
                <pre className="scroll-thin overflow-x-auto rounded-lg bg-slate-900 p-3 pr-12 text-xs text-slate-100">
                  <code>{embedCode}</code>
                </pre>
                <button
                  type="button"
                  onClick={copyEmbed}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={widgetUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-4 w-4" />
                  {t("openWidget")}
                </Button>
              </a>
              <Button variant="ghost" size="sm" onClick={rotate}>
                <RefreshCw className="h-4 w-4" />
                {t("rotate")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Retrieval */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {t("retrievalTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("retrievalBody")}
        </p>
        <div className="mt-4 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <Label className="mb-0">{t("topKLabel")}</Label>
              <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                {topK}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={topK}
              onChange={(ev) => setTopK(parseInt(ev.target.value, 10))}
              className="mt-2 w-full accent-brand-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="mb-0">{t("minScoreLabel")}</Label>
              <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                {Math.round(minScore * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={minScore}
              onChange={(ev) => setMinScore(parseFloat(ev.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
          </div>
          <Button
            loading={savingRetrieval}
            onClick={() => patch({ topK, minScore }, "retrieval")}
          >
            {c("save")}
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 p-5 dark:border-red-900/50">
        <h2 className="font-semibold text-red-600 dark:text-red-400">
          {t("dangerTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("dangerBody")}
        </p>
        <Button variant="danger" className="mt-4" onClick={del}>
          <Trash2 className="h-4 w-4" />
          {t("deleteKb")}
        </Button>
      </Card>
    </div>
  );
}
