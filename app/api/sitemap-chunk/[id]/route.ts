import { NextRequest, NextResponse } from 'next/server';

const CHUNK_QUERIES = [
  'desi', 'mms', 'desi bhabhi', 'indian', 'amateur',
  '4k', 'homemade', 'milf', 'big tits', 'asian',
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chunkNum = Math.min(20, Math.max(1, Number(id) || 1));
  const query = CHUNK_QUERIES[(chunkNum - 1) % CHUNK_QUERIES.length];
  const apiPage = Math.ceil(chunkNum / CHUNK_QUERIES.length);
  let urlsXml = '';

  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        query
      )}&per_page=50&page=${apiPage}&order=most-popular&lq=0&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.videos)) {
        urlsXml = data.videos
          .filter((v: { id?: string }) => v?.id)
          .map(
            (v: { id: string }) =>
              `<url><loc>https://indiansexvideo.tv/watch/${encodeURIComponent(v.id)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
          )
          .join('');
      }
    }
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}</urlset>`;
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}