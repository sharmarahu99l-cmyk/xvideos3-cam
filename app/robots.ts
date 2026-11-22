import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/thumb', '/api/suggest'],
      },
    ],
    sitemap: [
      'https://xvideos3.cam/sitemap-index.xml',
      'https://xvideos3.cam/sitemap.xml',
    ],
    host: 'https://xvideos3.cam',
  };
}
