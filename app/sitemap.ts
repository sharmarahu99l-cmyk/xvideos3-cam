import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Video pages (simple version - Google will still crawl them)
  let videoEntries: any[] = [];

  try {
    const res = await fetch('https://www.eporner.com/api/v2/video/search/?query=desi&per_page=200&page=1', {
      next: { revalidate: 86400 }
    });
    const data = await res.json();
    const videos = data.videos || [];

    videoEntries = videos.map((video: any) => ({
      url: `${baseUrl}/watch/${video.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch (e) {
    console.error("Failed to fetch videos for sitemap");
  }

  return [...staticPages, ...videoEntries];
}