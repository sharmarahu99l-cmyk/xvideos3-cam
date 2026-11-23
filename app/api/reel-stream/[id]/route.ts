import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const mp4Cache = new Map<string, { url: string; referer: string; expiresAt: number }>();

function pickBestMp4FromDefinitions(
  defs: Array<{ format?: string; quality?: string | number; videoUrl?: string }>
): string | null {
  const mp4s = defs.filter(
    (d) =>
      d &&
      (d.format === 'mp4' || String(d.videoUrl || '').includes('.mp4')) &&
      typeof d.videoUrl === 'string' &&
      d.videoUrl.startsWith('http')
  );
  if (mp4s.length === 0) return null;

  // Prefer fast mobile/HD 480p or 720p first so Reels start playing immediately
  const preferredQualities = ['480', '720', '360', '240', '1080'];
  for (const q of preferredQualities) {
    const match = mp4s.find((d) => String(d.quality || '').includes(q));
    if (match?.videoUrl) return match.videoUrl.replace(/\\\//g, '/');
  }
  return mp4s[0].videoUrl!.replace(/\\\//g, '/');
}

async function resolveRedTubeMp4(rawId: string): Promise<{ url: string; referer: string } | null> {
  const cleanNum = rawId.replace(/^rt_/, '');
  const pageUrl = `https://www.redtube.com/${encodeURIComponent(cleanNum)}`;

  try {
    const res = await fetch(pageUrl, {
      headers: { ...BROWSER_HEADERS, Referer: 'https://www.redtube.com/' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract mediaDefinitions JSON array
    const defsMatch = html.match(/mediaDefinitions\s*[:=]\s*(\[[\s\S]*?\])\s*[,;]/);
    if (defsMatch?.[1]) {
      try {
        const parsed = JSON.parse(defsMatch[1]);
        if (Array.isArray(parsed)) {
          const picked = pickBestMp4FromDefinitions(parsed);
          if (picked) {
            return { url: picked, referer: 'https://www.redtube.com/' };
          }
        }
      } catch {}
    }

    // Fallback regex for escaped videoUrl
    const urlMatches = html.match(/"videoUrl"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/gi);
    if (urlMatches && urlMatches.length > 0) {
      for (const m of urlMatches) {
        const inner = m.match(/"(https?:[^"]+)"/i)?.[1];
        if (inner) {
          return {
            url: inner.replace(/\\\//g, '/').replace(/\\u0026/g, '&'),
            referer: 'https://www.redtube.com/',
          };
        }
      }
    }
  } catch {}

  return null;
}

async function resolvePornhubMp4(rawId: string): Promise<{ url: string; referer: string } | null> {
  const viewkey = rawId.replace(/^ph_/, '');
  const pageUrl = `https://www.pornhub.com/view_video.php?viewkey=${encodeURIComponent(viewkey)}`;

  try {
    const res = await fetch(pageUrl, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: 'https://www.pornhub.com/',
        Cookie: 'accessAgeDisclaimerPH=1; accessAgeDisclaimerUK=1',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();

    const defsMatch = html.match(/"mediaDefinitions"\s*:\s*(\[[\s\S]*?\])\s*,/);
    if (defsMatch?.[1]) {
      try {
        const parsed = JSON.parse(defsMatch[1]);
        if (Array.isArray(parsed)) {
          // Check if videoUrl is a direct MP4 or a get_media JSON endpoint
          const direct = pickBestMp4FromDefinitions(parsed);
          if (direct && direct.includes('.mp4')) {
            return { url: direct, referer: 'https://www.pornhub.com/' };
          }
          const mediaApiEntry = parsed.find(
            (d: { format?: string; videoUrl?: string }) =>
              d?.format === 'mp4' && typeof d?.videoUrl === 'string' && d.videoUrl.includes('get_media')
          );
          if (mediaApiEntry?.videoUrl) {
            const apiRes = await fetch(mediaApiEntry.videoUrl.replace(/\\\//g, '/'), {
              headers: {
                ...BROWSER_HEADERS,
                Referer: pageUrl,
                'X-Requested-With': 'XMLHttpRequest',
              },
              cache: 'no-store',
            });
            if (apiRes.ok) {
              const mediaList = await apiRes.json();
              if (Array.isArray(mediaList)) {
                const resolved = pickBestMp4FromDefinitions(mediaList);
                if (resolved) {
                  return { url: resolved, referer: 'https://www.pornhub.com/' };
                }
              }
            }
          }
        }
      } catch {}
    }
  } catch {}

  return null;
}

async function resolveStream(id: string): Promise<{ url: string; referer: string } | null> {
  const now = Date.now();
  const cached = mp4Cache.get(id);
  if (cached && cached.expiresAt > now) {
    return { url: cached.url, referer: cached.referer };
  }

  let resolved: { url: string; referer: string } | null = null;
  if (id.startsWith('ph_')) {
    resolved = await resolvePornhubMp4(id);
  } else {
    resolved = await resolveRedTubeMp4(id);
  }

  if (resolved) {
    mp4Cache.set(id, { ...resolved, expiresAt: now + 3600_000 });
  }
  return resolved;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id || '').trim();
  if (!cleanId) {
    return new NextResponse('Missing id', { status: 400 });
  }

  let target = await resolveStream(cleanId);
  if (!target) {
    return new NextResponse('Stream not found', { status: 404 });
  }

  const rangeHeader = req.headers.get('range');
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': BROWSER_HEADERS['User-Agent'],
    Referer: target.referer,
  };
  if (rangeHeader) {
    upstreamHeaders['Range'] = rangeHeader;
  }

  let upstreamRes = await fetch(target.url, { headers: upstreamHeaders, cache: 'no-store' });

  if (upstreamRes.status === 403 || upstreamRes.status === 410) {
    mp4Cache.delete(cleanId);
    target = await resolveStream(cleanId);
    if (!target) {
      return new NextResponse('Stream expired', { status: 404 });
    }
    upstreamRes = await fetch(target.url, { headers: upstreamHeaders, cache: 'no-store' });
  }

  if (!upstreamRes.ok && upstreamRes.status !== 206) {
    return new NextResponse('Upstream stream error', { status: upstreamRes.status });
  }

  const headers = new Headers();
  headers.set('Content-Type', upstreamRes.headers.get('content-type') || 'video/mp4');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=3600');

  const len = upstreamRes.headers.get('content-length');
  if (len) headers.set('Content-Length', len);

  const range = upstreamRes.headers.get('content-range');
  if (range) headers.set('Content-Range', range);

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers,
  });
}