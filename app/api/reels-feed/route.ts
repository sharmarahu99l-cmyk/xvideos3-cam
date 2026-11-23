import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface ReelItem {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: string;
  length_sec?: number;
  views?: string | number;
  keywords?: string;
}

function parseDurationToSec(dur?: string): number {
  if (!dur) return 0;
  const parts = dur.split(':').map((n) => Number(n) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(dur) || 0;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || 'desi').trim();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const orderingParam = searchParams.get('order') || 'mostviewed';
  const ordering: 'mostviewed' | 'newest' | 'rating' =
    orderingParam === 'newest'
      ? 'newest'
      : orderingParam === 'rating'
      ? 'rating'
      : 'mostviewed';

  try {
    const url = `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(
      query
    )}&thumbsize=big&ordering=${ordering}&page=${page}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];
    const out: ReelItem[] = [];

    for (const entry of list) {
      const v = entry?.video || entry;
      const vidId = String(v?.video_id || '').trim();
      const title = String(v?.title || '').trim();
      const thumb = String(v?.default_thumb || v?.thumb || '').trim();
      if (!vidId || !title || !thumb.startsWith('http')) continue;

      const tags = Array.isArray(v?.tags)
        ? v.tags
            .map((t: { tag_name?: string } | string) =>
              typeof t === 'string' ? t : t?.tag_name || ''
            )
            .filter(Boolean)
            .join(', ')
        : '';

      out.push({
        id: vidId,
        title,
        default_thumb: { src: thumb },
        length_min: v?.duration || '0:30',
        length_sec: parseDurationToSec(v?.duration),
        views: v?.views ?? 0,
        keywords: tags,
      });
    }

    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}