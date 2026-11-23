import type { Metadata } from 'next';
import ReelsClient, { type ReelVideo } from './ReelsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'HubTube Reels — Trending MMS & Viral Short Videos | XVideos3',
  description:
    'Swipe through auto-updating reels, viral clips, and HD videos in full-screen vertical view on HubTube (XVideos3.cam).',
  alternates: { canonical: '/reels' },
};

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36',
};

const REFRESH_TOPIC_POOL = [
  'mms', 'leaked mms', 'desi mms', 'desi bhabhi', 'viral', 'indian homemade',
  'amateur', 'punjabi', 'hindi audio', 'desi couple', '4k', 'asian',
  'milf', 'big tits', 'homemade', 'latina', 'teen', 'pov',
];

function isValidReel(v: ReelVideo): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  const secs = Number(v.length_sec) || (Number(v.length_min) || 0) * 60;
  return Boolean(v?.id && v?.title && src.startsWith('http') && secs > 5);
}

function pickRandomTopics(count: number): string[] {
  const copy = [...REFRESH_TOPIC_POOL];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

async function getVideoById(id: string): Promise<ReelVideo | null> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      { cache: 'no-store', headers: FETCH_HEADERS }
    );
    if (!res.ok) return null;
    const v: ReelVideo = await res.json();
    return isValidReel(v) ? v : null;
  } catch {
    return null;
  }
}

async function fetchTopicSlice(
  query: string,
  pageNum: number,
  order: 'top-weekly' | 'latest' | 'most-popular'
): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        query
      )}&per_page=14&page=${pageNum}&order=${order}&lq=0&thumbsize=big&format=json`,
      { cache: 'no-store', headers: FETCH_HEADERS }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const raw: ReelVideo[] = Array.isArray(data.videos) ? data.videos : [];
    return raw.filter(isValidReel);
  } catch {
    return [];
  }
}

async function getFreshInitialReels(startId?: string): Promise<ReelVideo[]> {
  const topics = pickRandomTopics(3);
  const orders: Array<'top-weekly' | 'latest' | 'most-popular'> = [
    'top-weekly',
    'latest',
    'most-popular',
  ];

  const [startVideo, ...batches] = await Promise.all([
    startId ? getVideoById(startId) : Promise.resolve(null),
    ...topics.map((topic, idx) => {
      const randomPage = Math.floor(Math.random() * 10) + 1;
      return fetchTopicSlice(topic, randomPage, orders[idx % orders.length]);
    }),
  ]);

  const combined: ReelVideo[] = [];
  const seen = new Set<string>();
  const maxLen = batches.reduce((m, b) => Math.max(m, b.length), 0);

  for (let i = 0; i < maxLen; i++) {
    for (const batch of batches) {
      const item = batch[i];
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
  }

  // Shuffle combined list so every refresh starts with a brand-new order
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  if (startVideo) {
    return [startVideo, ...combined.filter((v) => v.id !== startVideo.id)];
  }
  return combined;
}

export default async function ReelsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const params = await searchParams;
  const startId = typeof params?.start === 'string' ? params.start.trim() : undefined;
  const initialVideos = await getFreshInitialReels(startId);
  return <ReelsClient initialVideos={initialVideos} />;
}