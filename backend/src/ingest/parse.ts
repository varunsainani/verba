import * as cheerio from "cheerio";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { SourceType } from "@prisma/client";
import { AppError } from "../utils/http";

export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, " ")
    .split("\n")
    .map((l) => l.replace(/[  ]{2,}/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Map an uploaded file to a SourceType from its extension / mimetype.
export function detectFileType(
  filename: string,
  mimetype: string,
): SourceType | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mimetype === "application/pdf") return "PDF";
  if (
    ext === "docx" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "DOCX";
  if (ext === "md" || ext === "markdown") return "MD";
  if (ext === "txt" || mimetype.startsWith("text/")) return "TXT";
  return null;
}

export async function parseFileBuffer(
  buffer: Buffer,
  sourceType: SourceType,
): Promise<string> {
  if (sourceType === "PDF") {
    const out = await pdfParse(buffer);
    return cleanText(out.text);
  }
  if (sourceType === "DOCX") {
    const out = await mammoth.extractRawText({ buffer });
    return cleanText(out.value);
  }
  // TXT / MD
  return cleanText(buffer.toString("utf-8"));
}

// Best-effort SSRF guard: only http(s), and block obvious loopback / private
// hostnames. Not a substitute for network-level egress control, but keeps the
// demo from being trivially pointed at internal services.
function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError(400, "errors.badUrl");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(400, "errors.badUrl");
  }
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new AppError(400, "errors.badUrl");
  return url;
}

export async function parseUrl(
  raw: string,
): Promise<{ text: string; title: string }> {
  const url = assertSafeUrl(raw);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let html: string;
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VerbaBot/1.0; +https://verba.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new AppError(400, "errors.badUrl");
    html = await res.text();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(400, "errors.badUrl");
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header, svg, iframe").remove();
  const title = ($("title").first().text() || url.hostname).trim();
  const main = $("main").text() || $("article").text() || $("body").text();
  return { text: cleanText(main), title };
}
