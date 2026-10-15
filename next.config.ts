import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AgriLink is a fully client-interactive Ant Design dashboard. Cache Components
  // (PPR) prerenders a static shell for every route, which conflicts with Ant
  // Design's runtime id generation (Math.random) during prerender. PPR provides
  // no benefit for this client-driven SPA, so it is disabled intentionally.
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
