export type SourceType = "PDF" | "DOCX" | "TXT" | "MD" | "URL" | "TEXT";
export type DocStatus = "PROCESSING" | "READY" | "FAILED";

export interface KbSummary {
  id: string;
  name: string;
  description: string;
  color: string;
  widgetEnabled: boolean;
  publicToken: string;
  topK: number;
  minScore: number;
  documentCount: number;
  chunkCount: number;
  createdAt: string;
}

export interface KbDetail {
  id: string;
  name: string;
  description: string;
  color: string;
  widgetEnabled: boolean;
  publicToken: string;
  topK: number;
  minScore: number;
  documentCount: number;
  createdAt: string;
}

export interface DocItem {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceRef: string;
  status: DocStatus;
  chunkCount: number;
  charCount: number;
  error: string | null;
  createdAt: string;
}

export interface Citation {
  n: number;
  documentId: string;
  docTitle: string;
  chunkId: string;
  snippet: string;
  score: number;
}

export interface ChatResponse {
  sessionId: string;
  messageId?: string;
  answer: string;
  citations: Citation[];
  grounded: boolean;
}

export interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations?: Citation[] | null;
  createdAt: string;
}

export interface SessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Usage {
  date: string;
  queryCount: number;
  ingestCount: number;
  queryCap: number;
  ingestCap: number;
}
