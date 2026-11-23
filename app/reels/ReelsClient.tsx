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

type VideoOrientation = 'vertical' | 'horizontal';

const FOR_YOU_KEY = '__for_you_fresh__';
const LIKES_KEY = 'hubtube_reel_likes_v1';
const SEEN_REELS_KEY = 'hubtube_seen_reels_v1';

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

// Extracts dynamic top hint pills directly from the currently loaded videos
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
    // 1. Score clean tags from video keywords
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

    // 2. Score strong words from video titles
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
    // Avoid adding a 1-word duplicate if a 2-word pill already contains it
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

  // Ensure at least 6 pills if metadata was sparse
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

function inferInitialOrientation(v: ReelVideo): VideoOrientation {
  const firstThumb = v?.thumbs?.[0];
  if (firstThumb?.width && firstThumb?.height) {
    return firstThumb.height > firstThumb.width ? 'vertical' : 'horizontal';
  }
  const text = `${v?.title || ''} ${v?.keywords || ''}`.toLowerCase();
  if (/\b(vertical|9:16|shorts|tiktok|reels)\b/.test(text)) {
    return 'vertical';
  }
  return 'horizontal';
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
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
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

async function fetchSingleOrder(
  query: string,
  pageNum: number,
  perPage: number,
  order: 'top-weekly' | 'latest' | 'most-popular'
): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&per_page=${perPage}&order=${order}`,
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
      )}&per_page=${perPage}&page=${pageNum}&order=${order}&lq=0&thumbsize=big&format=json`,
      { cache: 'no-store' }
    );
    if (direct.ok) {
      const data = await direct.json();
      return Array.isArray(data.videos) ? (data.videos as ReelVideo[]).filter(validThumb) : [];
    }
  } catch {}

  return [];
}

