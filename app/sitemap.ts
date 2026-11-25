import type { MetadataRoute } from 'next';
import videosData from '../data/sitemap-videos.json';

const BASE_URL = 'https://indiansexvideo.tv';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${BASE_URL}/reels`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/pornstars`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/partners`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/category/desi`, lastModified: now, changeFrequency: 'hourly', priority: 0.85 },
    { url: `${BASE_URL}/category/indian`, lastModified: now, changeFrequency: 'hourly', priority: 0.85 },
    { url: `${BASE_URL}/category/bhabhi`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/category/hindi`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/category/4k`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const videoPages: MetadataRoute.Sitemap = (videosData as Array<{ id: string }>).map((v) => ({
    url: `${BASE_URL}/watch/${encodeURIComponent(v.id)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...videoPages];
}
