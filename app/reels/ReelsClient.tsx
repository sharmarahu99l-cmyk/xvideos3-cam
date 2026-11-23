'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { trackUserInterest, normalizeTitleKey } from '../lib/userPrefs';

export interface ReelVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  thumbs?: Array<{ src?: string; width?: number; height?: number }>;
  length_min?: number | string;
  length_sec?: number | string;
  views?: string | number;
  keywords?: string;
}

type SearchHint = {
  label: string;
  type: 'category' | 'pornstar' | 'desi' | 'video';
};

interface ReelCategoryPill {
  label: string;
  query: string;
}

const FOR_YOU_KEY = '__for_you_fresh__';
const LIKES_KEY = 'hubtube_reel_likes_v1';
const SEEN_REELS_KEY = 'hubtube_seen_reels_ep_v1';
const UNMUTED_PREF_KEY = 'hubtube_reels_unmuted_v1';

const TOPIC_ROTATION_POOL = [
  'mms', 'leaked mms', 'desi mms', 'desi bhabhi', 'viral', 'indian homemade',
  'amateur', 'punjabi', 'hindi audio', 'desi couple', '4k', 'asian',
  'milf', 'big tits', 'homemade', 'latina', 'teen', 'pov', 'indian aunty',
  'japanese', 'big ass', 'hardcore', 'solo', 'massage',
];

const INSTANT_DESI = [
  'MMS', 'Leaked MMS', 'Desi MMS', 'Viral MMS', 'Desi', 'Desi Bhabhi',
  'Desi Aunty', 'Indian Bhabhi', 'Indian Homemade', 'Punjabi Desi',
  'Pakistani MMS', 'Hindi Audio', 'Desi Couple', 'Desi College Girl',
  'South Indian Desi', 'Tamil Desi', 'Bengali Bhabhi', 'Mallu Aunty',
];

const INSTANT_CATEGORIES = [
  'Amateur', 'Homemade', '4K', '1080p', '60 FPS', 'Asian', 'Japanese',
  'Korean', 'Latina', 'Ebony', 'Russian', 'Indian', 'Arab', 'Anal',
  'Big Tits', 'Big Ass', 'MILF', 'Teen', 'Petite', 'Blonde', 'Brunette',
  'POV', 'Creampie', 'Hardcore', 'Threesome', 'Lesbian', 'Public',
  'Massage', 'Lingerie', 'Solo', 'VR Porn',
];

const INSTANT_PORNSTARS = [
  'Angela White', 'Riley Reid', 'Mia Khalifa', 'Lana Rhoades', 'Abella Danger',
  'Dani Daniels', 'Ava Addams', 'Cory Chase', 'Violet Myers', 'Lena Paul',
  'Valentina Nappi', 'Adriana Chechik', 'Savannah Bond', 'Mia Malkova',
  'Alexis Fawx', 'Blake Blossom', 'Little Caprice', 'Kendra Lust',
  'Eva Elfie', 'Sweetie Fox', 'Rae Lil Black', 'Sunny Leone', 'Johnny Sins',
];

const HINT_BADGE: Record<SearchHint['type'], { text: string; cls: string }> = {
  desi: { text: 'MMS/DESI', cls: 'bg-[#FF9900]/20 text-[#FF9900]' },
  category: { text: 'CAT', cls: 'bg-blue-500/20 text-blue-300' },
  pornstar: { text: 'STAR', cls: 'bg-pink-500/20 text-pink-300' },
  video: { text: 'REEL', cls: 'bg-neutral-700 text-neutral-300' },
};

const PILL_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'in', 'on', 'of', 'to', 'a', 'an', 'is', 'at',
  'by', 'from', 'her', 'his', 'she', 'he', 'it', 'this', 'that', 'video',
  'videos', 'porn', 'hd', '1080p', '720p', '60fps', 'free', 'new', 'full',
  'sex', 'xxx', 'mp4', 'watch', 'online', 'clip', 'clips', 'part', 'latest',
  'best', 'top', 'hot', 'real', 'very', 'get', 'gets', 'out', 'all', 'you',
]);

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_REELS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function rememberSeenIds(ids: string[]) {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    const existing = Array.from(getSeenIds());
    const merged = Array.from(new Set([...ids, ...existing])).slice(0, 400);
    localStorage.setItem(SEEN_REELS_KEY, JSON.stringify(merged));
  } catch {}
}