async function fetchFreshUniqueBatch(
  categoryQuery: string,
  sessionExcludeIds: Set<string>,
  isInitialRefresh: boolean = false
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
        const randPage = Math.floor(Math.random() * 14) + 1;
        return fetchSingleOrder(topic, randPage, 14, orders[idx % orders.length]);
      })
    );
  } else {
    // Specific searched term or dynamic pill: pull from 2 different pages/orders for variety
    const pageA = isInitialRefresh ? 1 : Math.floor(Math.random() * 5) + 1;
    const pageB = pageA + 1;
    batches = await Promise.all([
      fetchSingleOrder(categoryQuery, pageA, 15, 'most-popular'),
      fetchSingleOrder(categoryQuery, pageB, 15, 'top-weekly'),
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

  // Prefer strictly never-before-seen videos first; only use fallback if topic pool is small
  const finalList = shuffleArray(
    freshUnseen.length >= 6 ? freshUnseen : [...freshUnseen, ...fallbackSeen]
  );

  rememberSeenIds(finalList.map((v) => v.id));
  return finalList;
}

export default function ReelsClient({ initialVideos }: { initialVideos: ReelVideo[] }) {
  const [videos, setVideos] = useState<ReelVideo[]>(initialVideos.filter(validThumb));
  const [activeCategory, setActiveCategory] = useState<string>(FOR_YOU_KEY);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [dynamicPills, setDynamicPills] = useState<ReelCategoryPill[]>(() =>
    deriveTopPillsFromVideos(initialVideos.filter(validThumb), '')
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string>('');

  const [orientations, setOrientations] = useState<Record<string, VideoOrientation>>({});
  const [zoomedIds, setZoomedIds] = useState<Record<string, boolean>>({});

  // Search bar always starts empty on every page refresh
  const [searchInput, setSearchInput] = useState<string>('');
  const [hints, setHints] = useState<SearchHint[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [activeHintIdx, setActiveHintIdx] = useState<number>(-1);

  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const loadingMoreRef = useRef<boolean>(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  // On EVERY page refresh:
  // 1. Automatically reset any search query & input
  // 2. Fetch brand-new unseen videos (skipping previously seen IDs)
  // 3. Regenerate fresh top hint pills from what loaded
  useEffect(() => {
    let active = true;

    try {
      const rawLikes = localStorage.getItem(LIKES_KEY);
      if (rawLikes) setLikedIds(JSON.parse(rawLikes));
    } catch {}

    setSearchInput('');
    setActiveSearchQuery('');
    setActiveCategory(FOR_YOU_KEY);
    setActiveIndex(0);

    const loadRefreshedFeed = async () => {
      setLoading(true);
      const startVideo =
        typeof window !== 'undefined' && window.location.search.includes('start=')
          ? initialVideos[0]
          : undefined;

      const exclude = new Set<string>(startVideo ? [startVideo.id] : []);
      const freshBatch = await fetchFreshUniqueBatch(FOR_YOU_KEY, exclude, true);
      if (!active) return;

      const finalVideos =
        startVideo && validThumb(startVideo)
          ? [startVideo, ...freshBatch.filter((v) => v.id !== startVideo.id)]
          : freshBatch;

      const resolved = finalVideos.length > 0 ? finalVideos : initialVideos.filter(validThumb);
      setVideos(resolved);
      setDynamicPills(deriveTopPillsFromVideos(resolved, ''));
      setLoading(false);

      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    };

    loadRefreshedFeed();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.7,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [videos]);

  // Infinite scroll: loads more unseen, non-repeating videos
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
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

  const handleThumbLoad = (videoId: string, img: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = img;
    if (naturalWidth > 0 && naturalHeight > 0) {
      const detected: VideoOrientation =
        naturalHeight > naturalWidth ? 'vertical' : 'horizontal';
      setOrientations((prev) =>
        prev[videoId] === detected ? prev : { ...prev, [videoId]: detected }
      );
    }
  };

  const toggleReelZoom = (videoId: string) => {
    setZoomedIds((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  // Search on Reels (session-only; refreshing the page resets it automatically)
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

  const toggleLike = (videoId: string) => {
    setLikedIds((prev) => {
      const next = { ...prev, [videoId]: !prev[videoId] };
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleShare = async (video: ReelVideo) => {
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
      ? '🔥 FOR YOU • FRESH'
      : `🔥 ${activeCategory.toUpperCase()}`;

  return (
    <div className="relative h-[100dvh] w-full bg-black text-white overflow-hidden select-none">
      {/* Compact Floating Top Header + Reels Search Bar + Dynamic Hint Pills */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/95 via-black/70 to-transparent pt-2.5 pb-4 px-3 pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2 pointer-events-auto">
          <Link
            href="/"
            className="flex items-center gap-1 bg-black/70 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1 rounded-full text-xs font-black border border-white/15 backdrop-blur-md transition shrink-0"
          >
            <span>←</span>
            <span>HOME</span>
          </Link>

          <div className="flex items-center gap-0.5 text-base sm:text-lg font-black tracking-tight drop-shadow">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">REELS</span>
          </div>

          <Link
            href="/history"
            className="bg-black/70 hover:bg-[#FF9900] hover:text-black text-white px-3 py-1 rounded-full text-xs font-bold border border-white/15 backdrop-blur-md transition shrink-0"
          >
            🕒 History
          </Link>
        </div>

        {/* Compact Reels Search Bar */}
        <div ref={searchWrapRef} className="relative max-w-lg mx-auto mt-2 pointer-events-auto">
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
              placeholder="Search reels (refresh resets automatically)..."
              autoComplete="off"
              className="w-full bg-black/75 border border-[#FF9900]/80 focus:border-[#FF9900] rounded-full pl-3.5 pr-14 py-1.5 text-xs sm:text-sm text-white placeholder-gray-400 backdrop-blur-md outline-none"
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
                className="absolute right-8 text-gray-400 hover:text-white px-1 text-xs cursor-pointer"
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

        {/* Dynamic Top Hint Pills Generated From Newly Loaded Videos */}
        <div className="max-w-lg mx-auto mt-2 flex items-center gap-1.5 overflow-x-auto pointer-events-auto pb-0.5">
          {dynamicPills.map((cat) => (
            <button
              key={cat.query}
              type="button"
              onClick={() => handleCategoryChange(cat.query)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 backdrop-blur-md transition border cursor-pointer ${
                activeCategory === cat.query
                  ? 'bg-[#FF9900] text-black border-[#FF9900]'
                  : 'bg-black/65 text-gray-200 border-white/15 hover:border-[#FF9900]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {toast && (
        <div className="fixed top-36 left-1/2 -translate-x-1/2 z-50 bg-[#FF9900] text-black text-xs font-black px-4 py-2 rounded-full shadow-xl">
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
            const orientation = orientations[v.id] || inferInitialOrientation(v);
            const isVertical = orientation === 'vertical';
            const isZoomed = Boolean(zoomedIds[v.id]);

            return (
              <section
                key={`${v.id}-${idx}`}
                data-index={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                className="relative h-[100dvh] w-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
              >
                {!isVertical && (
                  <img
                    src={v.default_thumb.src}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-25 pointer-events-none"
                  />
                )}

                <div
                  className={`relative h-[100dvh] w-full ${
                    isVertical ? 'sm:max-w-[460px]' : 'sm:max-w-[680px]'
                  } bg-black overflow-hidden sm:border-x sm:border-white/10 flex items-center justify-center`}
                >
                  <img
                    src={v.default_thumb.src}
                    alt={v.title}
                    loading={idx <= 1 ? 'eager' : 'lazy'}
                    onLoad={(e) => handleThumbLoad(v.id, e.currentTarget)}
                    className={
                      isVertical
                        ? 'absolute inset-0 w-full h-full object-cover'
                        : 'w-full aspect-video object-cover'
                    }
                  />

                  {isActive && (
                    <div
                      className={
                        isVertical
                          ? 'absolute inset-0 bg-black z-10 overflow-hidden'
                          : 'relative z-10 w-full aspect-video bg-black overflow-hidden shadow-2xl border-y border-white/10'
                      }
                    >
                      <iframe
                        key={`reel-frame-${v.id}`}
                        src={`https://www.eporner.com/embed/${encodeURIComponent(v.id)}/?autoplay=1&muted=1`}
                        className={
                          isVertical
                            ? `w-full h-[calc(100%+56px)] -mt-[56px] border-0 transition-transform duration-200 ${
                                isZoomed ? 'scale-[1.35] origin-center' : ''
                              }`
                            : 'w-full h-[calc(100%+52px)] -mt-[52px] border-0'
                        }
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />

                      <div
                        aria-hidden="true"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-9 min-w-[165px] sm:min-w-[195px] px-3 bg-black flex items-center justify-center gap-0.5 z-20 pointer-events-auto"
                      >
                        <span className="text-xs font-black text-[#FF9900]">H</span>
                        <span className="text-xs font-black text-white">UB</span>
                        <span className="text-xs font-black text-[#FF9900]">REELS</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 to-transparent pointer-events-none z-20" />

                  <div className="absolute right-2.5 bottom-24 z-30 flex flex-col items-center gap-3">
                    {isVertical && (
                      <button
                        type="button"
                        onClick={() => toggleReelZoom(v.id)}
                        aria-label="Toggle reel zoom"
                        className="flex flex-col items-center gap-1 cursor-pointer group"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                            isZoomed
                              ? 'bg-[#FF9900] border-[#FF9900] text-black'
                              : 'bg-black/60 border-white/20 text-white group-hover:border-[#FF9900]'
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-bold drop-shadow">
                          {isZoomed ? 'Normal' : 'Fill 9:16'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleLike(v.id)}
                      aria-label="Like reel"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition ${
                          isLiked
                            ? 'bg-red-500 border-red-400 text-white scale-110'
                            : 'bg-black/60 border-white/20 text-white group-hover:border-[#FF9900]'
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

                    <Link
                      href={`/watch/${v.id}`}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 group-hover:bg-[#FF9900] group-hover:text-black flex items-center justify-center backdrop-blur-md transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold drop-shadow">Watch</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleShare(v)}
                      aria-label="Share reel"
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 group-hover:border-[#FF9900] flex items-center justify-center backdrop-blur-md transition">
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

                  <div className="absolute bottom-16 left-3 right-16 z-30 pointer-events-none">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="bg-[#FF9900] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeBadgeText}
                      </span>
                      <span className="bg-black/75 text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/15">
                        {isVertical ? '📱 9:16 REEL' : '🎬 HD WIDESCREEN'}
                      </span>
                      <span className="bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/15">
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