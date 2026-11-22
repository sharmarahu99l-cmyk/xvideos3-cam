import { NextResponse } from 'next/server';

interface EpornerVideo {
  id?: string;
  title?: string;
  default_thumb?: { src?: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min?: number;
  length_sec?: number;
  embed?: string;
  views?: string | number;
  keywords?: string;
  added?: string;
}

function isPlayable(v: EpornerVideo): boolean {
  if (!v?.id || !v?.title) return false;
  const thumb = v.default_thumb?.src?.trim() || '';
  if (!thumb.startsWith('http') || thumb.includes('no-thumb') || thumb.includes('placeholder')) {
    return false;
  }
  const secs = (Number(v.length_min) || 0) * 60 + (Number(v.length_sec) || 0);
  return secs > 5;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || 'desi';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(60, Math.max(10, Number(searchParams.get('per_page')) || 30));
  const order = searchParams.get('order') || 'most_viewed';

  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&order=${encodeURIComponent(order)}&thumbsize=big&format=json`,
      {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );

    if (res.ok) {
      const data: { videos?: EpornerVideo[] } = await res.json();
      const videos = Array.isArray(data.videos) ? data.videos.filter(isPlayable) : [];
      return NextResponse.json(videos, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
      });
    }
  } catch {
    // Return empty array so client fallback triggers
  }

  return NextResponse.json([]);
}
