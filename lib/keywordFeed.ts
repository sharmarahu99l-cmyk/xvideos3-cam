import manualVideos from '../data/manual-videos.json';

export interface UnifiedVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min?: string | number;
  length_sec?: number | string;
  views?: string | number;
  keywords?: string;
  embed?: string;
  url?: string;
  rate?: string;
}

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

export function getHourlySeed(): number {
  return Math.floor(Date.now() / 3600000);
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

function normalizeEpornerVideos(list: unknown[], fallbackQuery: string): UnifiedVideo[] {
  if (!Array.isArray(list)) return [];
  const out: UnifiedVideo[] = [];
  for (const raw of list) {
    const v = raw as Record<string, unknown>;
    const id = String(v?.id || '').trim();
    const title = String(v?.title || '').trim();
    const thumbObj = v?.default_thumb as { src?: string } | undefined;
    const thumb = String(thumbObj?.src || '').trim();
    if (!id || !title || !isValidThumbUrl(thumb)) continue;

    out.push({
      id,
      title,
      default_thumb: { src: thumb },
      thumbs: Array.isArray(v?.thumbs) ? v.thumbs : undefined,
      length_min: v?.length_min as string | number | undefined,
      length_sec: v?.length_sec as string | number | undefined,
      views: (v?.views as string | number) ?? 0,
      keywords: typeof v?.keywords === 'string' ? v.keywords : fallbackQuery,
      embed:
        typeof v?.embed === 'string' && v.embed.startsWith('http')
          ? v.embed
          : `https://www.eporner.com/embed/${id}/`,
      url: `/watch/${id}`,
      rate: typeof v?.rate === 'string' ? v.rate : '4.8',
    });
  }
  return out;
}

async function queryEpornerApiRaw(
  query: string,
  page: number,
  order = '',
  perPage = 30
): Promise<{ videos: UnifiedVideo[]; totalPages: number }> {
  const cleanQuery = query.trim() || 'all';
  const safePage = Math.max(1, page);
  const safePerPage = Math.min(100, Math.max(10, perPage));
  const cleanOrder = order.trim();
  const orderParam =
    cleanOrder && cleanOrder !== 'default'
      ? `&order=${encodeURIComponent(cleanOrder === 'most_viewed' ? 'most-popular' : cleanOrder)}`
      : '';

  // Note: lq=1 is Eporner's website default — including standard + HD videos unlocks all 100,000 results instead of stopping at page 6
  const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
    cleanQuery
  )}&per_page=${safePerPage}&page=${safePage}${orderParam}&lq=1&thumbsize=big&format=json`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });
      if (res.status === 503 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      if (!res.ok) return { videos: [], totalPages: 0 };
      const data = await res.json();
      const videos = normalizeEpornerVideos(data?.videos, cleanQuery);
      const totalPages = Math.max(0, Number(data?.total_pages) || 0);
      return { videos, totalPages };
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
    }
  }
  return { videos: [], totalPages: 0 };
}

/**
 * Real-time 1:1 Eporner search with full lq=1 catalog (up to 100,000 videos per keyword)
 * plus automatic multi-sort / broad-token continuation so no page is ever empty.
 */
export async function searchUnifiedVideos(
  query: string,
  page = 1,
  perPage = 30,
  order = ''
): Promise<UnifiedVideo[]> {
  const cleanQuery = query.trim() || 'all';
  const safePage = Math.max(1, page);

  // 1. Direct real-time Eporner search for the exact user query & page
  const primary = await queryEpornerApiRaw(cleanQuery, safePage, order, perPage);
  if (primary.videos.length > 0) {
    return primary.videos.slice(0, perPage);
  }

  // 2. If user paginated past total_pages for a narrow multi-word query, continue seamlessly
  //    using alternate sort orders and primary keyword tokens so results never run out
  const sortOrders = ['latest', 'most-popular', 'top-weekly', 'top-monthly', 'top-rated'];
  const altOrder = sortOrders[safePage % sortOrders.length];
  const wrappedPage = primary.totalPages > 0 ? ((safePage - 1) % primary.totalPages) + 1 : 1;

  const secondary = await queryEpornerApiRaw(cleanQuery, wrappedPage, altOrder, perPage);
  if (secondary.videos.length > 0) {
    return secondary.videos.slice(0, perPage);
  }

  // 3. Broaden to primary keyword token or unlimited 'all' catalog so pages never show empty
  const firstWord = cleanQuery.split(/\s+/)[0] || 'all';
  const fallbackQuery = firstWord.toLowerCase() !== cleanQuery.toLowerCase() ? firstWord : 'all';
  const fallback = await queryEpornerApiRaw(fallbackQuery, safePage, 'latest', perPage);
  return fallback.videos.slice(0, perPage);
}

/**
 * Real-time Eporner feed for Homepage ('main') and Reels ('reels') across full lq=1 catalog.
 */
export async function getHourlyKeywordFeed(
  feedType: 'main' | 'reels',
  page = 1,
  limit = 30,
  order = ''
): Promise<UnifiedVideo[]> {
  const hourSeed = getHourlySeed();

  const mainQueries = [
    'desi mms',
    'indian desi',
    'desi bhabhi',
    'pakistani',
    'desi',
    'hindi',
  ];

  const reelsQueries = [
    'indian',
    'desi',
    'desi mms',
    'bhabhi',
    'pakistani',
    'hindi',
  ];

  const pool = feedType === 'reels' ? reelsQueries : mainQueries;
  const activeQuery = pool[hourSeed % pool.length];

  const liveResults = await searchUnifiedVideos(activeQuery, page, limit, order);
  const pinned = page === 1 && feedType === 'main' ? getPinnedVideos() : [];
  const pinnedIds = new Set(pinned.map((p) => p.id));

  return [...pinned, ...liveResults.filter((v) => !pinnedIds.has(v.id))].slice(0, limit);
}
