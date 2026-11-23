import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/feed.xml', '/api/sitemap-chunk/'],
      disallow: ['/history', '/login', '/signup', '/api/search', '/api/suggest', '/api/video/', '/api/thumb'],
    },
    sitemap: 'https://xvideos3.cam/sitemap-index.xml',
  };
}