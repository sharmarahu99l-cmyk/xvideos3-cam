import { NextResponse } from 'next/server';

interface RedtubeVideo {
  video_id?: string;
  title?: string;
  thumb?: string;
  default_thumb?: string;
  duration?: string;
  views?: string | number;
}

interface RedtubeItem extends RedtubeVideo {
  video?: RedtubeVideo;
}

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36' },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(60, Math.max(10, Number(searchParams.get('per_page')) || 30));
  const order = searchParams.get('order') || 'most_viewed';

  if (!q) return NextResponse.json([]);

  try {
    const res = await fetchWithTimeout(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&order=${encodeURIComponent(order)}&format=json`
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.videos) && data.videos.length > 0) {
        return NextResponse.json(data.videos, {
          headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
        });
      }
    }
  } catch {
    // Fallback to RedTube
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(q)}&page=${page}`
    );

    if (res.ok) {
      const data = await res.json();
      const raw: RedtubeItem[] = Array.isArray(data.videos) ? data.videos : [];
      const mapped = raw
        .map((item) => {
          const v: RedtubeVideo = item.video ?? item;
          const parts = (v.duration || '0:0').split(':');
          return {
            id: String(v.video_id || ''),
            title: v.title || 'HD Video',
            default_thumb: { src: v.thumb || v.default_thumb || '' },
            length_min: parseInt(parts[0] || '0', 10) || 0,
            length_sec: parseInt(parts[1] || '0', 10) || 0,
            embed: `https://embed.redtube.com/?id=${v.video_id}`,
            views: String(v.views || '0'),
          };
        })
        .filter((v) => Boolean(v.id));

      return NextResponse.json(mapped, {
        headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
      });
    }
  } catch {
    // Return empty array on failure
  }

  return NextResponse.json([]);
}
