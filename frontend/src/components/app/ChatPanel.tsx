"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, FileText, X, Sparkles, Plus, RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ChatResponse, Citation, KbDetail } from "@/lib/types";
import { Button, cn } from "@/components/ui";

interface ChatMessage {
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

function AnswerText({
  content,
  citations,
  onOpen,
}: {
  content: string;
  citations: Citation[];
  onOpen: (c: Citation) => void;
}) {
  const parts = content.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = parseInt(m[1], 10);
          const cit = citations.find((c) => c.n === n);
          if (cit) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpen(cit)}
                aria-label={cit.docTitle}
                className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-brand-100 px-1 align-super text-[10px] font-semibold text-brand-700 hover:bg-brand-200 dark:bg-brand-600/30 dark:text-brand-200"
              >
                {n}
              </button>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function ChatPanel({ kb }: { kb: KbDetail }) {
  const t = useTranslations("chat");
  const e = useTranslations("errors");
  const c = useTranslations("common");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [active, setActive] = useState<Citation | null>(null);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || sending) return;
    setError("");
    setActive(null);
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "USER", content: q },
      { role: "ASSISTANT", content: "", pending: true },
    ]);
    setSending(true);
    try {
      const res = await api.post<ChatResponse>(`/kbs/${kb.id}/chat`, {
        question: q,
        sessionId,
      });
      setSessionId(res.sessionId);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "ASSISTANT",
          content: res.answer,
          citations: res.citations,
        };
        return next;
      });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status !== 0 ? err.message : e("generic");
      setMessages((m) => m.slice(0, -1));
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setMessages([]);
    setSessionId(undefined);
    setActive(null);
    setError("");
  }

  const empty = messages.length === 0;
  const suggestions = [t("suggested1"), t("suggested2"), t("suggested3")];

  if (kb.documentCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
          <FileText className="h-5 w-5" />
        </span>
        <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
          {t("noDocsTitle")}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("noDocsBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[68vh] min-h-[440px] gap-4">
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {kb.name}
          </span>
          {!empty && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <Plus className="h-4 w-4" />
              {t("newChat")}
            </Button>
          )}
        </div>

        <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-600/20 dark:text-brand-300">
                <Sparkles className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                {t("emptyTitle")}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {t("emptyBody")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-600 dark:hover:bg-brand-950/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "USER" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] animate-fade-in rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "USER"
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
                  )}
                >
                  {msg.pending ? (
                    <span className="dot-typing inline-flex gap-1 py-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                    </span>
                  ) : msg.role === "ASSISTANT" ? (
                    <>
                      <AnswerText
                        content={msg.content}
                        citations={msg.citations ?? []}
                        onOpen={setActive}
                      />
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2.5 dark:border-slate-700">
                          {msg.citations.map((c) => (
                            <button
                              key={c.chunkId}
                              type="button"
                              onClick={() => setActive(c)}
                              className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-slate-500 ring-1 ring-slate-200 hover:text-brand-600 hover:ring-brand-300 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                [{c.n}] {c.docTitle}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
        >
          <input
            value={input}
            onChange={(ev) => setInput(ev.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            disabled={sending}
            className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <Button type="submit" loading={sending} disabled={!input.trim()} aria-label={t("send")}>
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{t("send")}</span>
          </Button>
        </form>
      </div>

      {/* Source drawer */}
      {active && (
        <>
          <div
            className="absolute inset-0 z-10 rounded-xl bg-black/20 lg:hidden"
            onClick={() => setActive(null)}
          />
          <div className="absolute right-0 top-0 z-20 flex h-full w-full max-w-sm flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:static lg:w-80 lg:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("sources")}
              </span>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label={c("close")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <FileText className="h-4 w-4 text-brand-500" />
                {active.docTitle}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {t("match", { score: Math.round(active.score * 100) })}
              </p>
              <blockquote className="mt-3 rounded-lg border-l-2 border-brand-400 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                {active.snippet}
              </blockquote>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
