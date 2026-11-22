export interface NormalizedVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src: string; width?: number; height?: number }>;
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
  keywords?: string;
  added?: string;
}

interface PhThumb {
  src?: string;
  width?: string | number;
  height?: string | number;
}

interface PhRawVideo {
  video_id?: string;
  title?: string;
  default_thumb?: string;
  thumb?: string;
  thumbs?: PhThumb[];
  duration?: string;
  views?: string | number;
  tags?: Array<{ tag_name?: string }>;
  publish_date?: string;
}

interface RtRawVideo {
  video_id?: string;
  title?: string;
  default_thumb?: string;
  thumb?: string;
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  duration?: string;
  views?: string | number;
  tags?: string[] | Array<{ tag_name?: string }>;
  publish_date?: string;
}

const PH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.pornhub.com/',
  Cookie: 'accessAgeDisclaimerPH=1; platform=pc',
};

const ORDER_MAP: Record<string, string> = {
  most_viewed: 'mostviewed',
  'most-popular': 'mostviewed',
  'top-rated': 'rating',
  latest: 'newest',
  newest: 'newest',
};

function parseDuration(duration?: string): { mins: number; secs: number } {
  const parts = (duration || '0:0').split(':').map((n) => parseInt(n, 10) || 0);
  if (parts.length === 3) {
    return { mins: parts[0] * 60 + parts[1], secs: parts[2] };
  }
  if (parts.length === 2) {
    return { mins: parts[0], secs: parts[1] };
  }
  return { mins: 0, secs: 0 };
}

export function getEmbedUrlFromId(id: string): string {
  if (id.startsWith('rt-')) {
    return `https://embed.redtube.com/?id=${encodeURIComponent(id.slice(3))}`;
  }
  const cleanPhId = id.replace(/^ph-/, '');
  return `https://www.pornhub.com/embed/${encodeURIComponent(cleanPhId)}`;
}

export function normalizePornhubVideo(v: PhRawVideo): NormalizedVideo | null {
  const rawId = String(v.video_id || '').trim();
  if (!rawId) return null;

  const { mins, secs } = parseDuration(v.duration);

  const mappedThumbs = Array.isArray(v.thumbs)
    ? v.thumbs
        .filter((t) => Boolean(t?.src))
        .map((t) => ({
          src: String(t.src),
          width: Number(t.width) || 0,
          height: Number(t.height) || 0,
        }))
    : [];

  const bestThumb =
    mappedThumbs[mappedThumbs.length - 1]?.src ||
    v.default_thumb ||
    v.thumb ||
    '';

  const keywords = Array.isArray(v.tags)
    ? v.tags.map((t) => t.tag_name).filter(Boolean).join(', ')
    : '';

  return {
    id: `ph-${rawId}`,
    title: v.title || 'HD Video',
    default_thumb: { src: bestThumb },
    thumbs: mappedThumbs,
    length_min: mins,
    length_sec: secs,
    embed: `https://www.pornhub.com/embed/${rawId}`,
    views: v.views !== undefined ? String(v.views) : undefined,
    keywords,
    added: v.publish_date,
  };
}

function normalizeRedtubeVideo(v: RtRawVideo): NormalizedVideo | null {
  const rawId = String(v.video_id || '').trim();
  if (!rawId) return null;

  const { mins, secs } = parseDuration(v.duration);

  const mappedThumbs = Array.isArray(v.thumbs)
    ? v.thumbs
        .filter((t) => Boolean(t?.src))
        .map((t) => ({
          src: String(t.src),
          width: Number(t.width) || 0,
          height: Number(t.height) || 0,
        }))
    : [];

  const bestThumb =
    mappedThumbs[mappedThumbs.length - 1]?.src ||
    v.default_thumb ||
    v.thumb ||
    '';

  const keywords = Array.isArray(v.tags)
    ? v.tags
        .map((t) => (typeof t === 'string' ? t : t?.tag_name))
        .filter(Boolean)
        .join(', ')
    : '';

  return {
    id: `rt-${rawId}`,
    title: v.title || 'HD Video',
    default_thumb: { src: bestThumb },
    thumbs: mappedThumbs,
    length_min: mins,
    length_sec: secs,
    embed: `https://embed.redtube.com/?id=${rawId}`,
    views: v.views !== undefined ? String(v.views) : undefined,
    keywords,
    added: v.publish_date,
  };
}

async function searchRedtubeFallback(
  query: string,
  page: number,
  order: string,
  timeoutMs: number
): Promise<NormalizedVideo[]> {
  const rtOrder =
    order === 'latest' || order === 'newest'
      ? 'newest'
      : order === 'top-rated'
        ? 'rating'
        : 'mostviewed';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(query)}&page=${page}&ordering=${rtOrder}&thumbsize=big`,
      {
        signal: controller.signal,
        next: { revalidate: 1800 },
        headers: { 'User-Agent': PH_HEADERS['User-Agent'] },
      }
    );
    if (!res.ok) return [];
    const data: { videos?: Array<{ video?: RtRawVideo } & RtRawVideo> } = await res.json();
    const list = Array.isArray(data.videos) ? data.videos : [];
    return list
      .map((item) => normalizeRedtubeVideo(item.video ?? item))
      .filter((item): item is NormalizedVideo => item !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function searchPornhubVideos(
  query: string,
  page = 1,
  order = 'most_viewed',
  timeoutMs = 4500
): Promise<NormalizedVideo[]> {
  const ordering = ORDER_MAP[order] || 'mostviewed';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(query)}&page=${page}&ordering=${ordering}&thumbsize=large`,
      {
        signal: controller.signal,
        next: { revalidate: 1800 },
        headers: PH_HEADERS,
      }
    );

    if (res.ok) {
      const data: { videos?: PhRawVideo[] } = await res.json();
      const list = Array.isArray(data.videos) ? data.videos : [];
      const normalized = list
        .map(normalizePornhubVideo)
        .filter((item): item is NormalizedVideo => item !== null);

      if (normalized.length > 0) {
        return normalized;
      }
    }
  } catch {
    // Fall through to RedTube backup
  } finally {
    clearTimeout(timer);
  }

  return searchRedtubeFallback(query, page, order, timeoutMs);
}

export async function getPornhubVideoById(
  id: string,
  timeoutMs = 4500
): Promise<NormalizedVideo | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (id.startsWith('rt-')) {
      const rawRtId = id.slice(3);
      const res = await fetch(
        `https://api.redtube.com/?data=redtube.Videos.getVideoById&video_id=${encodeURIComponent(rawRtId)}&output=json&thumbsize=big`,
        {
          signal: controller.signal,
          next: { revalidate: 3600 },
          headers: { 'User-Agent': PH_HEADERS['User-Agent'] },
        }
      );
      if (!res.ok) return null;
      const data: { video?: RtRawVideo } = await res.json();
      return data.video ? normalizeRedtubeVideo(data.video) : null;
    }

    const rawPhId = id.replace(/^ph-/, '');
    const res = await fetch(
      `https://www.pornhub.com/webmasters/video_by_id?id=${encodeURIComponent(rawPhId)}&thumbsize=large`,
      {
        signal: controller.signal,
        next: { revalidate: 3600 },
        headers: PH_HEADERS,
      }
    );
    if (!res.ok) return null;
    const data: { video?: PhRawVideo } = await res.json();
    return data.video ? normalizePornhubVideo(data.video) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
