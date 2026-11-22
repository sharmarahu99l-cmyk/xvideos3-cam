export interface StoredVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min: number;
  length_sec: number;
  embed?: string;
  views?: string | number;
  keywords?: string;
  added?: string;
}

export interface ContentContext {
  type: 'pornstar' | 'desi' | 'category';
  primarySubject: string;
  similarQuery: string;
  peerQueries: string[];
}

const PREFS_KEY = 'hubtube_user_prefs_v1';
const HISTORY_KEY = 'hubtube_watch_history_v1';

const PORNSTAR_GROUPS: string[][] = [
  ['Mia Khalifa', 'Sunny Leone', 'Priya Rai', 'Nadia Ali', 'Sahara Knite', 'Romi Rain'],
  ['Angela White', 'Ava Addams', 'Brandi Love', 'Cory Chase', 'Lisa Ann', 'Kendra Lust', 'Cherie DeVille'],
  ['Riley Reid', 'Lana Rhoades', 'Abella Danger', 'Mia Malkova', 'Adriana Chechik', 'Dani Daniels'],
  ['Violet Myers', 'Savannah Bond', 'Natasha Nice', 'Gabbie Carter', 'Blake Blossom', 'Lena Paul'],
  ['Valentina Nappi', 'Anissa Kate', 'Little Caprice', 'Alexis Texas', 'Nicole Aniston', 'Lexi Luna'],
  ['Emily Willis', 'Kenzie Reeves', 'Lulu Chu', 'Hazel Moore', 'Skylar Vox', 'Eliza Ibarra'],
];

const DESI_CLUSTERS: string[][] = [
  ['desi bhabhi', 'indian bhabhi', 'bhabhi devar', 'desi saree sex', 'indian wife'],
  ['desi aunty', 'indian aunty', 'gujarati aunty', 'mallu aunty', 'south indian desi'],
  ['desi mms', 'viral desi', 'desi leaked scandal', 'desi hidden cam', 'pakistani mms'],
  ['hindi audio', 'punjabi desi', 'punjabi kudi', 'desi couple', 'desi homemade'],
  ['desi college girl', 'desi village girl', 'bengali bhabhi', 'marathi bhabhi', 'bhojpuri desi'],
];

const CATEGORY_CLUSTERS: string[][] = [
  ['japanese', 'asian', 'thai', 'korean', 'jav'],
  ['milf', 'mature', 'housewives', 'older men', 'stepmom'],
  ['amateur', 'homemade', 'webcam', 'college', 'girlfriend'],
  ['big tits', 'big ass', 'bbw', 'curvy', 'busty'],
  ['pov', 'hardcore', 'creampie', 'blowjob', 'threesome'],
  ['teen', 'petite', 'students', 'blonde', 'brunette'],
  ['lesbian', 'solo', 'massage', 'lingerie', 'public'],
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'her', 'his', 'she',
  'him', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'hot', 'free',
  'video', 'videos', 'full', 'new', 'best', 'xxx', 'porn', 'sex', 'hd', '1080p',
  '720p', '4k', 'mp4', 'watch', 'online', 'scene', 'clip', 'part',
]);

function hashText(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function rotateArray<T>(arr: T[], offset: number): T[] {
  if (arr.length === 0) return [];
  const shift = ((offset % arr.length) + arr.length) % arr.length;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

export function resolveContentContext(
  titleOrQuery: string,
  keywords: string = '',
  seedOffset: number = 0
): ContentContext {
  const combined = `${titleOrQuery} ${keywords}`.toLowerCase();
  const seed = hashText(combined) + seedOffset;

  // 1. Pornstar match -> Similar shows ONLY that pornstar; Picked For You shows OTHER peer pornstars
  for (const group of PORNSTAR_GROUPS) {
    const matchedStar = group.find((star) => combined.includes(star.toLowerCase()));
    if (matchedStar) {
      const otherStars = group.filter((s) => s.toLowerCase() !== matchedStar.toLowerCase());
      return {
        type: 'pornstar',
        primarySubject: matchedStar,
        similarQuery: matchedStar,
        peerQueries: rotateArray(otherStars, seed).slice(0, 3),
      };
    }
  }

  // 2. Desi sub-niche match
  for (const cluster of DESI_CLUSTERS) {
    const matchedDesi = cluster.find((term) => combined.includes(term));
    if (matchedDesi) {
      const peers = cluster.filter((t) => t !== matchedDesi);
      return {
        type: 'desi',
        primarySubject: matchedDesi,
        similarQuery: matchedDesi,
        peerQueries: rotateArray(peers, seed).slice(0, 3),
      };
    }
  }

  // 3. Category match
  for (const cluster of CATEGORY_CLUSTERS) {
    const matchedCat = cluster.find((term) => combined.includes(term));
    if (matchedCat) {
      const peers = cluster.filter((t) => t !== matchedCat);
      return {
        type: 'category',
        primarySubject: matchedCat,
        similarQuery: matchedCat,
        peerQueries: rotateArray(peers, seed).slice(0, 3),
      };
    }
  }

  // 4. Fallback keyword extraction
  const words = titleOrQuery
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()));

  const tagWords = keywords
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t.toLowerCase()));

  const primary =
    words.length >= 2
      ? `${words[0]} ${words[1]}`
      : words[0] || tagWords[0] || 'desi bhabhi';

  const fallbackPool = ['desi bhabhi', 'indian aunty', 'desi homemade', 'hindi audio', 'pakistani mms'];
  const peers = [
    ...tagWords.filter((t) => t.toLowerCase() !== primary.toLowerCase()),
    ...fallbackPool.filter((t) => t.toLowerCase() !== primary.toLowerCase()),
  ];

  return {
    type: combined.includes('desi') || combined.includes('indian') ? 'desi' : 'category',
    primarySubject: primary,
    similarQuery: primary,
    peerQueries: rotateArray(peers, seed).slice(0, 3),
  };
}

export function trackUserInterest(terms: string[]): void {
  if (typeof window === 'undefined' || !Array.isArray(terms)) return;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    for (const term of terms) {
      const clean = term.trim().toLowerCase();
      if (clean.length >= 2) {
        map[clean] = (map[clean] || 0) + 1;
      }
    }
    localStorage.setItem(PREFS_KEY, JSON.stringify(map));
  } catch {}
}

export function getTopPreferences(limit: number = 5): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return [];
    const map: Record<string, number> = JSON.parse(raw);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term]) => term);
  } catch {
    return [];
  }
}

export function recordWatchedVideo(video: StoredVideo): void {
  if (typeof window === 'undefined' || !video?.id) return;
  try {
    const ctx = resolveContentContext(video.title || '', video.keywords || '');
    trackUserInterest([ctx.primarySubject, ...(ctx.peerQueries.slice(0, 1))]);
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: StoredVideo[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item) => item.id !== video.id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([video, ...filtered].slice(0, 20)));
  } catch {}
}

export function getWatchHistory(limit: number = 5): StoredVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: StoredVideo[] = raw ? JSON.parse(raw) : [];
    return list.slice(0, limit);
  } catch {
    return [];
  }
}
