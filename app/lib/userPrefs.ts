export interface StoredVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min: number | string;
  length_sec: number | string;
  embed?: string;
  views?: string | number;
  keywords?: string;
  added?: string;
}

export interface SmartTopicContext {
  topics: string[];       // e.g. ["Angela White", "Big Boobs", "Anal"]
  comboQuery: string;     // e.g. "Angela White Big Boobs"
  displayLabel: string;   // e.g. "Similar Videos • Angela White, Big Boobs, Anal"
}

const PREFS_KEY = 'hubtube_user_prefs_v1';
const HISTORY_KEY = 'hubtube_watch_history_v1';

// Recognized multi-word phrases & pornstars (checked first so they stay intact)
const MULTI_WORD_CONCEPTS: string[] = [
  // Popular Pornstars
  'Angela White', 'Mia Khalifa', 'Sunny Leone', 'Riley Reid', 'Lana Rhoades',
  'Abella Danger', 'Ava Addams', 'Brandi Love', 'Cory Chase', 'Lisa Ann',
  'Kendra Lust', 'Cherie DeVille', 'Mia Malkova', 'Adriana Chechik', 'Dani Daniels',
  'Violet Myers', 'Savannah Bond', 'Natasha Nice', 'Gabbie Carter', 'Blake Blossom',
  'Lena Paul', 'Valentina Nappi', 'Anissa Kate', 'Little Caprice', 'Alexis Texas',
  'Nicole Aniston', 'Lexi Luna', 'Emily Willis', 'Kenzie Reeves', 'Lulu Chu',
  'Hazel Moore', 'Skylar Vox', 'Eliza Ibarra', 'Julia Ann', 'Phoenix Marie',
  'Priya Rai', 'Nadia Ali', 'Sahara Knite', 'Romi Rain', 'Sara Jay',
  'Johnny Sins', 'Kissa Sins', 'Dillion Harper', 'Aidra Fox', 'Mandy Muse',
  'Jada Stevens', 'Alura Jenson', 'Reagan Foxx', 'Ariella Ferrera', 'Alex Mack',
  'Autumn Falls', 'Eva Lovia', 'Bridgette B', 'Piper Perri', 'Elsa Jean',
  // Desi & Indian Multi-word Niches
  'Desi Bhabhi', 'Indian Bhabhi', 'Desi Aunty', 'Indian Aunty', 'Desi MMS',
  'Viral Desi', 'Pakistani MMS', 'Hindi Audio', 'Punjabi Desi', 'Punjabi Kudi',
  'Desi Couple', 'Desi Homemade', 'Desi College', 'Desi Village', 'Desi Saree',
  'Bhabhi Devar', 'South Indian', 'Bengali Bhabhi', 'Marathi Bhabhi', 'Gujarati Aunty',
  'Mallu Aunty', 'Bhojpuri Desi', 'Indian Wife', 'Desi Wife', 'Desi Girl',
  'Hidden Cam', 'Suhag Raat', 'Leaked Scandal', 'Stripchat Cam',
  // Global Multi-word Niches
  'Big Boobs', 'Big Tits', 'Big Ass', 'Big Dick', 'Double Penetration',
  'Reverse Cowgirl', 'Deep Throat', 'Step Mom', 'Step Sister', 'Step Daughter',
  'Group Sex', 'Gang Bang', 'Red Head', 'Small Tits', 'Older Men',
  'Solo Girl', 'Web Series', 'Hotel Room', 'Father In Law', 'Live Cam',
];

// High-signal single-word categories/attributes
const SINGLE_WORD_CONCEPTS: string[] = [
  'anal', 'milf', 'pov', 'creampie', 'blowjob', 'threesome', 'lesbian',
  'amateur', 'homemade', 'hardcore', 'teen', 'petite', 'bbw', 'curvy',
  'busty', 'blonde', 'brunette', 'redhead', 'asian', 'japanese', 'latina',
  'ebony', 'indian', 'desi', 'pakistani', 'bhabhi', 'aunty', 'saree',
  'mms', 'punjabi', 'hindi', 'tamil', 'telugu', 'bengali', 'mallu',
  'squirt', 'massage', 'lingerie', 'public', 'outdoor', 'office', 'hotel',
  'college', 'wife', 'cheating', 'mature', 'housewife', 'webcam', 'solo',
  'bdsm', 'fetish', 'interracial', 'cumshot', 'handjob', 'footjob', 'orgy',
  'cowgirl', 'doggy', 'dp', 'shemale', 'hentai', 'vr', '60fps', '4k',
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'her', 'his', 'she',
  'him', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'hot', 'free',
  'video', 'videos', 'full', 'new', 'best', 'xxx', 'porn', 'sex', 'hd',
  '1080p', '720p', 'mp4', 'watch', 'online', 'scene', 'clip', 'part',
  'uncut', 'movie', 'fuck', 'fucked', 'fucking', 'gets', 'shows', 'deep',
  'hard', 'very', 'sexy', 'real', 'super', 'ultra', 'best', 'top',
]);

