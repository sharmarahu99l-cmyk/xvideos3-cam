import { NextResponse } from 'next/server';

const TOTAL_SITEMAP_SHARDS = 1000;

export async function GET() {
  const now = new Date().toISOString();
  const baseUrl = 'https://xvideos3.cam';

  const entries = Array.from({ length: TOTAL_SITEMAP_SHARDS }, (_, i) => {
    return `  <sitemap>
    <loc>${baseUrl}/api/sitemap-chunk/${i}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
