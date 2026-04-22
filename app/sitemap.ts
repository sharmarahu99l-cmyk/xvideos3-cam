import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/pornstars`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ];

  // All videos from Eporner (first 500 recent videos)
  let videoEntries: any[] = [];
  try {
    const res = await fetch('https://www.eporner.com/api/v2/video/search/?query=&per_page=200&page=1&order=latest', { next: { revalidate: 86400 } });
    const data = await res.json();
    videoEntries = (data.videos || []).map((v: any) => ({
      url: `${baseUrl}/watch/${v.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch (e) {}

  return [...staticPages, ...videoEntries];
}