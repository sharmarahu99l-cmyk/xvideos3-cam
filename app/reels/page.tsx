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

const TOPIC_POOL = [
  'desi', 'indian', 'bhabhi', 'homemade', 'amateur', 'viral',
  'punjabi', 'hindi', 'asian', 'milf', 'teen', 'latina', 'pov',
];

function parseDurationToSec(dur?: string): number {
  if (!dur) return 0;
  const parts = dur.split(':').map((n) => Number(n) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(dur) || 0;
}

async function fetchInitialRedTube(query: string, page: number): Promise<ReelVideo[]> {
  try {
    const url = `https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(
      query
    )}&thumbsize=big&ordering=mostviewed&page=${page}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];
    const out: ReelVideo[] = [];

    for (const entry of list) {
      const v = entry?.video || entry;
      const vidId = String(v?.video_id || '').trim();
      const title = String(v?.title || '').trim();
      const thumb = String(v?.default_thumb || v?.thumb || '').trim();
      if (!vidId || !title || !thumb.startsWith('http')) continue;

      const tags = Array.isArray(v?.tags)
        ? v.tags
            .map((t: { tag_name?: string } | string) =>
              typeof t === 'string' ? t : t?.tag_name || ''
            )
            .filter(Boolean)
            .join(', ')
        : '';

      out.push({
        id: vidId,
        title,
        default_thumb: { src: thumb },
        length_min: v?.duration || '0:30',
        length_sec: parseDurationToSec(v?.duration),
        views: v?.views ?? 0,
        keywords: tags,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function ReelsPage() {
  const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5).slice(0, 2);
  const [batchA, batchB] = await Promise.all([
    fetchInitialRedTube(shuffled[0], Math.floor(Math.random() * 5) + 1),
    fetchInitialRedTube(shuffled[1], Math.floor(Math.random() * 5) + 1),
  ]);

  const combined: ReelVideo[] = [];
  const seen = new Set<string>();
  const maxLen = Math.max(batchA.length, batchB.length);
  for (let i = 0; i < maxLen; i++) {
    for (const item of [batchA[i], batchB[i]]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
  }

  return <ReelsClient initialVideos={combined} />;
}