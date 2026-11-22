import { NextResponse } from 'next/server';
import { searchPornhubVideos, getEmbedUrlFromId } from '../../../lib/pornhub';

const DESI_PRIORITY_TOPICS = [
  'desi', 'desi videos', 'desi porn', 'desi mms', 'viral desi', 'new desi',
  'desi bhabhi', 'indian bhabhi', 'desi aunty', 'indian aunty', 'desi sex',
  'indian porn', 'indian sex', 'pakistani mms', 'pakistani sex', 'desi chudai',
  'hindi audio', 'punjabi desi', 'punjabi kudi', 'desi homemade', 'indian homemade',
  'desi couple', 'desi college girl', 'desi village girl', 'desi saree',
  'bhabhi devar', 'south indian desi', 'tamil desi', 'telugu desi', 'bengali bhabhi',
  'marathi bhabhi', 'gujarati aunty', 'mallu aunty', 'bhojpuri desi', 'desi leaked',
  'desi hidden cam', 'desi suhag raat', 'indian wife', 'indian viral', 'desi hardcore',
];

const GLOBAL_CATALOG_TOPICS = [
  'japanese', 'anal', '1080p', 'teen', 'vr', 'asian', 'big tits', 'shemale',
  'milf', 'gay', 'ebony', 'homemade', 'interracial', 'amateur', 'lesbian',
  '60fps', 'big ass', 'pov', 'mature', 'creampie', 'hentai', 'bbw',
  'hardcore', 'threesome', 'latina', 'big dick', 'pornstar', 'double penetration',
  'vintage', 'group sex', 'blowjob', 'cumshot', 'masturbation', 'students',
  'blonde', 'petite', 'orgy', 'webcam', 'office', 'bdsm', 'public',
  'brunette', 'massage', 'lingerie', 'toys', 'hotel', 'outdoor', 'squirt',
  'fetish', 'redhead', 'housewives', 'swinger', 'bukkake', 'uniform',
  'striptease', 'bondage', 'nurses', 'handjob', 'fisting', '4k',
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
  const shardId = Math.max(0, Math.min(2000, parseInt(id, 10) || 0));
  const baseUrl = 'https://xvideos3.cam';
  const now = new Date().toISOString();

  let topic: string;
  let apiPage: number;
  let order: string;

  if (shardId < 300) {
    topic = DESI_PRIORITY_TOPICS[shardId % DESI_PRIORITY_TOPICS.length];
    apiPage = Math.floor(shardId / DESI_PRIORITY_TOPICS.length) + 1;
    order = shardId % 2 === 0 ? 'latest' : 'most_viewed';
  } else {
    const globalIdx = shardId - 300;
    topic = GLOBAL_CATALOG_TOPICS[globalIdx % GLOBAL_CATALOG_TOPICS.length];
    apiPage = Math.floor(globalIdx / GLOBAL_CATALOG_TOPICS.length) + 1;
    order = globalIdx % 2 === 0 ? 'latest' : 'top-rated';
  }

  const urlBlocks: string[] = [];

  if (shardId === 0) {
    const coreLandingPaths = [
      '/',
      '/categories',
      '/pornstars',
      ...DESI_PRIORITY_TOPICS.map((t) => `/?q=${encodeURIComponent(t)}`),
    ];
    for (const p of coreLandingPaths) {
      urlBlocks.push(`  <url>
    <loc>${escapeXml(`${baseUrl}${p}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${p === '/' ? '1.0' : '0.9'}</priority>
  </url>`);
    }
  }

  const videos = await searchPornhubVideos(topic, apiPage, order);

  for (const v of videos) {
    if (!v.id || !v.title) continue;
    const durationSec = (v.length_min || 0) * 60 + (v.length_sec || 0);
    const safeTitle = escapeXml(v.title.trim().slice(0, 100));
    const safeDesc = escapeXml(
      `Watch ${v.title.trim()} full HD Desi & adult video free on HubTube (XVideos3.cam).`
    );
    const thumb = v.default_thumb?.src ? escapeXml(v.default_thumb.src) : '';

    urlBlocks.push(`  <url>
    <loc>${escapeXml(`${baseUrl}/watch/${v.id}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>${
      thumb
        ? `
    <video:video>
      <video:thumbnail_loc>${thumb}</video:thumbnail_loc>
      <video:title>${safeTitle}</video:title>
      <video:description>${safeDesc}</video:description>
      <video:player_loc>${escapeXml(v.embed || getEmbedUrlFromId(v.id))}</video:player_loc>
      <video:duration>${durationSec}</video:duration>
      <video:family_friendly>no</video:family_friendly>
    </video:video>`
        : ''
    }
  </url>`);
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
