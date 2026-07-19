import type { MetadataRoute } from "next";

const BASE = "https://verba-mocha.vercel.app";

// Only the public marketing/auth pages are indexable; /app and /widget are
// disallowed in robots.txt.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/login`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/register`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
