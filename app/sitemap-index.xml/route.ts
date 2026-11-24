import { NextResponse } from 'next/server';

export async function GET() {
  const chunks = Array.from({ length: 20 }, (_, i) => i + 1)
    .map((n) => `  <sitemap><loc>https://indiansexvideo.tv/api/sitemap-chunk/${n}</loc></sitemap>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://indiansexvideo.tv/sitemap.xml</loc></sitemap>
${chunks}
  <sitemap><loc>https://indiansexvideo.tv/api/feed.xml</loc></sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}