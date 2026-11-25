import fs from 'node:fs';

const BASE_URL = 'https://indiansexvideo.tv';
const TARGET_COUNT = 100000;
const CHUNK_SIZE = 50000;

const QUERIES = [
  'desi', 'indian', 'bhabhi', 'hindi', 'mms', 'south indian', 'tamil',
  'telugu', 'mallu', 'punjabi', 'bengali', 'bollywood', 'college', 'aunty',
  'amateur', 'homemade', '4k', 'hd', 'couple', 'girlfriend', 'wife',
  'pov', 'solo', 'teen', 'milf', 'asian', 'arab', 'pakistani',
  'hardcore', 'blowjob', 'big tits', 'big ass', 'casting', 'massage', 'public'
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchPage(query, page) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=100&page=${page}&order=most-popular&lq=0&thumbsize=big&format=json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.videos) ? data.videos : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

const seen = new Set();
const videos = [];

console.log(`Harvesting up to ${TARGET_COUNT.toLocaleString()} unique videos...`);

for (let page = 1; page <= 40 && videos.length < TARGET_COUNT; page++) {
  for (let i = 0; i < QUERIES.length && videos.length < TARGET_COUNT; i += 7) {
    const batchQueries = QUERIES.slice(i, i + 7);
    const results = await Promise.all(batchQueries.map((q) => fetchPage(q, page)));

    for (const list of results) {
      for (const v of list) {
        if (videos.length >= TARGET_COUNT) break;
        const id = String(v?.id || '').trim();
        const title = String(v?.title || '').trim();
        const thumb = String(v?.default_thumb?.src || '').trim();
        if (!id || !title || !thumb.startsWith('http') || seen.has(id)) continue;

        seen.add(id);
        videos.push({
          id,
          title: title.slice(0, 100),
          thumb,
          duration: Math.max(15, Math.min(28000, Number(v?.length_sec) || 180)),
        });
      }
    }
  }
  console.log(`Page ${page} complete — Collected: ${videos.length.toLocaleString()} videos`);
}

const now = new Date().toISOString();
const staticUrls = [
  `${BASE_URL}/`,
  `${BASE_URL}/reels`,
  `${BASE_URL}/categories`,
  `${BASE_URL}/pornstars`,
  `${BASE_URL}/partners`,
  ...QUERIES.slice(0, 20).map((q) => `${BASE_URL}/category/${encodeURIComponent(q.replace(/\s+/g, '-'))}`),
];

// Split into 50,000-URL chunks
const chunks = [];
for (let i = 0; i < videos.length; i += CHUNK_SIZE) {
  chunks.push(videos.slice(i, i + CHUNK_SIZE));
}

const pageSitemapFiles = [];
const videoSitemapFiles = [];

chunks.forEach((chunk, idx) => {
  const num = idx + 1;

  // 1. Standard URL sitemap chunk
  const pageEntries = [];
  if (idx === 0) {
    for (const u of staticUrls) {
      pageEntries.push(`  <url><loc>${escapeXml(u)}</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>`);
    }
  }
  for (const v of chunk) {
    pageEntries.push(
      `  <url><loc>${BASE_URL}/watch/${encodeURIComponent(v.id)}</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>`
    );
  }
  const pageFilename = `sitemap-${num}.xml`;
  fs.writeFileSync(
    `public/${pageFilename}`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pageEntries.join('\n')}\n</urlset>`
  );
  pageSitemapFiles.push(pageFilename);

  // 2. Video sitemap chunk
  const videoEntries = chunk.map((v) => {
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
  const videoFilename = `video-sitemap-${num}.xml`;
  fs.writeFileSync(
    `public/${videoFilename}`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${videoEntries.join('\n')}\n</urlset>`
  );
  videoSitemapFiles.push(videoFilename);
});

// 3. Master Sitemap Indexes
fs.writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pageSitemapFiles
    .map((f) => `  <sitemap><loc>${BASE_URL}/${f}</loc><lastmod>${now}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>`
);

fs.writeFileSync(
  'public/video-sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${videoSitemapFiles
    .map((f) => `  <sitemap><loc>${BASE_URL}/${f}</loc><lastmod>${now}</lastmod></sitemap>`)
    .join('\n')}\n</sitemapindex>`
);

console.log(`Done! Generated ${videos.length.toLocaleString()} URLs across ${chunks.length} sitemap files in public/`);
