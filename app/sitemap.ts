import type { MetadataRoute } from 'next';
import {
  ALL_CATEGORIES,
  ALL_PORNSTARS,
  SEO_DESI_HUB_LINKS,
  toCategorySlug,
  toPornstarSlug,
} from './lib/seoData';

export const revalidate = 3600;

const BASE_URL = 'https://indiansexvideo.tv';

async function fetchVideoIdsForSitemap(): Promise<string[]> {
  const topics = [
    { q: 'desi', page: 1 },
    { q: 'desi', page: 2 },
    { q: 'desi', page: 3 },
    { q: 'indian', page: 1 },
    { q: 'indian', page: 2 },
    { q: 'bhabhi', page: 1 },
    { q: 'bhabhi', page: 2 },
    { q: 'mms', page: 1 },
    { q: 'amateur', page: 1 },
    { q: '4k', page: 1 },
    { q: 'milf', page: 1 },
    { q: 'asian', page: 1 },
  ];

  const batches = await Promise.all(
    topics.map(async ({ q, page }) => {
      try {
        const res = await fetch(
          `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
            q
          )}&per_page=50&page=${page}&order=most-popular&lq=0&thumbsize=big&format=json`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.videos) ? data.videos : [];
      } catch {
        return [];
      }
    })
  );

  const ids = new Set<string>();
  for (const batch of batches) {
    for (const v of batch) {
      const id = String(v?.id || '').trim();
      if (id) ids.add(id);
    }
  }
  return Array.from(ids);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${BASE_URL}/reels`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/pornstars`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/dmca`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/2257`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Homepage paginated feeds
  const homePages: MetadataRoute.Sitemap = Array.from({ length: 24 }, (_, i) => ({
    url: `${BASE_URL}/?page=${i + 2}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.75,
  }));

  // All Category & Desi Hub slugs + paginated pages 2..5
  const uniqueCategorySlugs = Array.from(
    new Set([...ALL_CATEGORIES, ...SEO_DESI_HUB_LINKS].map((c) => toCategorySlug(c)))
  ).filter(Boolean);

  const categoryRoutes: MetadataRoute.Sitemap = [];
  for (const slug of uniqueCategorySlugs) {
    categoryRoutes.push({
      url: `${BASE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    });
    for (let p = 2; p <= 5; p++) {
      categoryRoutes.push({
        url: `${BASE_URL}/category/${slug}?page=${p}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.65,
      });
    }
  }

  // All Pornstar slugs + paginated pages 2..3
  const pornstarRoutes: MetadataRoute.Sitemap = [];
  for (const star of ALL_PORNSTARS) {
    const slug = toPornstarSlug(star);
    if (!slug) continue;
    pornstarRoutes.push({
      url: `${BASE_URL}/pornstar/${slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
    for (let p = 2; p <= 3; p++) {
      pornstarRoutes.push({
        url: `${BASE_URL}/pornstar/${slug}?page=${p}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // Live /watch/[id] video pages
  const videoIds = await fetchVideoIdsForSitemap();
  const videoRoutes: MetadataRoute.Sitemap = videoIds.map((id) => ({
    url: `${BASE_URL}/watch/${encodeURIComponent(id)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [
    ...staticRoutes,
    ...homePages,
    ...categoryRoutes,
    ...pornstarRoutes,
    ...videoRoutes,
  ];
}