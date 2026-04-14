import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
const baseUrl = 'https://xvideos3.cam';
  // Get latest videos for sitemap
  let videos: any[] = [];
  try {
    const res = await fetch('https://www.eporner.com/api/v2/video/search/?query=desi&per_page=100&page=1', {
      next: { revalidate: 86400 } // refresh daily
    });
    const data = await res.json();
    videos = data.videos || [];
  } catch (e) {
    console.error("Failed to fetch videos for sitemap");
  }

  const videoUrls = videos.map((video: any) => ({
    url: `${baseUrl}/watch/${video.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...videoUrls,
  ];
}