import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE_URL = 'https://indiansexvideo.tv';
const QUERIES = [
  { q: 'desi', page: 1 },
  { q: 'desi', page: 2 },
  { q: 'indian', page: 1 },
  { q: 'bhabhi', page: 1 },
  { q: 'mms', page: 1 },
  { q: 'amateur', page: 1 },
  { q: '4k', page: 1 },
  { q: 'hindi', page: 1 },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchBatch(query: string, page: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=50&page=${page}&order=most-popular&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.videos) ? data.videos : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const seen = new Set<string>();
  const items: string[] = [];

  // Fetch in 2 small waves so Eporner never rate-limits Vercel's IP
  const wave1 = await Promise.all(
    QUERIES.slice(0, 4).map((item) => fetchBatch(item.q, item.page))
  );
  const wave2 = await Promise.all(
    QUERIES.slice(4).map((item) => fetchBatch(item.q, item.page))
  );

  for (const batch of [...wave1, ...wave2]) {
    for (const v of batch) {
      const id = String(v?.id || '').trim();
      const title = String(v?.title || '').trim();
      const thumb = String(v?.default_thumb?.src || '').trim();
      if (!id || !title || !thumb.startsWith('http') || seen.has(id)) continue;
      seen.add(id);

      const duration = Math.max(15, Math.min(28000, Number(v?.length_sec) || 180));
      const pageUrl = `${BASE_URL}/watch/${encodeURIComponent(id)}`;
      const cleanDesc = `Watch ${title} free in HD on IndianSexVideo.tv`.slice(0, 200);

      items.push(`  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumb)}</video:thumbnail_loc>
      <video:title>${escapeXml(title.slice(0, 100))}</video:title>
      <video:description>${escapeXml(cleanDesc)}</video:description>
      <video:player_loc allow_embed="yes">${escapeXml(
        `https://www.eporner.com/embed/${encodeURIComponent(id)}/`
      )}</video:player_loc>
      <video:duration>${duration}</video:duration>
      <video:family_friendly>no</video:family_friendly>
    </video:video>
  </url>`);
    }
  }

  // Fallback entry so <urlset> is never empty if upstream API temporarily hiccups
  if (items.length === 0) {
    items.push(`  <url>
    <loc>${BASE_URL}/reels</loc>
    <video:video>
      <video:thumbnail_loc>${BASE_URL}/icon.png</video:thumbnail_loc>
      <video:title>Trending Indian &amp; Desi HD Videos on IndianSexVideo.tv</video:title>
      <video:description>Watch latest trending Desi videos and HD clips on IndianSexVideo.tv</video:description>
      <video:player_loc allow_embed="yes">${BASE_URL}/reels</video:player_loc>
      <video:duration>60</video:duration>
      <video:family_friendly>no</video:family_friendly>
    </video:video>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${items.join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}