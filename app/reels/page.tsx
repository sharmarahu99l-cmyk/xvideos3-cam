import type { Metadata } from 'next';
import ReelsClient, { type ReelVideo } from './ReelsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HubTube Reels — Trending MMS & Viral Short Videos | XVideos3',
  description:
    'Swipe through auto-updating MMS reels, viral clips, and HD videos in full-screen vertical view on HubTube (XVideos3.cam).',
  alternates: { canonical: '/reels' },
};

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36',
};

function isValidReel(v: ReelVideo): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  const secs = Number(v.length_sec) || (Number(v.length_min) || 0) * 60;
  return Boolean(v?.id && v?.title && src.startsWith('http') && secs > 5);
}

async function getVideoById(id: string): Promise<ReelVideo | null> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      { next: { revalidate: 300 }, headers: FETCH_HEADERS }
    );
    if (!res.ok) return null;
    const v: ReelVideo = await res.json();
    return isValidReel(v) ? v : null;
  } catch {
    return null;
  }
}

async function fetchMms(order: 'top-weekly' | 'latest' | 'most-popular'): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=mms&per_page=15&page=1&order=${order}&lq=0&thumbsize=big&format=json`,
      { next: { revalidate: 300 }, headers: FETCH_HEADERS }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const raw: ReelVideo[] = Array.isArray(data.videos) ? data.videos : [];
    return raw.filter(isValidReel);
  } catch {
    return [];
  }
}

async function getInitialReels(startId?: string): Promise<ReelVideo[]> {
  const [startVideo, weekly, latest, popular] = await Promise.all([
    startId ? getVideoById(startId) : Promise.resolve(null),
    fetchMms('top-weekly'),
    fetchMms('latest'),
    fetchMms('most-popular'),
  ]);

  const combined: ReelVideo[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(weekly.length, latest.length, popular.length);

  for (let i = 0; i < maxLen; i++) {
    for (const item of [weekly[i], latest[i], popular[i]]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
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
  const initialVideos = await getInitialReels(startId);
  return <ReelsClient initialVideos={initialVideos} />;
}