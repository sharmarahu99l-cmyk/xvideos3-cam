import { NextRequest, NextResponse } from 'next/server';
import { getHourlyKeywordFeed } from '../../../lib/keywordFeed';

export const revalidate = 3600;

export interface ReelItem {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: string | number;
  length_sec?: number | string;
  views?: string | number;
  keywords?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = (searchParams.get('q') || '').trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const orderingParam = searchParams.get('order') || 'latest';

  const order =
    orderingParam === 'rating' || orderingParam === 'top-rated'
      ? 'top-rated'
      : orderingParam === 'mostviewed' || orderingParam === 'most-popular'
      ? 'most-popular'
      : 'latest';

  // Default Reels feed ('', 'desi', 'reels'): strictly disjoint hourly keyword + xHamster feed
  if (!rawQuery || rawQuery === 'desi' || rawQuery === 'reels') {
    const items = await getHourlyKeywordFeed('reels', page, 18, order);
    const out: ReelItem[] = items.map((v) => ({
      id: v.id,
      title: v.title,
      default_thumb: v.default_thumb,
      length_min: v.length_min,
      length_sec: v.length_sec,
      views: v.views ?? 0,
      keywords: v.keywords || 'indian sex reels, desi sex reels',
    }));

    return NextResponse.json(out, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  // Specific topic filter inside Reels player
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      rawQuery
    )}&per_page=18&page=${page}&order=${encodeURIComponent(order)}&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'public, s-maxage=300' } });
    }

    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];
    const out: ReelItem[] = [];

    for (const v of list) {
      const vidId = String(v?.id || '').trim();
      const title = String(v?.title || '').trim();
      const thumb = String(v?.default_thumb?.src || '').trim();
      if (!vidId || !title || !thumb.startsWith('http')) continue;

      out.push({
        id: vidId,
        title,
        default_thumb: { src: thumb },
        length_min: v?.length_min,
        length_sec: v?.length_sec,
        views: v?.views ?? 0,
        keywords: typeof v?.keywords === 'string' ? v.keywords : '',
      });
    }

    return NextResponse.json(out, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'public, s-maxage=300' } });
  }
}
