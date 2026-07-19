"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, FileText, X } from "lucide-react";
import { accent } from "@/lib/colors";
import { cn } from "@/components/ui";

interface Citation {
  n: number;
  docTitle: string;
  chunkId: string;
  snippet: string;
  score: number;
}
interface WMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

function Answer({
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
          const cit = citations.find((c) => c.n === parseInt(m[1], 10));
          if (cit)
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpen(cit)}
                className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-brand-100 px-1 align-super text-[10px] font-semibold text-brand-700 dark:bg-brand-600/30 dark:text-brand-200"
              >
                {m[1]}
              </button>
            );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function WidgetChat({ token, locale }: { token: string; locale: string }) {
  const t = useTranslations("widget");
  const [config, setConfig] = useState<{ name: string; color: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [messages, setMessages] = useState<WMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [active, setActive] = useState<Citation | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/public/widget/${token}/config`, { headers: { "X-Locale": locale } })
      .then(async (r) => {
        if (!r.ok) {
          setStatus("unavailable");
          return;
        }
        setConfig(await r.json());
        setStatus("ready");
      })
      .catch(() => setStatus("unavailable"));
  }, [token, locale]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || sending) return;
    setInput("");
    setActive(null);
    setMessages((m) => [
      ...m,
      { role: "user", content: q },
      { role: "assistant", content: "", pending: true },
    ]);
    setSending(true);
    try {
      const r = await fetch(`/api/public/widget/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Locale": locale },
        body: JSON.stringify({ question: q, sessionId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "error");
      setSessionId(data.sessionId);
      setMessages((m) => {
        const n = [...m];
        n[n.length - 1] = {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        };
        return n;
      });
    } catch (err) {
      setMessages((m) => {
        const n = [...m];
        n[n.length - 1] = {
          role: "assistant",
          content: err instanceof Error ? err.message : "error",
        };
        return n;
      });
    } finally {
      setSending(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-slate-900">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unavailable" || !config) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {t("welcome", { name: "" })}
      </div>
    );
  }

  const a = accent(config.color);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className={cn("flex items-center gap-2 px-4 py-3 text-white", a.solid)}>
        <FileText className="h-5 w-5" />
        <span className="font-semibold">{config.name}</span>
      </div>

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {t("welcome", { name: config.name })}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[88%] animate-fade-in rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? cn("rounded-br-sm text-white", a.solid)
                  : "rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
              )}
            >
              {msg.pending ? (
                <span className="dot-typing inline-flex gap-1 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                </span>
              ) : msg.role === "assistant" ? (
                <>
                  <Answer
                    content={msg.content}
                    citations={msg.citations ?? []}
                    onOpen={setActive}
                  />
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-200 pt-2 dark:border-slate-700">
                      {msg.citations.map((c) => (
                        <button
                          key={c.chunkId}
                          type="button"
                          onClick={() => setActive(c)}
                          className="inline-flex max-w-[180px] items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                        >
                          <FileText className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">[{c.n}] {c.docTitle}</span>
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
        ))}
        <div ref={endRef} />
      </div>

      {active && (
        <div className="mx-3 mb-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {active.docTitle}
            </span>
            <button type="button" onClick={() => setActive(null)}>
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
          <p className="leading-relaxed text-slate-500 dark:text-slate-400">
            {active.snippet}
          </p>
        </div>
      )}

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-slate-100 p-2.5 dark:border-slate-800"
      >
        <input
          value={input}
          onChange={(ev) => setInput(ev.target.value)}
          placeholder={t("placeholder")}
          disabled={sending}
          className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50",
            a.solid,
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="pb-2 text-center text-[10px] text-slate-400">{t("poweredBy")}</div>
    </div>
  );
}
