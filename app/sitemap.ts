import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';

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

  let videoEntries: any[] = [];

  try {
    const res = await fetch('https://www.eporner.com/api/v2/video/search/?query=desi&per_page=200&page=1', {
      next: { revalidate: 86400 }
    });
    const data = await res.json();
    const videos = data.videos || [];

    videoEntries = videos.map((video: any) => {
      const safeTitle = (video.title || "XVIDEOS").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return {
        url: `${baseUrl}/watch/${video.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
        videos: [{
          title: safeTitle,
          thumbnail_loc: video.default_thumb?.src || '',
          description: `Watch ${safeTitle} full HD video on XVIDEOS3 - Free xvideos`,
          content_loc: `https://www.eporner.com/embed/${video.id}/`,
          duration: Number(video.length_min || 0) * 60 + Number(video.length_sec || 0),
          view_count: parseInt(video.views || "10000"),
          publication_date: new Date().toISOString(),
          family_friendly: 'yes' as const,
          tags: ['xvideos', 'desi', 'indian', 'bhabhi', 'aunty', 'porn'],
        }]
      };
    });
  } catch (e) {
    console.error("Failed to fetch videos for sitemap");
  }

  return [...staticPages, ...videoEntries];
}