import { NextResponse } from 'next/server';

interface EpornerThumb {
  src?: string;
  width?: number;
  height?: number;
}

interface EpornerRawVideo {
  id?: string;
  title?: string;
  default_thumb?: { src?: string };
  thumbs?: EpornerThumb[];
  length_min?: number;
  length_sec?: number;
  embed?: string;
  views?: string | number;
  keywords?: string;
  added?: string;
}

function isValidPlayableVideo(v: EpornerRawVideo): boolean {
  if (!v?.id || !v?.title) return false;
  const thumb = v.default_thumb?.src?.trim() || '';
  if (!thumb || !thumb.startsWith('http') || thumb.includes('no-thumb') || thumb.includes('placeholder')) {
    return false;
  }
  const totalSeconds = (Number(v.length_min) || 0) * 60 + (Number(v.length_sec) || 0);
  if (totalSeconds <= 5) return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || 'desi';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(60, Math.max(10, Number(searchParams.get('per_page')) || 30));
  const order = searchParams.get('order') || 'most_viewed';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&order=${encodeURIComponent(order)}&thumbsize=big&format=json`,
      {
        signal: controller.signal,
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );

    if (res.ok) {
      const data: { videos?: EpornerRawVideo[] } = await res.json();
      const raw = Array.isArray(data.videos) ? data.videos : [];
      const cleanVideos = raw.filter(isValidPlayableVideo);

      return NextResponse.json(cleanVideos, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
      });
    }
  } catch {
    // Return empty array on timeout/network failure
  } finally {
    clearTimeout(timer);
  }

  return NextResponse.json([]);
}
