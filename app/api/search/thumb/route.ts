import { NextRequest, NextResponse } from 'next/server';

interface EpornerVideo {
  title?: string;
  default_thumb?: { src?: string };
}

interface RedtubeItem {
  video?: {
    title?: string;
    thumb?: string;
    default_thumb?: string;
  };
}

interface PornhubVideo {
  title?: string;
  thumb?: string;
  default_thumb?: string;
}

async function fetchWithTimeout(url: string, ms = 4500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function getFromEporner(q: string, isStar: boolean): Promise<string[]> {
  try {
    const order = isStar ? 'most-popular' : 'top-rated';
    const res = await fetchWithTimeout(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=10&thumbsize=big&order=${order}&format=json`
    );
    if (!res.ok) return [];
    const data: { videos?: EpornerVideo[] } = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const lowerQ = q.toLowerCase();

    const sorted = isStar
      ? [...videos].sort((a, b) => {
          const aMatch = a.title?.toLowerCase().includes(lowerQ) ? 1 : 0;
          const bMatch = b.title?.toLowerCase().includes(lowerQ) ? 1 : 0;
          return bMatch - aMatch;
        })
      : videos;

    return sorted
      .map((v) => v.default_thumb?.src)
      .filter((src): src is string => typeof src === 'string' && src.startsWith('http'));
  } catch {
    return [];
  }
}

async function getFromRedtube(q: string, isStar: boolean): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(q)}&thumbsize=big`
    );
    if (!res.ok) return [];
    const data: { videos?: RedtubeItem[] } = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const lowerQ = q.toLowerCase();

    const sorted = isStar
      ? [...videos].sort((a, b) => {
          const aMatch = a.video?.title?.toLowerCase().includes(lowerQ) ? 1 : 0;
          const bMatch = b.video?.title?.toLowerCase().includes(lowerQ) ? 1 : 0;
          return bMatch - aMatch;
        })
      : videos;

    return sorted
      .map((v) => v.video?.thumb || v.video?.default_thumb)
      .filter((src): src is string => typeof src === 'string' && src.startsWith('http'));
  } catch {
    return [];
  }
}

async function getFromPornhub(q: string, isStar: boolean): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      `https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(q)}&thumbsize=large_hd`
    );
    if (!res.ok) return [];
    const data: { videos?: PornhubVideo[] } = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const lowerQ = q.toLowerCase();

    const sorted = isStar
      ? [...videos].sort((a, b) => {
          const aMatch = a.title?.toLowerCase().includes(lowerQ) ? 1 : 0;
          const bMatch = b.title?.toLowerCase().includes(lowerQ) ? 1 : 0;
          return bMatch - aMatch;
        })
      : videos;

    return sorted
      .map((v) => v.thumb || v.default_thumb)
      .filter((src): src is string => typeof src === 'string' && src.startsWith('http'));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const type = req.nextUrl.searchParams.get('type') || 'category';
  const isStar = type === 'star';

  if (!q) {
    return NextResponse.json({ thumbs: [] }, { status: 400 });
  }

  let thumbs = await getFromEporner(q, isStar);
  if (thumbs.length === 0) {
    thumbs = await getFromRedtube(q, isStar);
  }
  if (thumbs.length === 0) {
    thumbs = await getFromPornhub(q, isStar);
  }

  return NextResponse.json(
    { thumbs: thumbs.slice(0, 8) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
