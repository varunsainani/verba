import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Same-origin API proxy: the browser only ever talks to this origin, and /api/*
// is rewritten to the backend. API_PROXY_TARGET is set per environment (backend
// alias in production); it is a build-time + runtime rewrite target.
const target = process.env.API_PROXY_TARGET || "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${target}/:path*` },
      { source: "/health", destination: `${target}/health` },
    ];
  },
  async headers() {
    // Safe hardening headers. We deliberately do NOT set X-Frame-Options so the
    // /widget page remains embeddable on customer sites.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
