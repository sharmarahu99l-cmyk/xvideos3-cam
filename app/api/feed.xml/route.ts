import { NextResponse } from 'next/server';

export const revalidate = 1800;

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const queries = ['desi', 'mms', 'most-popular'];
  const allVideos: any[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    try {
      const order = q === 'most-popular' ? 'most-popular' : 'latest';
      const queryTerm = q === 'most-popular' ? 'all' : q;
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
          queryTerm
        )}&per_page=50&page=1&order=${order}&lq=0&thumbsize=big&format=json`,
        { next: { revalidate: 1800 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos)) {
          for (const v of data.videos) {
            if (v?.id && v?.title && v?.default_thumb?.src && !seen.has(v.id)) {
              seen.add(v.id);
              allVideos.push(v);
            }
          }
        }
      }
    } catch {}
  }

  const itemsXml = allVideos
    .map((v) => {
      const watchUrl = `https://xvideos3.cam/watch/${encodeURIComponent(v.id)}`;
      const title = escapeXml(v.title);
      const thumb = escapeXml(v.default_thumb.src);
      const duration = Number(v.length_sec) || 0;
      const tags = escapeXml(v.keywords || 'desi, mms, hd');

      return `
    <item>
      <title>${title}</title>
      <link>${watchUrl}</link>
      <guid isPermaLink="true">${watchUrl}</guid>
      <description>${title} - Free HD streaming on HubTube</description>
      <category>${tags}</category>
      <media:thumbnail url="${thumb}" />
      <media:content url="${watchUrl}" duration="${duration}" />
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>HubTube - XVideos3.cam</title>
    <link>https://xvideos3.cam</link>
    <description>Latest Desi videos, MMS, and HD streams on HubTube</description>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
