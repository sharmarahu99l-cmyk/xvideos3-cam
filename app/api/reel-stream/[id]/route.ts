import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Referer: 'https://www.eporner.com/',
};

function convertBase36Hash(hexHash: string): string {
  // Eporner converts 32-char hex MD5 hash into 4 8-char chunks in base36
  if (!/^[a-f0-9]{32}$/i.test(hexHash)) return hexHash;
  let out = '';
  for (let i = 0; i < 32; i += 8) {
    const chunk = parseInt(hexHash.slice(i, i + 8), 16);
    out += chunk.toString(36);
  }
  return out;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id || '').trim();
  if (!cleanId) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  try {
    const embedRes = await fetch(
      `https://www.eporner.com/embed/${encodeURIComponent(cleanId)}/`,
      {
        headers: HEADERS,
        next: { revalidate: 3600 },
      }
    );

    if (!embedRes.ok) {
      return NextResponse.json({ url: null }, { status: 404 });
    }

    const html = await embedRes.text();

    // 1. Check if direct MP4 URL is already embedded in the HTML
    const directMp4Match = html.match(/https?:\/\/[^"'\\\s]+\.mp4[^"'\\\s]*/i);
    if (directMp4Match?.[0]) {
      return NextResponse.json(
        { url: directMp4Match[0].replace(/&amp;/g, '&') },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
      );
    }

    // 2. Extract video hash and query Eporner's XHR MP4 source endpoint
    const hashMatch =
      html.match(/hash\s*[:=]\s*['"]([a-f0-9]{32})['"]/i) ||
      html.match(/vid\s*[:=]\s*['"][^'"]+['"][\s\S]{0,200}?hash\s*[:=]\s*['"]([a-f0-9]{32})['"]/i);

    if (hashMatch?.[1]) {
      const encodedHash = convertBase36Hash(hashMatch[1]);
      const xhrUrl = `https://www.eporner.com/xhr/video/${encodeURIComponent(
        cleanId
      )}?hash=${encodeURIComponent(
        encodedHash
      )}&device=generic&domain=www.eporner.com&fallback=false&embed=true&supportedFormats=mp4`;

      const xhrRes = await fetch(xhrUrl, {
        headers: {
          ...HEADERS,
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
        next: { revalidate: 3600 },
      });

      if (xhrRes.ok) {
        const json = await xhrRes.json();
        const mp4Sources = json?.sources?.mp4;
        if (mp4Sources && typeof mp4Sources === 'object') {
          // Prefer fast mobile/HD qualities first for instant Reel startup
          const preferredOrder = ['720p', '480p', '1080p', '360p', '240p'];
          for (const q of preferredOrder) {
            const src = mp4Sources[q]?.src;
            if (typeof src === 'string' && src.startsWith('http')) {
              return NextResponse.json(
                { url: src },
                {
                  headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
                  },
                }
              );
            }
          }
          // Fallback to any available MP4 key
          for (const entry of Object.values(mp4Sources) as Array<{ src?: string }>) {
            if (entry?.src && entry.src.startsWith('http')) {
              return NextResponse.json(
                { url: entry.src },
                {
                  headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
                  },
                }
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ url: null }, { status: 404 });
  } catch {
    return NextResponse.json({ url: null }, { status: 500 });
  }
}