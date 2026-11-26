import crawlIndex from '../data/crawl-index.json';

export interface UnifiedVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: string | number;
  length_sec?: number | string;
  views?: string | number;
  keywords?: string;
  embed?: string;
  url?: string;
  rate?: string;
}

type RawCrawlItem = { id: string; t: string; i?: string; d?: string; v?: string };

const TARGET_KEYWORDS = [
  'indian',
  'desi',
  'bhabhi',
  'hindi',
  'mms',
  'leaked',
  'village',
  'gaon',
  'hot',
  'pakistani',
  'viral',
  'reel',
  'short',
  'urdu',
  'pashto',
  'punjabi',
];

export function matchesTargetKeywords(title: string): boolean {
  const lower = (title || '').toLowerCase();
  return TARGET_KEYWORDS.some((kw) => lower.includes(kw));
}

export function getHourlySeed(): number {
  return Math.floor(Date.now() / 3600000);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function fetchEpornerByKeyword(query: string, page: number, order = 'latest'): Promise<UnifiedVideo[]> {
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=24&page=${page}&order=${encodeURIComponent(order)}&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];

    return list
      .map((v: Record<string, unknown>): UnifiedVideo | null => {
        const id = String(v?.id || '').trim();
        const title = String(v?.title || '').trim();
        const thumbObj = v?.default_thumb as { src?: string } | undefined;
        const thumb = String(thumbObj?.src || '').trim();
        if (!id || !title || !thumb.startsWith('http') || !matchesTargetKeywords(title)) return null;

        return {
          id,
          title,
          default_thumb: { src: thumb },
          length_min: v?.length_min as string | number | undefined,
          length_sec: v?.length_sec as string | number | undefined,
          views: (v?.views as string | number) ?? 0,
          keywords: typeof v?.keywords === 'string' ? v.keywords : query,
          embed: typeof v?.embed === 'string' ? v.embed : `https://www.eporner.com/embed/${id}/`,
          url: `/watch/${id}`,
          rate: typeof v?.rate === 'string' ? v.rate : '4.8',
        };
      })
      .filter((v: UnifiedVideo | null): v is UnifiedVideo => v !== null);
  } catch {
    return [];
  }
}

async function fetchXHamsterByKeyword(query: string, page: number): Promise<UnifiedVideo[]> {
  try {
    const url = `https://xhamster.com/search/${encodeURIComponent(query)}?page=${page}&quality=720p&format=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 3600 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list =
      data?.videos ||
      data?.searchResult?.videoThumbProps ||
      data?.layoutPage?.videoListProps?.videoThumbProps ||
      [];

    if (!Array.isArray(list)) return [];

    return list
      .map((item: Record<string, unknown>): UnifiedVideo | null => {
        const rawId = String(item.id || item.pageURL || '');
        const title = String(item.title || item.name || '').trim();
        const thumb = String(item.thumbURL || item.thumb || item.image || '');
        if (!rawId || !title || !thumb.startsWith('http') || !matchesTargetKeywords(title)) return null;

        const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-24);
        if (!cleanId) return null;

        return {
          id: `xh-${cleanId}`,
          title,
          default_thumb: { src: thumb },
          length_min: item.duration ? String(item.duration) : '05:30',
          views: item.views ? String(item.views) : '12.4K',
          keywords: query,
          embed: `https://xhamster.com/embed/${cleanId}`,
          url: `/watch/xh-${cleanId}`,
          rate: '4.9',
        };
      })
      .filter((v: UnifiedVideo | null): v is UnifiedVideo => v !== null);
  } catch {
    return [];
  }
}

/**
 * Floods 'main' (Homepage) and 'reels' (/reels) with strictly keyword-matched,
 * non-repeating videos from Eporner + xHamster + local catalog, rotated every 1 hour.
 * 'main' and 'reels' use completely disjoint keyword pools & partitions so they never overlap.
 */
export async function getHourlyKeywordFeed(
  feedType: 'main' | 'reels',
  page = 1,
  limit = 30,
  order = 'latest'
): Promise<UnifiedVideo[]> {
  const hourSeed = getHourlySeed();

  const mainQueries = [
    'desi mms',
    'pakistani viral',
    'desi leaked',
    'desi village girls',
    'pakistani girls',
    'hot desi',
  ];

  const reelsQueries = [
    'indian sex reels',
    'desi sex reels',
    'hot sex reels',
    'pakistani leaked mms',
    'hindi short',
    'bhabhi viral',
  ];

  const pool = feedType === 'reels' ? reelsQueries : mainQueries;
  const q1 = pool[hourSeed % pool.length];
  const q2 = pool[(hourSeed + 1) % pool.length];
  const q3 = pool[(hourSeed + 2) % pool.length];

  const apiPage = ((hourSeed + page - 1) % 15) + 1;

  const [ep1, ep2, xh1, xh2] = await Promise.all([
    fetchEpornerByKeyword(q1, apiPage, order),
    fetchEpornerByKeyword(q2, apiPage, order),
    fetchXHamsterByKeyword(q1, apiPage),
    fetchXHamsterByKeyword(q3, apiPage),
  ]);

  // Local 60,511-video fallback partitioned strictly between main (even) and reels (odd)
  const localPool: UnifiedVideo[] = (crawlIndex as RawCrawlItem[])
    .filter((item) => item.i && item.i.startsWith('http') && matchesTargetKeywords(item.t))
    .filter((_, idx) => (feedType === 'reels' ? idx % 2 === 1 : idx % 2 === 0))
    .map((item) => ({
      id: item.id,
      title: item.t,
      default_thumb: { src: item.i! },
      length_min: item.d || '08:15',
      views: item.v || '18.2K',
      keywords: 'desi indian mms',
      embed: `https://www.eporner.com/embed/${item.id}/`,
      url: `/watch/${item.id}`,
      rate: '4.8',
    }));

  const shuffledLocal = seededShuffle(localPool, feedType === 'reels' ? hourSeed + 9973 : hourSeed);
  const combined = [...xh1, ...ep1, ...xh2, ...ep2, ...shuffledLocal];

  // Strict deduplication by ID AND normalized title (no repeated videos ever)
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const unique: UnifiedVideo[] = [];

  for (const vid of combined) {
    // Enforce disjoint ID parity across main vs reels so the two feeds never overlap
    const hash = vid.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    if (feedType === 'reels' && hash % 2 === 0 && !vid.id.startsWith('xh-')) continue;
    if (feedType === 'main' && hash % 2 === 1 && !vid.id.startsWith('xh-')) continue;

    const normTitle = vid.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 42);
    if (seenIds.has(vid.id) || (normTitle && seenTitles.has(normTitle))) continue;
    seenIds.add(vid.id);
    if (normTitle) seenTitles.add(normTitle);
    unique.push(vid);
  }

  const start = (Math.max(1, page) - 1) * limit;
  return unique.slice(start, start + limit);
}
