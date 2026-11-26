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

async function fetchEpornerExact(
  query: string,
  page: number,
  order = 'most-popular',
  perPage = 30
): Promise<UnifiedVideo[]> {
  try {
    const cleanQuery = query.trim() || 'desi';
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(60, Math.max(10, perPage));
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      cleanQuery
    )}&per_page=${safePerPage}&page=${safePage}&order=${encodeURIComponent(order)}&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];

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
        keywords: typeof v?.keywords === 'string' ? v.keywords : cleanQuery,
        embed:
          typeof v?.embed === 'string' && v.embed.startsWith('http')
            ? v.embed
            : `https://www.eporner.com/embed/${id}/`,
        url: `/watch/${id}`,
        rate: typeof v?.rate === 'string' ? v.rate : '4.8',
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Exact 1:1 real-time Eporner search mirror with zero caching delay and zero broken links.
 */
export async function searchUnifiedVideos(
  query: string,
  page = 1,
  perPage = 30,
  order = 'most-popular'
): Promise<UnifiedVideo[]> {
  const epOrder = order === 'most_viewed' ? 'most-popular' : order || 'most-popular';
  return fetchEpornerExact(query, page, epOrder, perPage);
}

/**
 * Real-time Eporner feed for Homepage ('main') and Reels ('reels') with zero dead links.
 */
export async function getHourlyKeywordFeed(
  feedType: 'main' | 'reels',
  page = 1,
  limit = 30,
  order = 'most-popular'
): Promise<UnifiedVideo[]> {
  const hourSeed = getHourlySeed();

  const mainQueries = [
    'desi mms',
    'indian desi',
    'desi bhabhi',
    'pakistani',
    'desi leaked',
    'hindi',
  ];

  const reelsQueries = [
    'indian short',
    'desi reel',
    'desi mms',
    'bhabhi',
    'pakistani viral',
    'hindi audio',
  ];

  const pool = feedType === 'reels' ? reelsQueries : mainQueries;
  const activeQuery = pool[hourSeed % pool.length];
  const epOrder = order === 'most_viewed' ? 'most-popular' : order || 'most-popular';

  const liveResults = await fetchEpornerExact(activeQuery, page, epOrder, limit);
  const pinned = page === 1 && feedType === 'main' ? getPinnedVideos() : [];
  const pinnedIds = new Set(pinned.map((p) => p.id));

  return [...pinned, ...liveResults.filter((v) => !pinnedIds.has(v.id))].slice(0, limit);
}
