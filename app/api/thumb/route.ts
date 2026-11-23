import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 86400;

const QUERY_OVERRIDES: Record<string, string> = {
  '1080p hd': '1080p',
  '4k ultra hd': '4k',
  '60 fps': '60fps',
  'indian porn 1080p': 'indian',
  'viral desi mms': 'desi mms',
  'new desi videos': 'desi',
  'desi videos': 'desi',
  'desi porn': 'desi',
  'pakistani leaked mms': 'pakistani',
  'pakistani mms': 'pakistani',
  'desi college girl mms': 'desi college',
  'bengali bhabhi mms': 'bengali bhabhi',
  'tamil desi mms': 'tamil desi',
  'telugu desi videos': 'telugu',
  'mallu aunty homemade': 'mallu aunty',
  'indian homemade uncut': 'indian homemade',
  'desi leaked scandal': 'desi',
  'bhabhi devar romance': 'bhabhi devar',
  'punjabi kudi viral': 'punjabi',
  'solo girl': 'solo',
  'full movie': 'full',
  'top rated': 'hd',
};

function normalizeSearchTerm(label: string): string {
  const lower = label.toLowerCase().trim();
  if (QUERY_OVERRIDES[lower]) return QUERY_OVERRIDES[lower];
  return lower.replace(/\b(videos|porn|1080p|ultra hd|hd)\b/g, '').replace(/\s+/g, ' ').trim() || lower;
}

async function queryEpornerThumb(searchQuery: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        searchQuery
      )}&per_page=5&page=1&order=most-popular&thumbsize=big&format=json`,
      {
        next: { revalidate: 86400 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    for (const v of videos) {
      const src = v?.default_thumb?.src?.trim() || '';
      if (src.startsWith('http')) return src;
    }
  } catch {}
  return '';
}

async function fetchRelevantThumb(label: string): Promise<string> {
  const primary = normalizeSearchTerm(label);
  const firstHit = await queryEpornerThumb(primary);
  if (firstHit) return firstHit;

  // Fallback to first 2 words of the category/name if full phrase had no exact match
  const shortTerm = primary.split(' ').slice(0, 2).join(' ');
  if (shortTerm && shortTerm !== primary) {
    const secondHit = await queryEpornerThumb(shortTerm);
    if (secondHit) return secondHit;
  }

  return '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('items') || '';
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);

  if (items.length === 0) {
    return NextResponse.json({});
  }

  const map: Record<string, string> = {};
  const concurrency = 6;

  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    const results = await Promise.all(
      slice.map(async (item) => [item, await fetchRelevantThumb(item)] as const)
    );
    for (const [k, v] of results) {
      if (v) map[k] = v;
    }
  }

  return NextResponse.json(map, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}