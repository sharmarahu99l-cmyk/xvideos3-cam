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

const ORDER_MAP: Record<string, string> = {
  most_viewed: 'mostviewed',
  'most-popular': 'mostviewed',
  'top-rated': 'rating',
  latest: 'newest',
  newest: 'newest',
};

export function normalizePornhubVideo(v: PhRawVideo): NormalizedVideo | null {
  const id = String(v.video_id || '').trim();
  if (!id) return null;

  const parts = (v.duration || '0:0').split(':').map((n) => parseInt(n, 10) || 0);
  let mins = 0;
  let secs = 0;
  if (parts.length === 3) {
    mins = parts[0] * 60 + parts[1];
    secs = parts[2];
  } else if (parts.length === 2) {
    mins = parts[0];
    secs = parts[1];
  }

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
    id,
    title: v.title || 'HD Video',
    default_thumb: { src: bestThumb },
    thumbs: mappedThumbs,
    length_min: mins,
    length_sec: secs,
    embed: `https://www.pornhub.com/embed/${id}`,
    views: v.views !== undefined ? String(v.views) : undefined,
    keywords,
    added: v.publish_date,
  };
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
      `https://www.pornhub.com/webmasters/search?search=${encodeURIComponent(query)}&page=${page}&ordering=${ordering}&thumbsize=large_hd`,
      {
        signal: controller.signal,
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return [];
    const data: { videos?: PhRawVideo[] } = await res.json();
    const list = Array.isArray(data.videos) ? data.videos : [];
    return list
      .map(normalizePornhubVideo)
      .filter((item): item is NormalizedVideo => item !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function getPornhubVideoById(
  id: string,
  timeoutMs = 4500
): Promise<NormalizedVideo | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://www.pornhub.com/webmasters/video_by_id?id=${encodeURIComponent(id)}&thumbsize=large_hd`,
      {
        signal: controller.signal,
        next: { revalidate: 3600 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36' },
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
