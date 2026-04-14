import { MetadataRoute } from 'next';

export default async function videoSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';

  let videos: any[] = [];

  try {
    const res = await fetch('https://www.eporner.com/api/v2/video/search/?query=desi&per_page=200&page=1', {
      next: { revalidate: 86400 }
    });
    const data = await res.json();
    videos = data.videos || [];
  } catch (e) {
    console.error("Failed to fetch videos for video-sitemap");
  }

  return videos.map((video: any) => ({
    url: `${baseUrl}/watch/${video.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
    videos: [{
      title: video.title || "Free XVIDEOS",
      thumbnail_loc: video.default_thumb?.src || '',
      description: `Watch ${video.title} full HD video on XVIDEOS3`,
      content_loc: `https://www.eporner.com/embed/${video.id}/`,
      duration: Number(video.length_min || 0) * 60 + Number(video.length_sec || 0),
      view_count: parseInt(video.views || "10000"),
      publication_date: new Date().toISOString(),
      family_friendly: 'yes' as const,
      tags: ['xvideos', 'desi', 'indian', 'bhabhi', 'porn'],
    }]
  }));
}