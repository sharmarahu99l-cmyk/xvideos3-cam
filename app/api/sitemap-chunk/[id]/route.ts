import { NextResponse } from 'next/server';

interface EpornerVideo {
  id?: string;
  title?: string;
  default_thumb?: { src?: string };
  length_min?: number;
  length_sec?: number;
  added?: string;
}

const SITEMAP_TOPICS = [
  'desi', 'desi bhabhi', 'indian', 'pakistani', 'aunty', 'hindi audio', 'punjabi',
  'tamil', 'telugu', 'bengali', 'viral mms', 'desi homemade', 'japanese', 'anal',
  '1080p', 'teen', 'vr', 'asian', 'big tits', 'milf', 'ebony', 'homemade',
  'interracial', 'amateur', 'lesbian', '60fps', 'big ass', 'pov', 'mature',
  'creampie', 'hentai', 'bbw', 'hardcore', 'threesome', 'latina', 'big dick',
  'pornstar', 'blowjob', 'cumshot', 'blonde', 'petite', 'office', 'bdsm',
  'brunette', 'massage', 'lingerie', 'outdoor', 'squirt', 'redhead', '4k',
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shardId = Math.max(0, Math.min(999, parseInt(id, 10) || 0));
  const baseUrl = 'https://xvideos3.cam';
  const now = new Date().toISOString();

  const topic = SITEMAP_TOPICS[shardId % SITEMAP_TOPICS.length];
  const apiPage = Math.floor(shardId / SITEMAP_TOPICS.length) + 1;

  const urlBlocks: string[] = [];

  // Shard 0 also includes core hub & top Desi landing pages
  if (shardId === 0) {
    const corePaths = [
      '/',
      '/categories',
      '/pornstars',
      '/?q=desi',
      '/?q=desi%20bhabhi',
      '/?q=indian',
      '/?q=pakistani',
      '/?q=aunty',
      '/?q=hindi%20audio',
      '/?q=viral%20mms',
    ];
    for (const p of corePaths) {
      urlBlocks.push(`  <url>
    <loc>${escapeXml(`${baseUrl}${p}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${p === '/' ? '1.0' : '0.9'}</priority>
  </url>`);
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(topic)}&per_page=100&page=${apiPage}&order=latest&format=json`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36' },
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data: { videos?: EpornerVideo[] } = await res.json();
      const videos = Array.isArray(data.videos) ? data.videos : [];

      for (const v of videos) {
        if (!v.id || !v.title) continue;
        const durationSec = (v.length_min || 0) * 60 + (v.length_sec || 0);
        const safeTitle = escapeXml(v.title.trim().slice(0, 100));
        const safeDesc = escapeXml(`Watch ${v.title.trim()} full HD video free on HubTube (XVideos3.cam).`);
        const thumb = v.default_thumb?.src ? escapeXml(v.default_thumb.src) : '';

        urlBlocks.push(`  <url>
    <loc>${escapeXml(`${baseUrl}/watch/${v.id}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${
      thumb
        ? `
    <video:video>
      <video:thumbnail_loc>${thumb}</video:thumbnail_loc>
      <video:title>${safeTitle}</video:title>
      <video:description>${safeDesc}</video:description>
      <video:player_loc>${escapeXml(`https://www.eporner.com/embed/${v.id}/`)}</video:player_loc>
      <video:duration>${durationSec}</video:duration>
      <video:family_friendly>no</video:family_friendly>
    </video:video>`
        : ''
    }
  </url>`);
      }
    }
  } catch {
    // Return whatever URLs were collected without failing XML response
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlBlocks.join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
