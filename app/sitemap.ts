import type { MetadataRoute } from 'next';
import { ALL_SITEMAP_CATEGORIES, ALL_PORNSTARS, toCategorySlug, toPornstarSlug } from './lib/seoData';

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://xvideos3.cam';

  const corePages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/reels`, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${base}/categories`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/pornstars`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/dmca`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/2257`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = ALL_SITEMAP_CATEGORIES.map((cat) => ({
    url: `${base}/category/${toCategorySlug(cat)}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const pornstarPages: MetadataRoute.Sitemap = ALL_PORNSTARS.map((star) => ({
    url: `${base}/pornstar/${toPornstarSlug(star)}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...corePages, ...categoryPages, ...pornstarPages];
}