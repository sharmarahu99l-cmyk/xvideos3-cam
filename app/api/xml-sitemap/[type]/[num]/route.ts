import { NextResponse } from 'next/server';
import crawlIndex from '../../../../../data/crawl-index.json';

type CrawlItem = { id: string; t: string; i?: string };

const BASE_URL = 'https://indiansexvideo.tv';
const CHUNK_SIZE = 10000;

function esc(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ type: string; num: string }> }
) {
  const { type, num } = await context.params;
  const pageNum = Math.max(1, parseInt(num, 10) || 1);
  const items = crawlIndex as CrawlItem[];
  const start = (pageNum - 1) * CHUNK_SIZE;
  const chunk = items.slice(start, start + CHUNK_SIZE);

  if (chunk.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const now = new Date().toISOString();

  if (type === 'video') {
    const entries = chunk
      .filter((v) => v.i && v.i.startsWith('http'))
      .map((v) => {
        const loc = `${BASE_URL}/watch/${encodeURIComponent(v.id)}`;
        const player = `https://www.eporner.com/embed/${encodeURIComponent(v.id)}/`;
        return `  <url>
    <loc>${esc(loc)}</loc>
    <video:video>
      <video:thumbnail_loc>${esc(v.i!)}</video:thumbnail_loc>
      <video:title>${esc(v.t)}</video:title>
      <video:description>${esc(`Watch ${v.t} free in HD on IndianSexVideo.tv`)}</video:description>
      <video:player_loc allow_embed="yes">${esc(player)}</video:player_loc>
      <video:family_friendly>no</video:family_friendly>
    </video:video>
  </url>`;
      });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${entries.join('\n')}\n</urlset>`;
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  const staticUrls =
    pageNum === 1
      ? [
          `${BASE_URL}/`,
          `${BASE_URL}/reels`,
          `${BASE_URL}/categories`,
          `${BASE_URL}/pornstars`,
          `${BASE_URL}/partners`,
          ...[
            'desi',
            'indian',
            'bhabhi',
            'hindi',
            'mms',
            'south-indian',
            'tamil',
            'telugu',
            'mallu',
            'punjabi',
          ].map((c) => `${BASE_URL}/category/${c}`),
        ].map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>`)
      : [];

  const videoUrls = chunk.map(
    (v) =>
      `  <url><loc>${BASE_URL}/watch/${encodeURIComponent(v.id)}</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...videoUrls].join('\n')}\n</urlset>`;
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
