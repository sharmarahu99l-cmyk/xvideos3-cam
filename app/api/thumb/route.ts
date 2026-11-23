import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 86400;

async function fetchOneThumb(term: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        term
      )}&per_page=3&page=1&order=most-popular&lq=0&thumbsize=big&format=json`,
      {
        next: { revalidate: 86400 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    for (const v of videos) {
      const src = v?.default_thumb?.src?.trim() || '';
      if (src.startsWith('http')) return src;
    }
  } catch {}
  return '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('items') || '';
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);

  if (items.length === 0) {
    return NextResponse.json({});
  }

  const results = await Promise.all(
    items.map(async (item) => [item, await fetchOneThumb(item)] as const)
  );

  const map: Record<string, string> = {};
  for (const [k, v] of results) {
    if (v) map[k] = v;
  }

  return NextResponse.json(map, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}