function deriveTopPillsFromVideos(
  list: ReelVideo[],
  activeSearch: string
): ReelCategoryPill[] {
  const pills: ReelCategoryPill[] = [{ label: '🔥 For You', query: FOR_YOU_KEY }];
  const seen = new Set<string>([FOR_YOU_KEY]);

  if (activeSearch.trim()) {
    const lower = activeSearch.trim().toLowerCase();
    seen.add(lower);
    pills.push({
      label: activeSearch.trim().charAt(0).toUpperCase() + activeSearch.trim().slice(1),
      query: lower,
    });
  }

  const freq = new Map<string, number>();

  for (const v of list.slice(0, 20)) {
    if (v.keywords) {
      for (const rawTag of v.keywords.split(',')) {
        const clean = rawTag
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const words = clean.split(' ').filter((w) => w.length >= 3 && !PILL_STOP_WORDS.has(w));
        if (words.length >= 1 && words.length <= 2) {
          const phrase = words.join(' ');
          if (phrase.length >= 3 && !/^\d+$/.test(phrase)) {
            freq.set(phrase, (freq.get(phrase) || 0) + 3);
          }
        }
      }
    }

    const titleWords = (v.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !PILL_STOP_WORDS.has(w));

    for (const w of titleWords) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  const rankedTopics = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  for (const topic of rankedTopics) {
    if (seen.has(topic)) continue;
    const overlaps = Array.from(seen).some(
      (s) => s !== FOR_YOU_KEY && (s.includes(topic) || topic.includes(s))
    );
    if (overlaps) continue;

    seen.add(topic);
    pills.push({
      label: topic
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      query: topic,
    });
    if (pills.length >= 8) break;
  }

  for (const fallback of shuffleArray(TOPIC_ROTATION_POOL)) {
    if (pills.length >= 7) break;
    if (!seen.has(fallback)) {
      seen.add(fallback);
      pills.push({
        label: fallback
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        query: fallback,
      });
    }
  }

  return pills;
}

function getInstantReelHints(query: string): SearchHint[] {
  const lowerQ = query.trim().toLowerCase();
  if (!lowerQ) return [];

  const seen = new Set<string>();
  const out: SearchHint[] = [];

  const addMatches = (list: string[], type: SearchHint['type']) => {
    for (const item of list) {
      const k = item.toLowerCase();
      if (k.startsWith(lowerQ) && !seen.has(k)) {
        seen.add(k);
        out.push({ label: item, type });
      }
    }
    for (const item of list) {
      const k = item.toLowerCase();
      if (!k.startsWith(lowerQ) && k.includes(lowerQ) && !seen.has(k)) {
        seen.add(k);
        out.push({ label: item, type });
      }
    }
  };

  addMatches(INSTANT_DESI, 'desi');
  addMatches(INSTANT_CATEGORIES, 'category');
  addMatches(INSTANT_PORNSTARS, 'pornstar');
  return out;
}

function formatDuration(lengthSec?: number | string, lengthMin?: number | string): string {
  const totalSecs = Number(lengthSec);
  if (!Number.isNaN(totalSecs) && totalSecs > 0) {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
  if (typeof lengthMin === 'string' && lengthMin.includes(':')) {
    return lengthMin.trim();
  }
  const minsNum = Number(lengthMin);
  if (!Number.isNaN(minsNum) && minsNum > 0) {
    return `${Math.floor(minsNum)}:00`;
  }
  return 'HD';
}

function validThumb(v: ReelVideo): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  return Boolean(v?.id && v?.title && src.startsWith('http'));
}

function sendPlayerCommand(
  iframe: HTMLIFrameElement | null,
  cmd: 'play' | 'pause' | 'mute' | 'unmute'
) {
  if (!iframe?.contentWindow) return;
  const vol = cmd === 'mute' ? 0 : 100;
  const messages =
    cmd === 'play' || cmd === 'pause'
      ? [
          { method: cmd },
          { command: cmd },
          { action: cmd },
          { event: 'command', func: cmd === 'play' ? 'playVideo' : 'pauseVideo', args: [] },
        ]
      : [
          { method: cmd },
          { command: cmd },
          { action: cmd },
          { method: 'setVolume', value: vol },
          { command: 'volume', value: vol },
          { event: 'command', func: cmd === 'unmute' ? 'unMute' : 'mute', args: [] },
        ];

  for (const m of messages) {
    try {
      iframe.contentWindow.postMessage(m, '*');
      iframe.contentWindow.postMessage(JSON.stringify(m), '*');
    } catch {}
  }
}

async function fetchReelsFromEpornerApi(
  query: string,
  pageNum: number,
  order: 'top-weekly' | 'latest' | 'most-popular'
): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      `/api/reels-feed?q=${encodeURIComponent(query)}&page=${pageNum}&order=${order}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return (data as ReelVideo[]).filter(validThumb);
      }
    }
  } catch {}

  try {
    const direct = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        query
      )}&per_page=16&page=${pageNum}&order=${order}&lq=0&thumbsize=big&format=json`,
      { cache: 'no-store' }
    );
    if (direct.ok) {
      const data = await direct.json();
      return Array.isArray(data?.videos)
        ? (data.videos as ReelVideo[]).filter(validThumb)
        : [];
    }
  } catch {}

  return [];
}

