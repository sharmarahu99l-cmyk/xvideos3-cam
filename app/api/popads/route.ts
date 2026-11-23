import { NextResponse } from 'next/server';

export const revalidate = 3600;

const POPADS_KEY = process.env.POPADS_API_KEY || '1a7fb4133a1e00cb7bd75b3ea128c58d42e9e3e4';
const POPADS_SITE_ID = '5327899';

let cachedScript = '';
let cachedAt = 0;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour cache matching popads.php

function extractJsFromHtml(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // PopAds API returns <script type="text/javascript" data-cfasync="false">...</script>
  const match = trimmed.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  if (!trimmed.startsWith('<')) {
    return trimmed;
  }
  return '';
}

async function fetchPopAdsEndpoint(antiAdblock: boolean): Promise<string> {
  const params = new URLSearchParams({
    key: POPADS_KEY,
    website_id: POPADS_SITE_ID,
    tl: 'auto',
    of: '1',
  });
  if (antiAdblock) {
    params.set('aab', '1');
  }

  try {
    const res = await fetch(`https://www.popads.net/api/website_code?${params.toString()}`, {
      headers: {
        Accept: 'text/plain,application/json;q=0.9',
        'User-Agent': 'PopAds CGAPIL2 NextJS',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return '';
    const text = await res.text();
    if (text.includes('<script') || text.includes('_pop')) {
      return extractJsFromHtml(text);
    }
  } catch {}

  return '';
}

export async function GET() {
  const now = Date.now();
  if (cachedScript && now - cachedAt < CACHE_TTL_MS) {
    return new NextResponse(cachedScript, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }

  // 1. Try Anti-Adblock code first (tl=auto&aab=1&of=1)
  let jsCode = await fetchPopAdsEndpoint(true);

  // 2. Fallback to Standard code if Anti-Adblock endpoint failed (tl=auto&of=1)
  if (!jsCode) {
    jsCode = await fetchPopAdsEndpoint(false);
  }

  if (jsCode) {
    cachedScript = jsCode;
    cachedAt = now;
  }

  return new NextResponse(jsCode || '/* PopAds unavailable */', {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}