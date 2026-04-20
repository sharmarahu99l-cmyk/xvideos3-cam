import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xvideos3.cam';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ];

  // Generate 500 pagination pages
  const paginationPages = Array.from({ length: 500 }, (_, i) => {
    const page = i + 1;
    return {
      url: `${baseUrl}/?page=${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  return [...staticPages, ...paginationPages];
}