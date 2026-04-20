import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';

  let videoEntries: any[] = [];

  try {
    const res = await fetch('https://www.eporner.com/api/v2/video/search/?query=porn&per_page=200&page=1', {
      next: { revalidate: 86400 }
    });
    const data = await res.json();
    const videos = data.videos || [];

    videoEntries = videos.map((v: any) => ({
      url: `${baseUrl}/watch/${v.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
      videos: [{
        title: v.title || "Hubtube Video",
        thumbnail_loc: v.default_thumb?.src?.replace('/240.jpg', '/1080.jpg') || v.default_thumb?.src || '',
        description: `Watch ${v.title} full HD video on Hubtube - Free xvideos`,
        content_loc: `https://www.eporner.com/embed/${v.id}/`,
        duration: Number(v.length_min || 0) * 60 + Number(v.length_sec || 0),
        view_count: parseInt(v.views || "10000"),
        publication_date: new Date().toISOString(),
        family_friendly: 'yes',
        tags: ['xvideos', 'porn', 'hubtube', 'hd', 'free', 'desi'],
      }]
    }));
  } catch (e) {
    console.error("Video sitemap fetch failed");
  }

  return videoEntries;
}