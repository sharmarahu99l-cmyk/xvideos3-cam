import type { MetadataRoute } from 'next';

export const revalidate = 3600;

const BASE_URL = 'https://indiansexvideo.tv';
const CHUNK_QUERIES = [
  'desi',
  'indian',
  'bhabhi',
  'hindi',
  'mms',
  'amateur',
  '4k',
  'south indian',
  'bollywood',
  'couple',
];

export async function generateSitemaps() {
  return CHUNK_QUERIES.map((_, index) => ({ id: index }));
}

async function fetchChunkVideos(query: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=100&page=1&order=most-popular&lq=0&thumbsize=big&format=json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.videos) ? data.videos : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export default async function sitemap(props: {
  id: Promise<string | number> | string | number;
}): Promise<MetadataRoute.Sitemap> {
  const rawId = await props?.id;
  const chunkId = Number.isFinite(Number(rawId)) ? Number(rawId) : 0;
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  if (chunkId === 0) {
    const staticPaths = [
      { path: '', priority: 1.0, freq: 'hourly' as const },
      { path: '/reels', priority: 0.9, freq: 'hourly' as const },
      { path: '/categories', priority: 0.8, freq: 'daily' as const },
      { path: '/pornstars', priority: 0.8, freq: 'daily' as const },
      { path: '/partners', priority: 0.7, freq: 'weekly' as const },
      { path: '/category/desi', priority: 0.85, freq: 'hourly' as const },
      { path: '/category/indian', priority: 0.85, freq: 'hourly' as const },
      { path: '/category/bhabhi', priority: 0.8, freq: 'daily' as const },
      { path: '/category/hindi', priority: 0.8, freq: 'daily' as const },
      { path: '/category/4k', priority: 0.8, freq: 'daily' as const },
    ];

    for (const item of staticPaths) {
      entries.push({
        url: `${BASE_URL}${item.path}`,
        lastModified: now,
        changeFrequency: item.freq,
        priority: item.priority,
      });
    }
  }

  const query = CHUNK_QUERIES[chunkId] || 'desi';
  const videos = await fetchChunkVideos(query);
  const seen = new Set<string>();

  for (const v of videos) {
    const id = String(v?.id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    entries.push({
      url: `${BASE_URL}/watch/${encodeURIComponent(id)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  if (entries.length === 0) {
    entries.push({
      url: `${BASE_URL}/category/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  return entries;
}
