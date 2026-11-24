import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/signup', '/history'],
      },
    ],
    sitemap: 'https://indiansexvideo.tv/sitemap.xml',
    host: 'https://indiansexvideo.tv',
  };
}