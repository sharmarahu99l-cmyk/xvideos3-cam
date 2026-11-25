import { NextResponse } from 'next/server';
import videosData from '../../data/sitemap-videos.json';

const BASE_URL = 'https://indiansexvideo.tv';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const videos = videosData as Array<{
    id: string;
    title: string;
    thumb: string;
    duration: number;
  }>;

  const items = videos.map((v) => {
    const pageUrl = `${BASE_URL}/watch/${encodeURIComponent(v.id)}`;
    const playerUrl = `https://www.eporner.com/embed/${encodeURIComponent(v.id)}/`;
    const desc = `Watch ${v.title} free in HD on IndianSexVideo.tv`.slice(0, 200);

    return `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(v.thumb)}</video:thumbnail_loc>
      <video:title>${escapeXml(v.title)}</video:title>
      <video:description>${escapeXml(desc)}</video:description>
      <video:player_loc allow_embed="yes">${escapeXml(playerUrl)}</video:player_loc>
      <video:duration>${v.duration}</video:duration>
      <video:family_friendly>no</video:family_friendly>
    </video:video>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${items.join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
