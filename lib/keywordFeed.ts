import crawlIndex from '../data/crawl-index.json';
import manualVideos from '../data/manual-videos.json';

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
type ManualVideoEntry = {
  id: string;
  title: string;
  thumb: string;
  embed: string;
  duration?: string;
  views?: string;
  keywords?: string;
  categories?: string[];
};

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

function isValidThumbUrl(src: string): boolean {
  const lower = (src || '').toLowerCase().trim();
  if (!lower.startsWith('http')) return false;
  if (lower.includes('no-thumb') || lower.includes('placeholder') || lower.includes('deleted')) {
    return false;
  }
  return true;
}

export function getPinnedVideos(categorySlug?: string): UnifiedVideo[] {
  const list = (Array.isArray(manualVideos) ? manualVideos : []) as ManualVideoEntry[];
  return list
    .filter((m) => m && m.id && m.title && m.thumb && m.embed)
    .filter((m) => {
      if (!categorySlug) return true;
      const slug = categorySlug.toLowerCase().trim();
      const cats = (m.categories || []).map((c) => c.toLowerCase().trim());
      const kws = (m.keywords || '').toLowerCase();
      return cats.includes(slug) || kws.includes(slug.replace(/-/g, ' '));
    })
    .map((m) => ({
      id: m.id,
      title: m.title,
      default_thumb: { src: m.thumb },
      length_min: m.duration || '06:30',
      views: m.views || '25.4K',
      keywords: m.keywords || 'desi mms, viral desi',
      embed: m.embed,
      url: `/watch/${m.id}`,
      rate: '4.9',
    }));
}

async function fetchEpornerLive(
  query: string,
  page: number,
  order = 'most-popular',
  perPage = 30,
  strictKeywords = false
): Promise<UnifiedVideo[]> {
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=${perPage}&page=${page}&order=${encodeURIComponent(order)}&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
      headers: { Accept: 'application/json, text/plain, */*' },
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
        if (!id || !title || !isValidThumbUrl(thumb)) return null;
        if (strictKeywords && !matchesTargetKeywords(title)) return null;

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

function extractBalancedJson(source: string, startIdx: number): string | null {
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = startIdx; i < source.length; i++) {
    const ch = source[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(startIdx, i + 1);
    }
  }
  return null;
}

function normalizeXHamsterItems(
  items: unknown[],
  query: string,
  strictKeywords: boolean
): UnifiedVideo[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((raw): UnifiedVideo | null => {
      const item = raw as Record<string, unknown>;
      if (!item || typeof item !== 'object') return null;
      const pageUrl = String(item.pageURL || item.url || '');
      const idMatch = pageUrl.match(/-([a-zA-Z0-9]+)(?:\/|$|\?)/);
      const rawId = String(item.id || (idMatch ? idMatch[1] : '') || '');
      const title = String(item.title || item.name || '').trim();
      const thumb = String(item.thumbURL || item.thumb || item.image || item.spriteURL || '');
      if (!rawId || !title || !isValidThumbUrl(thumb)) return null;
      if (strictKeywords && !matchesTargetKeywords(title)) return null;

      const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-24);
      if (!cleanId) return null;

      const durSec = Number(item.duration);
      const formattedDur =
        !Number.isNaN(durSec) && durSec > 0
          ? `${Math.floor(durSec / 60)}:${String(durSec % 60).padStart(2, '0')}`
          : typeof item.duration === 'string'
          ? item.duration
          : '06:15';

      return {
        id: `xh-${cleanId}`,
        title,
        default_thumb: { src: thumb },
        length_min: formattedDur,
        length_sec: !Number.isNaN(durSec) ? durSec : undefined,
        views: item.views ? String(item.views) : '18.5K',
        keywords: query,
        embed: `https://xhamster.com/embed/${cleanId}`,
        url: `/watch/xh-${cleanId}`,
        rate: '4.9',
      };
    })
    .filter((v: UnifiedVideo | null): v is UnifiedVideo => v !== null);
}

