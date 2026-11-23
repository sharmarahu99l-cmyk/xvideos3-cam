const QUERY_OVERRIDES: Record<string, string> = {
  '1080p hd': '1080p',
  '4k ultra hd': '4k',
  '60 fps': '60fps',
  'indian porn 1080p': 'indian',
  'viral desi mms': 'desi mms',
  'new desi videos': 'desi',
  'desi videos': 'desi',
  'desi porn': 'desi',
  'pakistani leaked mms': 'pakistani',
  'pakistani mms': 'pakistani',
  'desi college girl mms': 'desi college',
  'bengali bhabhi mms': 'bengali bhabhi',
  'tamil desi mms': 'tamil desi',
  'telugu desi videos': 'telugu',
  'mallu aunty homemade': 'mallu aunty',
  'indian homemade uncut': 'indian homemade',
  'desi leaked scandal': 'desi',
  'bhabhi devar romance': 'bhabhi devar',
  'punjabi kudi viral': 'punjabi',
  'solo girl': 'solo',
  'full movie': 'full',
  'top rated': 'hd',
};

function normalizeQuery(label: string, isPornstar: boolean): string {
  const lower = label.toLowerCase().trim();
  if (isPornstar) return lower;
  if (QUERY_OVERRIDES[lower]) return QUERY_OVERRIDES[lower];
  return (
    lower
      .replace(/\b(videos|porn|1080p|ultra hd|hd)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim() || lower
  );
}

async function fetchCandidateThumbs(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        query
      )}&per_page=15&page=1&order=most-popular&thumbsize=big&format=json`,
      {
        next: { revalidate: 604800 }, // Cache fixed for 7 days on Vercel Edge
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const urls: string[] = [];
    for (const v of videos) {
      const src = v?.default_thumb?.src?.trim() || '';
      if (src.startsWith('http')) {
        urls.push(src);
      }
    }
    return urls;
  } catch {
    return [];
  }
}

export async function resolveUniqueFixedThumbs(
  labels: string[],
  isPornstar: boolean = false
): Promise<Record<string, string>> {
  const candidatesByLabel: Record<string, string[]> = {};
  const batchSize = 12;

  for (let i = 0; i < labels.length; i += batchSize) {
    const batch = labels.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (label) => {
        const primary = normalizeQuery(label, isPornstar);
        let urls = await fetchCandidateThumbs(primary);

        // If exact phrase returned fewer than 2 candidates, also check first 2 words of that same topic
        if (urls.length < 2 && !isPornstar) {
          const shortQ = primary.split(' ').slice(0, 2).join(' ');
          if (shortQ && shortQ !== primary) {
            const extra = await fetchCandidateThumbs(shortQ);
            urls = [...urls, ...extra];
          }
        }
        return [label, urls] as const;
      })
    );

    for (const [label, urls] of results) {
      candidatesByLabel[label] = urls;
    }
  }

  // Assign each label its #1 unused thumbnail from its OWN candidate list (zero duplicates, zero cross-topic fallbacks)
  const usedUrls = new Set<string>();
  const finalMap: Record<string, string> = {};

  for (const label of labels) {
    const list = candidatesByLabel[label] || [];
    const uniqueHit = list.find((url) => !usedUrls.has(url));
    if (uniqueHit) {
      usedUrls.add(uniqueHit);
      finalMap[label] = uniqueHit;
    }
  }

  return finalMap;
}