async function fetchFreshUniqueBatch(
  categoryQuery: string,
  sessionExcludeIds: Set<string>,
  isFirstPage: boolean = false
): Promise<ReelVideo[]> {
  const storedSeen = getSeenIds();
  const orders: Array<'top-weekly' | 'latest' | 'most-popular'> = [
    'top-weekly',
    'latest',
    'most-popular',
  ];

  let batches: ReelVideo[][] = [];

  if (categoryQuery === FOR_YOU_KEY) {
    const randomTopics = shuffleArray(TOPIC_ROTATION_POOL).slice(0, 3);
    batches = await Promise.all(
      randomTopics.map((topic, idx) => {
        const randPage = Math.floor(Math.random() * 12) + 1;
        return fetchReelsFromEpornerApi(topic, randPage, orders[idx % orders.length]);
      })
    );
  } else {
    const pageA = isFirstPage ? 1 : Math.floor(Math.random() * 5) + 1;
    const pageB = pageA + 1;
    batches = await Promise.all([
      fetchReelsFromEpornerApi(categoryQuery, pageA, 'most-popular'),
      fetchReelsFromEpornerApi(categoryQuery, pageB, 'top-weekly'),
    ]);
  }

  const seenIds = new Set<string>(sessionExcludeIds);
  const seenTitles = new Set<string>();
  const freshUnseen: ReelVideo[] = [];
  const fallbackSeen: ReelVideo[] = [];

  const maxLen = batches.reduce((m, b) => Math.max(m, b.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      const item = batch[i];
      if (!item || seenIds.has(item.id)) continue;
      const normTitle = normalizeTitleKey(item.title);
      if (seenTitles.has(normTitle)) continue;

      seenIds.add(item.id);
      seenTitles.add(normTitle);

      if (!storedSeen.has(item.id)) {
        freshUnseen.push(item);
      } else {
        fallbackSeen.push(item);
      }
    }
  }

  const finalList = shuffleArray(
    freshUnseen.length >= 6 ? freshUnseen : [...freshUnseen, ...fallbackSeen]
  );

  rememberSeenIds(finalList.map((v) => v.id));
  return finalList;
}

