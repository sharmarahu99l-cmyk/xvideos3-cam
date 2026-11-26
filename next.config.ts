import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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