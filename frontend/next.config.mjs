import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Same-origin API proxy: the browser only ever talks to this origin, and /api/*
// is rewritten to the backend. API_PROXY_TARGET is set per environment (backend
// alias in production); it is a build-time + runtime rewrite target.
const target = process.env.API_PROXY_TARGET || "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${target}/:path*` },
      { source: "/health", destination: `${target}/health` },
    ];
  },
};

export default withNextIntl(nextConfig);
