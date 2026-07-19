# Verba - Plan

**Verba** is a full-stack RAG ("chat with your documents") knowledge assistant. Upload your
documents, and Verba answers questions grounded in them, with real citations back to the exact
source passage. Includes an embeddable chat widget you can drop on any website.

This is a real, working product (not a demo shell): real ingestion, real embeddings, real vector
retrieval, real grounded generation, real auth, real multi-tenant data, all on a free stack.

Positioning per platform:
- **Fiverr / Upwork (EN):** "Chat with your docs / AI knowledge base / RAG chatbot for your site."
- **Workana (PT/ES):** same product, fully trilingual, LATAM SMEs get a support bot over their FAQs.

## Why this one
RAG "chat with your docs" was the #1 requested build across all three platforms in the research.
The current portfolio has no RAG app. Verba fills that gap and demoes a live, embeddable widget,
which is exactly what buyers ask to see.

## Stack (free)
- Frontend: Next.js (App Router) + TypeScript + Tailwind + next-intl (EN/ES/PT). Same-origin `/api` proxy.
- Backend: Express + TypeScript + Prisma + PostgreSQL (Neon) with the `pgvector` extension.
- Embeddings: Gemini `gemini-embedding-001` at 768 dims (task types RETRIEVAL_DOCUMENT / RETRIEVAL_QUERY),
  behind an `EmbeddingProvider` interface. Vectors normalized to unit length, cosine distance in pgvector.
- Generation: Gemini `gemini-flash-latest` behind an `LLMProvider` interface (Groq / Claude switchable).
- Parsing: `pdf-parse` (PDF), `mammoth` (DOCX), plain (TXT/MD), `undici` fetch + `cheerio` (URL).
- Deploy: all-Vercel (frontend + backend serverless) + Neon. Gemini key in backend env only.
- Verified live: generation + 768-dim embeddings both return 200 on the reused free Gemini key.

## Data model (Prisma)
- **User** (email, passwordHash, name, locale, role) + **RefreshToken**
- **KnowledgeBase** (userId, name, description, widgetEnabled, publicToken, retrieval settings)
- **Document** (kbId, title, sourceType [PDF|DOCX|TXT|MD|URL|TEXT], sourceRef, status
  [PROCESSING|READY|FAILED], chunkCount, charCount, error)
- **Chunk** (documentId, kbId, index, content, `embedding vector(768)`, tokenCount) + ivfflat/hnsw index
- **ChatSession** (kbId, userId?, isWidget, title) + **Message** (sessionId, role, content, citations JSON)
- **UsageDaily** (userId, date, queryCount, ingestCount) for free-quota protection

## Backend API
- Auth: `POST /auth/register|login|refresh|logout`, `GET /auth/me`, `POST /auth/demo` (one-click).
- KBs: `GET/POST /kbs`, `GET/PATCH/DELETE /kbs/:id`, `POST /kbs/:id/widget/rotate`, widget toggle.
- Docs: `GET /kbs/:id/documents`, `POST /kbs/:id/documents` (file upload / url / text), `DELETE .../:docId`,
  `GET .../:docId/chunks`.
- Chat: `POST /kbs/:id/chat` (question -> retrieve -> grounded answer + citations), `GET /kbs/:id/sessions`,
  `GET /sessions/:sid/messages`.
- Public widget: `GET /public/widget/:token/config`, `POST /public/widget/:token/chat` (rate-limited).
- Usage: `GET /usage`. Health: `GET /health`.

## RAG safety (per playbook LLM patterns)
- Grounding guard: if no chunk clears the similarity threshold, answer "I don't know from these
  documents" instead of hallucinating. System prompt forbids outside knowledge.
- Citations computed from the actual retrieved chunks (not trusted from the model): the model
  references sources by index, we map indices back to real chunk ids/snippets server-side.
- Structured handling + fallback so a bad model response never 500s.
- Per-user/day query + ingest caps, DB-backed, checked before any Gemini call. All LLM paths behind auth
  (except the public widget, which is rate-limited per token + capped).
- Gemini key backend-only; grep the frontend bundle to confirm no leak.

## Frontend pages
- `/` landing (hero, features, live-widget teaser, demo CTA), `/login`, `/register`.
- `/app` dashboard (KB list, create KB), `/app/kb/[id]` (documents + upload + ingestion status),
  `/app/kb/[id]/chat` (chat with inline citations + source drawer), `/app/kb/[id]/settings`
  (widget embed code, public token, retrieval settings), `/app/settings` (account + usage).
- `/widget/[token]` standalone embeddable chat page (loaded in an iframe) + `/embed.js` bubble injector.
- Light/dark + responsive. Locale auto-detect + visible toggle on public and in-app.

## Seed
Demo user (`demo@verba.app`) + 3 KBs with REAL ingested + embedded documents so chat works instantly:
a SaaS product handbook, an HR policy set, and an API/support FAQ. Content authored EN with ES/PT
variants for the trilingual demo. Seed embeds via Gemini (key required at seed time).

## Deploy
Two Vercel projects (`verba` frontend rootDirectory=frontend, `verba-api` backend rootDirectory=backend).
Persist env on projects (never inline): backend `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`GEMINI_API_KEY`, `LLM_PROVIDER=gemini`, `APP_URL`; frontend `API_PROXY_TARGET` (backend alias),
`NEXT_PUBLIC_DEMO_*`. pgvector `CREATE EXTENSION` + hnsw index applied to prod. GitHub git-integration,
read real aliases, redeploy, smoke-test a DB endpoint.

## Build order
scaffold + pgvector -> schema + auth -> ingestion (parse/chunk/embed) -> RAG chat + citations ->
KB CRUD + widget + usage -> frontend scaffold/i18n/auth/landing -> dashboard/docs/upload ->
chat UI + sources + widget -> seed -> deploy -> audit + screenshots.
