import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/categories",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/pornstars",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/watch/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/category/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/sitemap-:num.xml", destination: "/api/xml-sitemap/page/:num" },
      { source: "/video-sitemap-:num.xml", destination: "/api/xml-sitemap/video/:num" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.eporner.com",
      },
      {
        protocol: "https",
        hostname: "static-ca-cdn.eporner.com",
      },
      {
        protocol: "https",
        hostname: "static-eu-cdn.eporner.com",
      },
    ],
  },
};

export default nextConfig;