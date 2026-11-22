export interface StoredVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
  keywords?: string;
}

const PREFS_KEY = 'hubtube_user_tags_v1';
const HISTORY_KEY = 'hubtube_watch_history_v1';
const VIDEO_SNAPSHOT_PREFIX = 'hubtube_video_snap_v1_';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function trackUserInterest(terms: string[]): void {
  if (!isBrowser()) return;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    for (const term of terms) {
      const clean = term.trim().toLowerCase();
      if (clean.length >= 3 && clean.length <= 40) {
        map[clean] = (map[clean] || 0) + 1;
      }
    }
    // Keep top 40 most relevant terms
    const sorted = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);
    localStorage.setItem(PREFS_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch {
    // Ignore storage quota errors
  }
}

export function getTopPreferences(limit = 5): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return [];
    const map: Record<string, number> = JSON.parse(raw);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  } catch {
    return [];
  }
}

export function recordWatchedVideo(video: StoredVideo): void {
  if (!isBrowser() || !video.id) return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: StoredVideo[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((v) => v.id !== video.id);
    const updated = [video, ...filtered].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    const interestTerms: string[] = [];
    if (video.keywords) {
      video.keywords
        .split(',')
        .slice(0, 5)
        .forEach((k) => interestTerms.push(k));
    } else if (video.title) {
      video.title
        .split(/\s+/)
        .filter((w) => w.length >= 4)
        .slice(0, 3)
        .forEach((w) => interestTerms.push(w));
    }
    if (interestTerms.length > 0) trackUserInterest(interestTerms);
  } catch {
    // Ignore storage errors
  }
}

export function getWatchHistory(limit = 10): StoredVideo[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list: StoredVideo[] = JSON.parse(raw);
    return Array.isArray(list) ? list.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function saveVideoRelatedSnapshot(videoId: string, related: StoredVideo[]): void {
  if (!isBrowser() || !videoId || related.length === 0) return;
  try {
    localStorage.setItem(
      `${VIDEO_SNAPSHOT_PREFIX}${videoId}`,
      JSON.stringify(related.slice(0, 30))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getVideoRelatedSnapshot(videoId: string): StoredVideo[] | null {
  if (!isBrowser() || !videoId) return null;
  try {
    const raw = localStorage.getItem(`${VIDEO_SNAPSHOT_PREFIX}${videoId}`);
    if (!raw) return null;
    const parsed: StoredVideo[] = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}