export default function ReelsClient({ initialVideos }: { initialVideos: ReelVideo[] }) {
  const validInitial = initialVideos.filter(validThumb);

  const [videos, setVideos] = useState<ReelVideo[]>(validInitial);
  const [activeCategory, setActiveCategory] = useState<string>(FOR_YOU_KEY);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [dynamicPills, setDynamicPills] = useState<ReelCategoryPill[]>(() =>
    deriveTopPillsFromVideos(validInitial, '')
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(validInitial.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string>('');

  // Persistent Sound State & Play/Pause State
  const [isUnmuted, setIsUnmuted] = useState<boolean>(false);
  const [isFullFill, setIsFullFill] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playSession, setPlaySession] = useState<number>(0);

  // Search bar resets empty on refresh
  const [searchInput, setSearchInput] = useState<string>('');
  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);

  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const activeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadingMoreRef = useRef<boolean>(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const programmaticScrollLockRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      const rawLikes = localStorage.getItem(LIKES_KEY);
      if (rawLikes) setLikedIds(JSON.parse(rawLikes));

      const rawUnmuted = localStorage.getItem(UNMUTED_PREF_KEY);
      if (rawUnmuted === 'true') setIsUnmuted(true);
    } catch {}

    if (validInitial.length > 0) {
      rememberSeenIds(validInitial.map((v) => v.id));
    } else {
      setLoading(true);
      fetchFreshUniqueBatch(FOR_YOU_KEY, new Set(), true).then((batch) => {
        setVideos(batch);
        setDynamicPills(deriveTopPillsFromVideos(batch, ''));
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically start playing whenever swiping to a new reel
  useEffect(() => {
    setIsPaused(false);
  }, [activeIndex]);

  // Enforce mute/unmute state on the active player
  useEffect(() => {
    if (isPaused) return;
    const cmd = isUnmuted ? 'unmute' : 'mute';
    sendPlayerCommand(activeIframeRef.current, cmd);
    const t1 = setTimeout(() => sendPlayerCommand(activeIframeRef.current, cmd), 450);
    const t2 = setTimeout(() => sendPlayerCommand(activeIframeRef.current, cmd), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isUnmuted, activeIndex, isPaused, playSession]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowHints(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!showHints || trimmed.length === 0) {
      setHints([]);
      setActiveHintIdx(-1);
      return;
    }

    const local = getInstantReelHints(trimmed);
    setHints(local);
    setActiveHintIdx(-1);

    const timer = setTimeout(async () => {
      if (suggestAbortRef.current) suggestAbortRef.current.abort();
      const controller = new AbortController();
      suggestAbortRef.current = controller;

      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: { hints?: SearchHint[] } = await res.json();
        if (Array.isArray(data.hints) && data.hints.length > 0) {
          const seen = new Set(local.map((h) => h.label.toLowerCase()));
          const extra = data.hints.filter((h) => !seen.has(h.label.toLowerCase()));
          setHints([...local, ...extra].slice(0, 10));
        }
      } catch {}
    }, 140);

    return () => clearTimeout(timer);
  }, [searchInput, showHints]);

  useEffect(() => {
    const container = feedRef.current;
    if (!container || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollLockRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.65,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos]);

  useEffect(() => {
    if (
      videos.length > 0 &&
      activeIndex >= videos.length - 3 &&
      !loadingMoreRef.current
    ) {
      loadingMoreRef.current = true;
      setLoadingMore(true);

      const currentIds = new Set(videos.map((v) => v.id));
      fetchFreshUniqueBatch(activeCategory, currentIds, false).then((more) => {
        setVideos((prev) => {
          const seen = new Set(prev.map((v) => v.id));
          const unique = more.filter((v) => !seen.has(v.id));
          return [...prev, ...unique];
        });
        setLoadingMore(false);
        loadingMoreRef.current = false;
      });
    }
  }, [activeIndex, videos, activeCategory]);

  const scrollToReel = useCallback(
    (targetIdx: number) => {
      const safe = Math.max(0, Math.min(videos.length - 1, targetIdx));
      const el = itemRefs.current[safe];
      if (!el) return;

      programmaticScrollLockRef.current = true;
      setActiveIndex(safe);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setTimeout(() => {
        programmaticScrollLockRef.current = false;
      }, 550);
    },
    [videos.length]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToReel(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToReel(activeIndex - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, scrollToReel]);

  const handleTogglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPaused((prev) => {
      const nextPaused = !prev;
      if (!nextPaused) {
        setPlaySession((s) => s + 1);
      }
      return nextPaused;
    });
  };

  const toggleGlobalSound = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextUnmuted = !isUnmuted;
    setIsUnmuted(nextUnmuted);
    if (isPaused) {
      setIsPaused(false);
      setPlaySession((s) => s + 1);
    }
    try {
      localStorage.setItem(UNMUTED_PREF_KEY, String(nextUnmuted));
    } catch {}
    sendPlayerCommand(activeIframeRef.current, nextUnmuted ? 'unmute' : 'mute');
    setToast(nextUnmuted ? '🔊 Sound On' : '🔇 Muted');
    setTimeout(() => setToast(''), 1500);
  };

  const executeReelSearch = async (rawTerm: string) => {
    const clean = rawTerm.trim();
    setShowHints(false);
    if (!clean) return;

    const lower = clean.toLowerCase();
    trackUserInterest([lower]);

    setSearchInput(clean);
    setActiveSearchQuery(clean);
    setActiveCategory(lower);
    setLoading(true);
    setActiveIndex(0);
    setIsPaused(false);

    const batch = await fetchFreshUniqueBatch(lower, new Set(), true);
    setVideos(batch);
    setDynamicPills(deriveTopPillsFromVideos(batch, clean));
    setLoading(false);

    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeReelSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showHints || hints.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeReelSearch(searchInput);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveHintIdx((prev) => (prev + 1) % hints.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveHintIdx((prev) => (prev <= 0 ? hints.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeHintIdx >= 0 && hints[activeHintIdx]) {
        executeReelSearch(hints[activeHintIdx].label);
      } else {
        executeReelSearch(searchInput);
      }
    } else if (e.key === 'Escape') {
      setShowHints(false);
    }
  };

  const handleCategoryChange = async (query: string) => {
    if (query === activeCategory) return;
    setActiveCategory(query);
    if (query === FOR_YOU_KEY) {
      setActiveSearchQuery('');
      setSearchInput('');
    }
    setLoading(true);
    setActiveIndex(0);
    setIsPaused(false);

    const batch = await fetchFreshUniqueBatch(query, new Set(), true);
    setVideos(batch);
    if (query === FOR_YOU_KEY) {
      setDynamicPills(deriveTopPillsFromVideos(batch, ''));
    }
    setLoading(false);

    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const toggleLike = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    setLikedIds((prev) => {
      const next = { ...prev, [videoId]: !prev[videoId] };
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShare = async (e: React.MouseEvent, video: ReelVideo) => {
    e.stopPropagation();
    const url = `${window.location.origin}/reels?start=${encodeURIComponent(video.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Reel link copied!');
      setTimeout(() => setToast(''), 2000);
    } catch {}
  };

  const activeBadgeText =
    activeCategory === FOR_YOU_KEY
      ? '🔥 FOR YOU'
      : `🔥 ${activeCategory.toUpperCase()}`;

  return (
    <div className="relative h-[100dvh] w-full bg-black text-white overflow-hidden select-none">
      {/* Sleek Top Overlay (Single Mute/Unmute button kept only on right action rail) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/55 to-transparent pt-2.5 pb-4 px-3 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1 bg-black/55 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1 rounded-full text-xs font-black border border-white/15 backdrop-blur-md transition shrink-0"
          >
            <span>←</span>
            <span>HOME</span>
          </Link>

          <div className="flex items-center gap-0.5 text-base font-black tracking-tight drop-shadow">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">REELS</span>
          </div>

          <Link
            href="/history"
            className="bg-black/55 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1 rounded-full text-xs font-bold border border-white/15 backdrop-blur-md transition shrink-0"
          >
            🕒 History
          </Link>
        </div>

        <div ref={searchWrapRef} className="relative max-w-md mx-auto mt-2 pointer-events-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onFocus={() => {
                if (searchInput.trim().length > 0) setShowHints(true);
              }}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                setShowHints(val.trim().length > 0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search reels..."
              autoComplete="off"
              className="w-full bg-black/65 border border-white/20 focus:border-[#FF9900] rounded-full pl-3.5 pr-14 py-1.5 text-xs text-white placeholder-gray-300 backdrop-blur-md outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setHints([]);
                  setShowHints(false);
                }}
                aria-label="Clear reel search"
                className="absolute right-8 text-gray-300 hover:text-white px-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              aria-label="Search reels"
              className="absolute right-1 bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
            >
              🔍
            </button>
          </form>

          {showHints && searchInput.trim().length > 0 && hints.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#161616]/95 border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto backdrop-blur-md">
              {hints.map((hint, idx) => {
                const badge = HINT_BADGE[hint.type];
                return (
                  <button
                    key={`${hint.type}-${hint.label}-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeReelSearch(hint.label);
                    }}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 border-b border-gray-800/60 text-xs transition cursor-pointer ${
                      idx === activeHintIdx
                        ? 'bg-[#FF9900]/25 text-white'
                        : 'hover:bg-[#222] text-gray-200'
                    }`}
                  >
                    <span className="truncate font-medium">{hint.label}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto mt-2 flex items-center gap-1.5 overflow-x-auto pointer-events-auto pb-0.5">
          {dynamicPills.map((cat) => (
            <button
              key={cat.query}
              type="button"
              onClick={() => handleCategoryChange(cat.query)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 backdrop-blur-md transition border cursor-pointer ${
                activeCategory === cat.query
                  ? 'bg-[#FF9900] text-black border-[#FF9900]'
                  : 'bg-black/55 text-gray-200 border-white/15 hover:border-[#FF9900]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {toast && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-50 bg-[#FF9900] text-black text-xs font-black px-4 py-1.5 rounded-full shadow-xl pointer-events-none">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-10 h-10 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400">
            {activeSearchQuery
              ? `Loading "${activeSearchQuery}" Reels...`
              : 'Loading Fresh Reels...'}
          </p>
        </div>
      ) : videos.length === 0 ? (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center gap-4 px-4 text-center bg-black">
          <p className="text-base font-bold text-gray-300">
            No reels found for &ldquo;{activeCategory}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => handleCategoryChange(FOR_YOU_KEY)}
            className="px-5 py-2 bg-[#FF9900] text-black text-xs font-black rounded-full cursor-pointer"
          >
            Load Fresh For You Reels
          </button>
        </div>
      ) : (
        <div
          ref={feedRef}
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory"
        >
          {videos.map((v, idx) => {
            const isActive = idx === activeIndex;
            const isLiked = Boolean(likedIds[v.id]);
            const duration = formatDuration(v.length_sec, v.length_min);

            const muteFlag = isUnmuted ? '0' : '1';
            const epornerEmbedUrl = `https://www.eporner.com/embed/${encodeURIComponent(
              v.id
            )}/?autoplay=1&autostart=1&mute=${muteFlag}&muted=${muteFlag}`;

            return (
              <section
                key={`${v.id}-${idx}`}
                data-index={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Full-Screen 9:16 Reels Container */}
                <div className="relative h-[100dvh] w-full sm:w-[440px] bg-black overflow-hidden sm:border-x sm:border-white/10">
                  {/* Full-Bleed Poster */}
                  <img
                    src={v.default_thumb.src}
                    alt={v.title}
                    loading={idx <= 2 ? 'eager' : 'lazy'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Active Sandboxed Eporner Stream Player (Blocks all outbound redirects) */}
                  {isActive && !isPaused && (
                    <div className="absolute inset-0 z-10 overflow-hidden bg-black">
                      <iframe
                        ref={(el) => {
                          if (isActive) activeIframeRef.current = el;
                        }}
                        key={`ep-reel-${v.id}-${playSession}-${isUnmuted ? 'u' : 'm'}`}
                        src={epornerEmbedUrl}
                        title={v.title}
                        onLoad={(e) => {
                          sendPlayerCommand(e.currentTarget, 'play');
                          sendPlayerCommand(e.currentTarget, isUnmuted ? 'unmute' : 'mute');
                        }}
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        className={`w-full h-full border-0 transition-transform duration-200 ${
                          isFullFill ? 'scale-[1.38] origin-center' : 'scale-100'
                        }`}
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      />
                    </div>
                  )}

                  {/* Clean Resume Overlay shown ONLY when Paused */}
                  {isActive && isPaused && (
                    <div
                      onClick={() => handleTogglePlayPause()}
                      role="button"
                      tabIndex={0}
                      aria-label="Resume reel"
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleTogglePlayPause();
                        }
                      }}
                      className="absolute inset-x-0 top-28 bottom-16 z-20 cursor-pointer flex items-center justify-center bg-black/30"
                    >
                      <div className="w-16 h-16 rounded-full bg-black/75 border border-white/25 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Top & Bottom Gradients */}
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 to-transparent pointer-events-none z-20" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none z-20" />

                  {/* Right-Side Reels Action Rail */}
                  <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-4">
                    {/* Pause / Play Button */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePlayPause(e)}
                      aria-label={isPaused ? 'Resume reel' : 'Pause reel'}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                          isPaused
                            ? 'bg-[#FF9900] border-[#FF9900] text-black shadow-lg'
                            : 'bg-black/55 border-white/25 text-white group-hover:border-[#FF9900]'
                        }`}
                      >
                        {isPaused ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {isPaused ? 'Play' : 'Pause'}
                      </span>
                    </button>

                    {/* Single Global Unmute / Mute Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleGlobalSound(e)}
                      aria-label={isUnmuted ? 'Mute reels' : 'Unmute reels'}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                          isUnmuted
                            ? 'bg-[#FF9900] border-[#FF9900] text-black shadow-lg'
                            : 'bg-black/55 border-white/25 text-white group-hover:border-[#FF9900]'
                        }`}
                      >
                        {isUnmuted ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {isUnmuted ? 'Sound On' : 'Unmute'}
                      </span>
                    </button>

                    {/* Full-Screen 9:16 vs Wide Fit Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsFullFill((prev) => !prev)}
                      aria-label="Toggle screen fit"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/55 border border-white/25 group-hover:border-[#FF9900] flex items-center justify-center backdrop-blur-md transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {isFullFill ? 'Full 9:16' : 'Wide'}
                      </span>
                    </button>

                    {/* Like */}
                    <button
                      type="button"
                      onClick={(e) => toggleLike(e, v.id)}
                      aria-label="Like reel"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                          isLiked
                            ? 'bg-red-500 border-red-400 text-white scale-110'
                            : 'bg-black/55 border-white/25 text-white group-hover:border-[#FF9900]'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">
                        {isLiked ? 'Liked' : 'Like'}
                      </span>
                    </button>

                    {/* Watch Full Page */}
                    <Link
                      href={`/watch/${v.id}`}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/55 border border-white/25 group-hover:bg-[#FF9900] group-hover:text-black flex items-center justify-center backdrop-blur-md transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">Watch</span>
                    </Link>

                    {/* Share */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, v)}
                      aria-label="Share reel"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/55 border border-white/25 group-hover:border-[#FF9900] flex items-center justify-center backdrop-blur-md transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">Share</span>
                    </button>

                    {/* Up / Down Navigation */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
                      <button
                        type="button"
                        onClick={() => scrollToReel(idx - 1)}
                        disabled={idx === 0}
                        aria-label="Previous reel"
                        className="w-9 h-9 rounded-full bg-black/75 hover:bg-[#FF9900] hover:text-black border border-white/20 flex items-center justify-center disabled:opacity-30 transition cursor-pointer text-sm font-black"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToReel(idx + 1)}
                        aria-label="Next reel"
                        className="w-9 h-9 rounded-full bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black flex items-center justify-center shadow-lg transition cursor-pointer text-sm"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Bottom Title & Metadata */}
                  <div className="absolute bottom-7 left-3.5 right-16 z-30 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="bg-[#FF9900] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeBadgeText}
                      </span>
                      <span className="bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/15">
                        ⏱ {duration}
                      </span>
                      {v.views !== undefined && (
                        <span className="text-xs text-gray-200 font-semibold drop-shadow">
                          👁 {v.views}
                        </span>
                      )}
                    </div>

                    <h2 className="text-white text-sm font-bold line-clamp-2 drop-shadow-md leading-snug">
                      {v.title}
                    </h2>
                  </div>
                </div>
              </section>
            );
          })}

          {loadingMore && (
            <div className="h-24 flex items-center justify-center bg-black text-xs font-bold text-[#FF9900]">
              Loading more fresh reels...
            </div>
          )}
        </div>
      )}
    </div>
  );
}