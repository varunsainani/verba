import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { t } from "../i18n/messages";
import { AppError, asyncHandler } from "../utils/http";
import { consumeQuota } from "../usage/usage";
import { answerQuestion } from "../rag/chat";

export const publicRouter = Router();

// Per-token + per-IP rate limit for the embeddable widget. NOTE: in-memory, so
// on serverless this is best-effort per instance; the owner's daily query cap
// (consumed below) is the real backstop for the free quota.
const widgetLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.params.token}:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({ error: t(req.locale, "errors.rateLimited") });
  },
});

async function getWidgetKb(token: string) {
  const kb = await prisma.knowledgeBase.findUnique({ where: { publicToken: token } });
  if (!kb || !kb.widgetEnabled) throw new AppError(404, "errors.widgetDisabled");
  return kb;
}

publicRouter.get(
  "/widget/:token/config",
  asyncHandler(async (req, res) => {
    const kb = await getWidgetKb(req.params.token);
    res.json({
      name: kb.name,
      description: kb.description,
      color: kb.color,
    });
  }),
);

const chatSchema = z.object({
  question: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
});

publicRouter.post(
  "/widget/:token/chat",
  widgetLimiter,
  asyncHandler(async (req, res) => {
    const kb = await getWidgetKb(req.params.token);
    const { question, sessionId } = chatSchema.parse(req.body);

    // Protect the free Gemini quota against the KB owner's daily cap.
    await consumeQuota(kb.userId, "queryCount", env.dailyQueryCap);

    let session = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, kbId: kb.id, isWidget: true },
        })
      : null;
    if (!session) {
      session = await prisma.chatSession.create({
        data: { kbId: kb.id, isWidget: true, title: question.slice(0, 80) },
      });
    }

    await prisma.message.create({
      data: { sessionId: session.id, role: "USER", content: question },
    });

    const result = await answerQuestion({ kb, question, locale: req.locale });

    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: result.answer,
        citations: result.citations as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({
      sessionId: session.id,
      answer: result.answer,
      citations: result.citations,
      grounded: result.grounded,
    });
  }),
);
