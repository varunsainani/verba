import * as cheerio from "cheerio";
import dns from "dns";
import net from "net";
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
    // unpdf ships a serverless-friendly pdf.js build (no native deps, no worker).
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return cleanText(text);
  }
  if (sourceType === "DOCX") {
    const out = await mammoth.extractRawText({ buffer });
    return cleanText(out.value);
  }
  // TXT / MD
  return cleanText(buffer.toString("utf-8"));
}

function isBlockedIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255))
    return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedIp(ip: string): boolean {
  const fam = net.isIP(ip);
  if (fam === 4) return isBlockedIPv4(ip);
  if (fam === 6) {
    const low = ip.toLowerCase();
    if (low === "::1" || low === "::") return true;
    if (/^f[cd]/.test(low)) return true; // ULA fc00::/7
    if (/^fe[89ab]/.test(low)) return true; // link-local fe80::/10
    const mapped = low.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIPv4(mapped[1]);
    return false;
  }
  return true; // not a recognizable IP
}

// Reject non-http(s) and any host that resolves to a private/loopback/link-local
// address (covers encoded IP literals like decimal/octal/hex, since the resolver
// normalizes them). Residual TOCTOU/DNS-rebinding risk remains without pinning
// the resolved IP into the socket, which is acceptable for this authenticated,
// quota-limited feature.
async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError(400, "errors.badUrl");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(400, "errors.badUrl");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local")) {
    throw new AppError(400, "errors.badUrl");
  }
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new AppError(400, "errors.badUrl");
    return url;
  }
  let addrs: { address: string }[];
  try {
    addrs = await dns.promises.lookup(host, { all: true });
  } catch {
    throw new AppError(400, "errors.badUrl");
  }
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
    throw new AppError(400, "errors.badUrl");
  }
  return url;
}

export async function parseUrl(
  raw: string,
): Promise<{ text: string; title: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let url = await assertSafeUrl(raw);
  let html = "";
  let finalHost = url.hostname;
  try {
    // Follow redirects manually so each hop is re-validated against the guard.
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VerbaBot/1.0; +https://verba.app)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) throw new AppError(400, "errors.badUrl");
        url = await assertSafeUrl(new URL(location, url).toString());
        continue;
      }
      if (!res.ok) throw new AppError(400, "errors.badUrl");
      finalHost = url.hostname;
      html = await res.text();
      break;
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(400, "errors.badUrl");
  } finally {
    clearTimeout(timeout);
  }

  if (!html) throw new AppError(400, "errors.badUrl");
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header, svg, iframe").remove();
  const title = ($("title").first().text() || finalHost).trim();
  const main = $("main").text() || $("article").text() || $("body").text();
  return { text: cleanText(main), title };
}
