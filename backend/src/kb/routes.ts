import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { Document, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { AppError, asyncHandler } from "../utils/http";
import { requireAuth } from "../middleware/auth";
import { consumeQuota, getUsage } from "../usage/usage";
import { detectFileType, parseFileBuffer, parseUrl } from "../ingest/parse";
import { ingestDocument } from "../ingest/ingest";
import { answerQuestion } from "../rag/chat";

export const kbRouter = Router();
kbRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

async function getOwnedKb(userId: string, kbId: string) {
  const kb = await prisma.knowledgeBase.findFirst({ where: { id: kbId, userId } });
  if (!kb) throw new AppError(404, "errors.kbNotFound");
  return kb;
}

function serializeDoc(d: Document) {
  return {
    id: d.id,
    title: d.title,
    sourceType: d.sourceType,
    sourceRef: d.sourceRef,
    status: d.status,
    chunkCount: d.chunkCount,
    charCount: d.charCount,
    error: d.error,
    createdAt: d.createdAt,
  };
}

/* ------------------------------- KB CRUD -------------------------------- */

kbRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const kbs = await prisma.knowledgeBase.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { documents: true, chunks: true } } },
    });
    res.json({
      knowledgeBases: kbs.map((kb) => ({
        id: kb.id,
        name: kb.name,
        description: kb.description,
        color: kb.color,
        widgetEnabled: kb.widgetEnabled,
        publicToken: kb.publicToken,
        topK: kb.topK,
        minScore: kb.minScore,
        documentCount: kb._count.documents,
        chunkCount: kb._count.chunks,
        createdAt: kb.createdAt,
      })),
    });
  }),
);

const createKbSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  color: z.string().max(30).optional(),
});

kbRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createKbSchema.parse(req.body);
    const kb = await prisma.knowledgeBase.create({
      data: {
        userId: req.userId!,
        name: data.name,
        description: data.description ?? "",
        color: data.color ?? "emerald",
      },
    });
    res.status(201).json({ knowledgeBase: kb });
  }),
);

kbRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const counts = await prisma.document.aggregate({
      where: { kbId: kb.id },
      _count: true,
    });
    res.json({ knowledgeBase: { ...kb, documentCount: counts._count } });
  }),
);

const updateKbSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  color: z.string().max(30).optional(),
  widgetEnabled: z.boolean().optional(),
  topK: z.number().int().min(1).max(10).optional(),
  minScore: z.number().min(0).max(1).optional(),
});

kbRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    await getOwnedKb(req.userId!, req.params.id);
    const data = updateKbSchema.parse(req.body);
    const kb = await prisma.knowledgeBase.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ knowledgeBase: kb });
  }),
);

kbRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await getOwnedKb(req.userId!, req.params.id);
    await prisma.knowledgeBase.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

kbRouter.post(
  "/:id/widget/rotate",
  asyncHandler(async (req, res) => {
    await getOwnedKb(req.userId!, req.params.id);
    const { randomUUID } = await import("crypto");
    const kb = await prisma.knowledgeBase.update({
      where: { id: req.params.id },
      data: { publicToken: randomUUID().replace(/-/g, "") },
    });
    res.json({ publicToken: kb.publicToken });
  }),
);

/* ------------------------------ Documents ------------------------------- */

kbRouter.get(
  "/:id/documents",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const docs = await prisma.document.findMany({
      where: { kbId: kb.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ documents: docs.map(serializeDoc) });
  }),
);

const urlSchema = z.object({ mode: z.literal("url"), url: z.string().url().max(2000) });
const textSchema = z.object({
  mode: z.literal("text"),
  title: z.string().min(1).max(160),
  text: z.string().min(1),
});

kbRouter.post(
  "/:id/documents",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    await consumeQuota(req.userId!, "ingestCount", env.dailyIngestCap);

    let title: string;
    let text: string;
    let sourceType: "PDF" | "DOCX" | "TXT" | "MD" | "URL" | "TEXT";
    let sourceRef = "";

    if (req.file) {
      const detected = detectFileType(req.file.originalname, req.file.mimetype);
      if (!detected) throw new AppError(415, "errors.unsupportedType");
      sourceType = detected;
      sourceRef = req.file.originalname;
      title =
        (typeof req.body.title === "string" && req.body.title.trim()) ||
        req.file.originalname;
      text = await parseFileBuffer(req.file.buffer, detected);
    } else if (req.body?.mode === "url") {
      const { url } = urlSchema.parse(req.body);
      const parsed = await parseUrl(url);
      sourceType = "URL";
      sourceRef = url;
      title = parsed.title.slice(0, 160) || url;
      text = parsed.text;
    } else if (req.body?.mode === "text") {
      const data = textSchema.parse(req.body);
      sourceType = "TEXT";
      title = data.title;
      text = data.text;
    } else {
      throw new AppError(400, "errors.validation");
    }

    const doc = await ingestDocument({
      kbId: kb.id,
      title,
      sourceType,
      sourceRef,
      text,
    });
    res.status(201).json({ document: serializeDoc(doc) });
  }),
);

kbRouter.delete(
  "/:id/documents/:docId",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const doc = await prisma.document.findFirst({
      where: { id: req.params.docId, kbId: kb.id },
    });
    if (!doc) throw new AppError(404, "errors.docNotFound");
    await prisma.document.delete({ where: { id: doc.id } });
    res.status(204).end();
  }),
);

/* --------------------------------- Chat --------------------------------- */

const chatSchema = z.object({
  question: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
});

kbRouter.post(
  "/:id/chat",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const { question, sessionId } = chatSchema.parse(req.body);

    await consumeQuota(req.userId!, "queryCount", env.dailyQueryCap);

    let session = sessionId
      ? await prisma.chatSession.findFirst({
          where: { id: sessionId, kbId: kb.id, userId: req.userId },
        })
      : null;
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          kbId: kb.id,
          userId: req.userId,
          title: question.slice(0, 80),
        },
      });
    }

    await prisma.message.create({
      data: { sessionId: session.id, role: "USER", content: question },
    });

    const result = await answerQuestion({ kb, question, locale: req.locale });

    const assistant = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: result.answer,
        citations: result.citations as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    res.json({
      sessionId: session.id,
      messageId: assistant.id,
      answer: result.answer,
      citations: result.citations,
      grounded: result.grounded,
    });
  }),
);

kbRouter.get(
  "/:id/sessions",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const sessions = await prisma.chatSession.findMany({
      where: { kbId: kb.id, userId: req.userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    res.json({ sessions });
  }),
);

kbRouter.get(
  "/:id/sessions/:sid/messages",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sid, kbId: kb.id, userId: req.userId },
    });
    if (!session) throw new AppError(404, "errors.sessionNotFound");
    const messages = await prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });
    res.json({ session, messages });
  }),
);

kbRouter.delete(
  "/:id/sessions/:sid",
  asyncHandler(async (req, res) => {
    const kb = await getOwnedKb(req.userId!, req.params.id);
    const session = await prisma.chatSession.findFirst({
      where: { id: req.params.sid, kbId: kb.id, userId: req.userId },
    });
    if (!session) throw new AppError(404, "errors.sessionNotFound");
    await prisma.chatSession.delete({ where: { id: session.id } });
    res.status(204).end();
  }),
);

/* --------------------------------- Usage -------------------------------- */

kbRouter.get(
  "/usage/today",
  asyncHandler(async (req, res) => {
    const usage = await getUsage(req.userId!);
    res.json({
      ...usage,
      queryCap: env.dailyQueryCap,
      ingestCap: env.dailyIngestCap,
    });
  }),
);
