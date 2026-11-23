import { NextResponse } from 'next/server';

export const revalidate = 3600;

const POPADS_KEY = process.env.POPADS_API_KEY || '1a7fb4133a1e00cb7bd75b3ea128c58d42e9e3e4';
const POPADS_SITE_ID = '5327899';

let cachedHtml = '';
let cachedAt = 0;
const CACHE_TTL_MS = 3600 * 1000;

async function fetchPopAdsCode(antiAdblock: boolean): Promise<string> {
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
        'User-Agent': 'PopAds CGAPIL2 A',
      },
      cache: 'no-store',
    });
    if (!res.ok) return '';
    const text = await res.text();
    if (text && text.includes('<script')) {
      return text.trim();
    }
  } catch {}

  return '';
}

export async function GET() {
  const now = Date.now();
  if (cachedHtml && now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(
      { code: cachedHtml },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  }

  // 1. Try Anti-Adblock endpoint (tl=auto&aab=1&of=1)
  let code = await fetchPopAdsCode(true);

  // 2. Fallback to Standard endpoint (tl=auto&of=1)
  if (!code) {
    code = await fetchPopAdsCode(false);
  }

  if (code) {
    cachedHtml = code;
    cachedAt = now;
  }

  return NextResponse.json(
    { code: code || '' },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
  );
}