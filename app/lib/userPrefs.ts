import { saveCloudWatchHistory } from './authHistory';

export interface StoredVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min?: number | string;
  length_sec?: number | string;
  embed?: string;
  views?: string | number;
  keywords?: string;
  added?: string;
}

const PREFS_KEY = 'hubtube_user_prefs_v1';
const HISTORY_KEY = 'hubtube_local_history_v1';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'in', 'on', 'of', 'to', 'a', 'an', 'is', 'at',
  'by', 'from', 'her', 'his', 'she', 'he', 'it', 'this', 'that', 'video',
  'videos', 'porn', 'hd', '1080p', '720p', '4k', '60fps', 'free', 'new', 'full',
  'sex', 'xxx', 'mp4', 'watch', 'online', 'streaming', 'stream', 'clip', 'clips',
  'part', 'vol', 'episode', 'ep', 'latest', 'best', 'top', 'hot', 'real', 'very',
  'get', 'gets', 'got', 'out', 'all', 'you', 'your', 'are', 'was', 'has', 'have',
  'can', 'will', 'just', 'like', 'more', 'most', 'some', 'such', 'into', 'over',
  'after', 'before', 'between', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'both', 'each', 'few', 'other',
  'only', 'own', 'same', 'than', 'too', 'very', 'hubtube', 'xvideos', 'eporner',
]);

export function normalizeTitleKey(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 60);
}

export function trackUserInterest(terms: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    for (const term of terms) {
      const clean = term.trim().toLowerCase();
      if (clean && clean.length >= 2) {
        map[clean] = (map[clean] || 0) + 1;
      }
    }
    localStorage.setItem(PREFS_KEY, JSON.stringify(map));
  } catch {}
}

export function getTopPreferences(limit: number = 5): string[] {
  if (typeof window === 'undefined') return ['desi', 'mms'];
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return ['desi', 'mms'];
    const map: Record<string, number> = JSON.parse(raw);
    const sorted = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, limit);
    return sorted.length > 0 ? sorted : ['desi', 'mms'];
  } catch {
    return ['desi', 'mms'];
  }
}

export function recordWatchedVideo(video: StoredVideo) {
  if (!video?.id) return;
  saveCloudWatchHistory(video);
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: StoredVideo[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item) => item.id !== video.id);
    filtered.unshift({
      id: video.id,
      title: video.title,
      default_thumb: video.default_thumb,
      length_min: video.length_min,
      length_sec: video.length_sec,
      views: video.views,
      keywords: video.keywords,
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 30)));
    if (video.keywords) {
      trackUserInterest(video.keywords.split(',').slice(0, 5));
    }
  } catch {}
}

export function getWatchHistory(limit: number = 10): StoredVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list: StoredVideo[] = JSON.parse(raw);
    return Array.isArray(list) ? list.slice(0, limit) : [];
  } catch {
    return [];
  }
}

function isDistinctTopic(candidate: string, chosen: string[]): boolean {
  const cTokens = candidate.split(/\s+/).filter(Boolean);
  if (cTokens.length === 0) return false;
  for (const existing of chosen) {
    if (existing === candidate) return false;
    // Prevent near-duplicates like "desi" and "desi bhabhi" or "bhabhi" and "indian bhabhi" sharing the exact same sole root
    if (cTokens.length === 1 && existing.split(/\s+/).includes(cTokens[0])) {
      return false;
    }
    if (existing.split(/\s+/).length === 1 && cTokens.includes(existing)) {
      return false;
    }
  }
  return true;
}

export function extractSmartTopics(
  title: string,
  keywords: string = ''
): { topics: string[]; comboQuery: string } {
  const rawCandidates: string[] = [];

  // 1. Prioritize clean multi-word tags from video metadata first (e.g., "desi bhabhi", "hindi audio", "big tits")
  if (keywords) {
    const tagList = keywords
      .split(',')
      .map((k) =>
        k
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((clean) => {
        if (!clean || clean.length < 3 || /^\d+$/.test(clean)) return false;
        const words = clean.split(' ').filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
        return words.length >= 1 && words.length <= 3;
      })
      .map((clean) =>
        clean
          .split(' ')
          .filter((w) => !STOP_WORDS.has(w))
          .join(' ')
      )
      .filter((clean) => clean.length >= 3);

    // Multi-word phrases first for higher specificity, then single keywords
    const multiWord = tagList.filter((t) => t.includes(' '));
    const singleWord = tagList.filter((t) => !t.includes(' '));
    rawCandidates.push(...multiWord, ...singleWord);
  }

  // 2. Extract bigrams (2-word phrases) and strong keywords from the video title
  const titleWords = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOP_WORDS.has(w));

  for (let i = 0; i < titleWords.length - 1; i++) {
    rawCandidates.push(`${titleWords[i]} ${titleWords[i + 1]}`);
  }
  rawCandidates.push(...titleWords);

  // 3. Pick up to 6 genuinely distinct topics (no overlapping duplicates)
  const topics: string[] = [];
  for (const cand of rawCandidates) {
    if (isDistinctTopic(cand, topics)) {
      topics.push(cand);
    }
    if (topics.length >= 6) break;
  }

  if (topics.length === 0) {
    return { topics: ['desi bhabhi', 'viral mms', 'indian homemade', 'amateur'], comboQuery: 'desi bhabhi mms' };
  }

  const comboQuery = topics.slice(0, 2).join(' ');
  return { topics, comboQuery };
}

export function rankAndBlendSimilarVideos<T extends StoredVideo>(
  batches: T[][],
  topics: string[],
  excludeIds: Set<string>,
  excludeTitles: Set<string>,
  limit: number = 25
): T[] {
  const pool: T[] = [];
  const localIds = new Set(excludeIds);
  const localTitles = new Set(excludeTitles);
  const localThumbs = new Set<string>();

  // Round-robin interleave across every topic batch so all topics are equally represented
  const maxLen = batches.reduce((m, b) => Math.max(m, b.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      const v = batch[i];
      if (!v?.id || !v?.title) continue;
      const norm = normalizeTitleKey(v.title);
      const thumb = v.default_thumb?.src?.trim() || '';
      if (!localIds.has(v.id) && !localTitles.has(norm) && (!thumb || !localThumbs.has(thumb))) {
        localIds.add(v.id);
        localTitles.add(norm);
        if (thumb) localThumbs.add(thumb);
        pool.push(v);
      }
      if (pool.length >= limit) break;
    }
    if (pool.length >= limit) break;
  }

  const lowerTopics = topics.map((t) => t.toLowerCase());
  // Keep round-robin diversity while giving a light boost to multi-topic matches
  return pool.slice(0, limit).sort((a, b) => {
    const textA = `${a.title} ${a.keywords || ''}`.toLowerCase();
    const textB = `${b.title} ${b.keywords || ''}`.toLowerCase();
    let hitsA = 0;
    let hitsB = 0;
    for (const t of lowerTopics) {
      if (textA.includes(t)) hitsA += 1;
      if (textB.includes(t)) hitsB += 1;
    }
    if (Math.abs(hitsA - hitsB) >= 2) {
      return hitsB - hitsA;
    }
    return 0;
  });
}