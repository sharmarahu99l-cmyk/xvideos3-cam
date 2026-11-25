import fs from 'node:fs';

const QUERIES = ['desi', 'indian', 'bhabhi', 'hindi', 'mms', 'amateur', '4k', 'south indian'];
const seen = new Set();
const videos = [];

for (const q of QUERIES) {
  for (const page of [1, 2]) {
    try {
      const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        q
      )}&per_page=50&page=${page}&order=most-popular&lq=0&thumbsize=big&format=json`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const v of data?.videos || []) {
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
    } catch {}
  }
}

fs.writeFileSync('data/sitemap-videos.json', JSON.stringify(videos, null, 2));
console.log(`Saved ${videos.length} videos to data/sitemap-videos.json`);