// Common typo normalization (e.g. "angelina white" -> "Angela White")
const ALIAS_MAP: Record<string, string> = {
  'angelina white': 'Angela White',
  'angela whit': 'Angela White',
  'big titts': 'Big Tits',
  'big boob': 'Big Boobs',
  'boobs': 'Big Boobs',
  'tits': 'Big Tits',
  'titts': 'Big Tits',
  'bhabhi ji': 'Desi Bhabhi',
  'stepmom': 'Step Mom',
  'stepsister': 'Step Sister',
};

function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeTitleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 48);
}

export function extractSmartTopics(
  titleOrQuery: string,
  keywords: string = ''
): SmartTopicContext {
  let text = `${titleOrQuery} ${keywords}`.toLowerCase();

  // Fix common typos/aliases before matching
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (text.includes(alias)) {
      text = text.replace(new RegExp(alias, 'gi'), canonical.toLowerCase());
    }
  }

  const found: string[] = [];
  const seenLower = new Set<string>();

  const addTopic = (raw: string) => {
    const clean = raw.trim();
    const lower = clean.toLowerCase();
    if (!clean || lower.length < 2 || seenLower.has(lower)) return;
    // Avoid adding a single word already covered by an existing multi-word topic (e.g., "desi" if "Desi Bhabhi" is present)
    if (!lower.includes(' ') && found.some((t) => t.toLowerCase().split(' ').includes(lower))) {
      return;
    }
    seenLower.add(lower);
    found.push(toTitleCase(clean));
  };

  // 1. Match multi-word pornstars & niches first
  for (const concept of MULTI_WORD_CONCEPTS) {
    if (text.includes(concept.toLowerCase())) {
      addTopic(concept);
      if (found.length >= 4) break;
    }
  }

  // 2. Match high-signal single-word categories/attributes
  if (found.length < 4) {
    const wordSet = new Set(text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
    for (const single of SINGLE_WORD_CONCEPTS) {
      if (wordSet.has(single)) {
        addTopic(single);
        if (found.length >= 4) break;
      }
    }
  }

  // 3. Fallback to meaningful keywords or title words if fewer than 2 topics found
  if (found.length < 2) {
    const kwParts = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length >= 3 && !STOP_WORDS.has(k.toLowerCase()));
    for (const kw of kwParts) {
      addTopic(kw);
      if (found.length >= 3) break;
    }
  }

  if (found.length === 0) {
    const titleWords = titleOrQuery
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()));
    for (const w of titleWords.slice(0, 2)) {
      addTopic(w);
    }
  }

  if (found.length === 0) {
    found.push('Desi Bhabhi', 'Indian', 'Homemade');
  }

  const topics = found.slice(0, 4);
  const comboQuery = topics.length >= 2 ? `${topics[0]} ${topics[1]}` : topics[0];
  const displayLabel = `Similar Videos • ${topics.join(' · ')}`;

  return { topics, comboQuery, displayLabel };
}

/**
 * Merges videos from multiple topic batches, deduplicates by ID & normalized title,
 * scores each video by how many of the user's extracted topics it matches,
 * and interleaves results so every topic is represented logically.
 */
export function rankAndBlendSimilarVideos<
  T extends { id: string; title: string; keywords?: string; default_thumb?: { src?: string } }
>(
  batches: T[][],
  topics: string[],
  excludeIds: Set<string>,
  excludeTitles: Set<string>,
  limit: number = 25
): T[] {
  const seenIds = new Set<string>(excludeIds);
  const seenTitles = new Set<string>(excludeTitles);
  const lowerTopics = topics.map((t) => t.toLowerCase());

  // Interleave batches round-robin so no single topic hogs all slots
  const interleaved: T[] = [];
  const maxLen = Math.max(0, ...batches.map((b) => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      if (batch[i]) interleaved.push(batch[i]);
    }
  }

  const scored: Array<{ video: T; score: number; order: number }> = [];

  for (let idx = 0; idx < interleaved.length; idx++) {
    const v = interleaved[idx];
    const thumb = v?.default_thumb?.src?.trim() || '';
    if (!v?.id || !v?.title || !thumb.startsWith('http')) continue;

    const norm = normalizeTitleKey(v.title);
    if (seenIds.has(v.id) || seenTitles.has(norm)) continue;

    seenIds.add(v.id);
    seenTitles.add(norm);

    const haystack = `${v.title} ${v.keywords || ''}`.toLowerCase();
    let score = 0;
    for (let tIdx = 0; tIdx < lowerTopics.length; tIdx++) {
      if (haystack.includes(lowerTopics[tIdx])) {
        // Slightly prioritize the first (most specific) topic while rewarding multi-topic overlap
        score += tIdx === 0 ? 3 : 2;
      }
    }

    scored.push({ video: v, score, order: idx });
  }

  // Multi-topic matches float to top; ties preserve balanced round-robin interleaving
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.slice(0, limit).map((item) => item.video);
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
    const ctx = extractSmartTopics(video.title || '', video.keywords || '');
    trackUserInterest(ctx.topics.slice(0, 3));
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
