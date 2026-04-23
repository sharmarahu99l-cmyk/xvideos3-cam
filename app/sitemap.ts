import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/pornstars`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 }
  );

  // Fetch ALL videos (500+ pages × 200 = 100,000+ but we cap at ~10,000)
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= 50) {  // 50 pages × 200 = 10,000 videos
    try {
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/search/?query=&per_page=200&page=${page}&order=latest`,
        { next: { revalidate: 86400 } }
      );
      const data = await res.json();
      const videos = data.videos || [];

      if (videos.length === 0) hasMore = false;

      videos.forEach((v: any) => {
        entries.push({
          url: `${baseUrl}/watch/${v.id}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9
        });
      });
    } catch (e) {
      hasMore = false;
    }
    page++;
  }

  return entries;
}