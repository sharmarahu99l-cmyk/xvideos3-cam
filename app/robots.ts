import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'ClaudeBot',
          'anthropic-ai',
          'Bytespider',
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'DataForSeoBot',
          'PetalBot',
          'Amazonbot',
        ],
        disallow: '/',
      },
      {
        userAgent: ['Bingbot', 'YandexBot'],
        allow: '/',
        disallow: ['/api/', '/login', '/signup', '/history'],
        crawlDelay: 2,
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/signup', '/history'],
      },
    ],
    sitemap: [
      'https://indiansexvideo.tv/sitemap.xml',
      'https://indiansexvideo.tv/video-sitemap.xml',
    ],
  };
}
