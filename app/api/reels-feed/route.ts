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

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

function parseDurationToSec(dur?: string): number {
  if (!dur) return 0;
  const parts = dur.split(':').map((n) => Number(n) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(dur) || 0;
}

async function fetchFromRedTube(
  query: string,
  page: number,
  ordering: 'mostviewed' | 'newest' | 'rating'
): Promise<ReelItem[]> {
  try {
    const url = `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(
      query
    )}&thumbsize=big&ordering=${ordering}&page=${page}`;

    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
    if (!res.ok) return [];
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
        ? v.tags.map((t: { tag_name?: string } | string) =>
            typeof t === 'string' ? t : t?.tag_name || ''
          ).filter(Boolean).join(', ')
        : '';

      out.push({
        id: `rt_${vidId}`,
        title,
        default_thumb: { src: thumb },
        length_min: v?.duration || '0:30',
        length_sec: parseDurationToSec(v?.duration),
        views: v?.views ?? 0,
        keywords: tags,
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchFromPornhub(query: string, page: number): Promise<ReelItem[]> {
  try {
    const url = `https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(
      query
    )}&page=${page}&thumbsize=large`;

    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];

    const out: ReelItem[] = [];
    for (const v of list) {
      const vkey = String(v?.video_id || '').trim();
      const title = String(v?.title || '').trim();
      const thumb = String(v?.default_thumb || v?.thumb || '').trim();
      if (!vkey || !title || !thumb.startsWith('http')) continue;

      const tags = Array.isArray(v?.tags)
        ? v.tags.map((t: { tag_name?: string } | string) =>
            typeof t === 'string' ? t : t?.tag_name || ''
          ).filter(Boolean).join(', ')
        : '';

      out.push({
        id: `ph_${vkey}`,
        title,
        default_thumb: { src: thumb },
        length_min: v?.duration || '0:30',
        length_sec: parseDurationToSec(v?.duration),
        views: v?.views ?? 0,
        keywords: tags,
      });
    }
    return out;
  } catch {
    return [];
  }
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

  const [rtVideos, phVideos] = await Promise.all([
    fetchFromRedTube(query, page, ordering),
    fetchFromPornhub(query, page),
  ]);

  // Interleave RedTube + Pornhub results for maximum variety
  const merged: ReelItem[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(rtVideos.length, phVideos.length);

  for (let i = 0; i < maxLen; i++) {
    for (const item of [rtVideos[i], phVideos[i]]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
  }

  return NextResponse.json(merged, {
    headers: { 'Cache-Control': 'no-store' },
  });
}