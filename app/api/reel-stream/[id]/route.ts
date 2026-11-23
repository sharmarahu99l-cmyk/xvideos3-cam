import { NextRequest, NextResponse } from 'next/server';

const EMBED_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: 'https://www.eporner.com/',
};

// In-memory cache of resolved MP4 URLs (1 hour TTL)
const resolvedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function convertBase36Hash(hexHash: string): string {
  if (!/^[a-f0-9]{32}$/i.test(hexHash)) return hexHash;
  let out = '';
  for (let i = 0; i < 32; i += 8) {
    const chunk = parseInt(hexHash.slice(i, i + 8), 16);
    out += chunk.toString(36);
  }
  return out;
}

async function resolveEpornerMp4Url(videoId: string): Promise<string | null> {
  const now = Date.now();
  const cached = resolvedUrlCache.get(videoId);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  try {
    const embedRes = await fetch(
      `https://www.eporner.com/embed/${encodeURIComponent(videoId)}/`,
      { headers: EMBED_HEADERS, cache: 'no-store' }
    );
    if (!embedRes.ok) return null;

    const html = await embedRes.text();

    // 1. Check direct MP4 in embed HTML
    const directMatch = html.match(/https?:\/\/[^"'\\\s]+\.mp4[^"'\\\s]*/i);
    if (directMatch?.[0]) {
      const cleanUrl = directMatch[0].replace(/&amp;/g, '&');
      resolvedUrlCache.set(videoId, { url: cleanUrl, expiresAt: now + 3600_000 });
      return cleanUrl;
    }

    // 2. Extract 32-char hex hash and query Eporner's XHR video source endpoint
    const hashMatch =
      html.match(/hash\s*[:=]\s*['"]([a-f0-9]{32})['"]/i) ||
      html.match(/vid\s*[:=]\s*['"][^'"]+['"][\s\S]{0,250}?hash\s*[:=]\s*['"]([a-f0-9]{32})['"]/i);

    if (hashMatch?.[1]) {
      const encodedHash = convertBase36Hash(hashMatch[1]);
      const xhrUrl = `https://www.eporner.com/xhr/video/${encodeURIComponent(
        videoId
      )}?hash=${encodeURIComponent(
        encodedHash
      )}&device=generic&domain=www.eporner.com&fallback=false&embed=true&supportedFormats=mp4`;

      const xhrRes = await fetch(xhrUrl, {
        headers: {
          ...EMBED_HEADERS,
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
      });

      if (xhrRes.ok) {
        const json = await xhrRes.json();
        const mp4Sources = json?.sources?.mp4;
        if (mp4Sources && typeof mp4Sources === 'object') {
          // Prefer fast-loading 480p/720p first for instant Reel autoplay
          const order = ['480p', '720p', '360p', '1080p', '240p'];
          for (const q of order) {
            const src = mp4Sources[q]?.src;
            if (typeof src === 'string' && src.startsWith('http')) {
              resolvedUrlCache.set(videoId, { url: src, expiresAt: now + 3600_000 });
              return src;
            }
          }
          for (const entry of Object.values(mp4Sources) as Array<{ src?: string }>) {
            if (entry?.src && entry.src.startsWith('http')) {
              resolvedUrlCache.set(videoId, { url: entry.src, expiresAt: now + 3600_000 });
              return entry.src;
            }
          }
        }
      }
    }
  } catch {}

  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id || '').trim();
  if (!cleanId) {
    return new NextResponse('Missing video id', { status: 400 });
  }

  let mp4Url = await resolveEpornerMp4Url(cleanId);
  if (!mp4Url) {
    return new NextResponse('Stream unavailable', { status: 404 });
  }

  const rangeHeader = req.headers.get('range');
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': EMBED_HEADERS['User-Agent'],
    Referer: 'https://www.eporner.com/',
  };
  if (rangeHeader) {
    upstreamHeaders['Range'] = rangeHeader;
  }

  let videoRes = await fetch(mp4Url, { headers: upstreamHeaders, cache: 'no-store' });

  // If cached URL expired, re-resolve once
  if (videoRes.status === 403 || videoRes.status === 410) {
    resolvedUrlCache.delete(cleanId);
    mp4Url = await resolveEpornerMp4Url(cleanId);
    if (!mp4Url) {
      return new NextResponse('Stream expired', { status: 404 });
    }
    videoRes = await fetch(mp4Url, { headers: upstreamHeaders, cache: 'no-store' });
  }

  if (!videoRes.ok && videoRes.status !== 206) {
    return new NextResponse('Upstream error', { status: videoRes.status });
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', videoRes.headers.get('content-type') || 'video/mp4');
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Cache-Control', 'public, max-age=3600');

  const contentLength = videoRes.headers.get('content-length');
  if (contentLength) responseHeaders.set('Content-Length', contentLength);

  const contentRange = videoRes.headers.get('content-range');
  if (contentRange) responseHeaders.set('Content-Range', contentRange);

  return new NextResponse(videoRes.body, {
    status: videoRes.status,
    headers: responseHeaders,
  });
}