async function fetchXHamsterLive(
  query: string,
  page: number,
  strictKeywords = false
): Promise<UnifiedVideo[]> {
  try {
    const slug = query.trim().replace(/\s+/g, '+');
    const url =
      page > 1
        ? `https://xhamster.com/search/${slug}?page=${page}`
        : `https://xhamster.com/search/${slug}`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const marker = html.indexOf('window.initials');
    if (marker !== -1) {
      const braceStart = html.indexOf('{', marker);
      if (braceStart !== -1) {
        const jsonStr = extractBalancedJson(html, braceStart);
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          const list =
            parsed?.searchResult?.videoThumbProps ||
            parsed?.layoutPage?.videoListProps?.videoThumbProps ||
            parsed?.videos ||
            [];
          const normalized = normalizeXHamsterItems(list, query, strictKeywords);
          if (normalized.length > 0) return normalized;
        }
      }
    }

    const propsMatch = html.match(/"videoThumbProps"\s*:\s*(\[[\s\S]*?\])\s*,\s*"/);
    if (propsMatch && propsMatch[1]) {
      const list = JSON.parse(propsMatch[1]);
      return normalizeXHamsterItems(list, query, strictKeywords);
    }

    return [];
  } catch {
    return [];
  }
}

export async function searchUnifiedVideos(
  query: string,
  page = 1,
  perPage = 30,
  order = 'most-popular'
): Promise<UnifiedVideo[]> {
  const cleanQuery = query.trim() || 'desi';
  const safePage = Math.max(1, page);
  const sortOrders = ['most-popular', 'latest', 'top-weekly', 'top-monthly', 'top-rated'];
  const bucketIdx = Math.floor((safePage - 1) / 30) % sortOrders.length;
  const epOrder =
    order && order !== 'most-popular' && order !== 'most_viewed' ? order : sortOrders[bucketIdx];
  const epPage = ((safePage - 1) % 30) + 1;

  const [epResults, xhResults] = await Promise.all([
    fetchEpornerLive(cleanQuery, epPage, epOrder, perPage, false),
    fetchXHamsterLive(cleanQuery, safePage, false),
  ]);

  const interleaved: UnifiedVideo[] = [];
  const maxLen = Math.max(epResults.length, xhResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (epResults[i]) interleaved.push(epResults[i]);
    if (xhResults[i]) interleaved.push(xhResults[i]);
  }

  const seenIds = new Set<string>();
  const deduped: UnifiedVideo[] = [];
  for (const v of interleaved) {
    if (seenIds.has(v.id)) continue;
    seenIds.add(v.id);
    deduped.push(v);
  }

  return deduped.slice(0, perPage);
}

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

  const apiPage = ((hourSeed + page - 1) % 25) + 1;

  const [ep1, ep2, xh1, xh2] = await Promise.all([
    fetchEpornerLive(q1, apiPage, order, 24, true),
    fetchEpornerLive(q2, apiPage, order, 24, true),
    fetchXHamsterLive(q1, apiPage, true),
    fetchXHamsterLive(q3, apiPage, true),
  ]);

  const localPool: UnifiedVideo[] = (crawlIndex as RawCrawlItem[])
    .filter((item) => item.i && isValidThumbUrl(item.i) && matchesTargetKeywords(item.t))
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
  const combined = [...ep1, ...xh1, ...ep2, ...xh2, ...shuffledLocal];

  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const unique: UnifiedVideo[] = [];

  for (const vid of combined) {
    const hash = vid.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    if (feedType === 'reels' && hash % 2 === 0 && !vid.id.startsWith('xh-')) continue;
    if (feedType === 'main' && hash % 2 === 1 && !vid.id.startsWith('xh-')) continue;

    const normTitle = vid.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 42);
    if (seenIds.has(vid.id) || (normTitle && seenTitles.has(normTitle))) continue;
    seenIds.add(vid.id);
    if (normTitle) seenTitles.add(normTitle);
    unique.push(vid);
  }

  const pinned = page === 1 ? getPinnedVideos() : [];
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const merged = [...pinned, ...unique.filter((v) => !pinnedIds.has(v.id))];

  const start = (Math.max(1, page) - 1) * limit;
  return merged.slice(start, start + limit);
}
