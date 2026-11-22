import type { Metadata } from 'next';
import ReelsClient, { type ReelVideo } from './ReelsClient';

export const metadata: Metadata = {
  title: 'HubTube Reels — Free HD Desi & Adult Short Videos | XVideos3',
  description:
    'Swipe through endless HD Desi videos, viral MMS, and adult reels in full-screen vertical feed on HubTube (XVideos3.cam).',
  alternates: { canonical: '/reels' },
};

async function getInitialReels(): Promise<ReelVideo[]> {
  try {
    const res = await fetch(
      'https://www.eporner.com/api/v2/video/search/?query=desi&per_page=20&page=1&order=most_viewed&thumbsize=big&format=json',
      {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const raw: ReelVideo[] = Array.isArray(data.videos) ? data.videos : [];
    return raw.filter((v) => {
      const src = v?.default_thumb?.src?.trim() || '';
      const secs = Number(v.length_sec) || (Number(v.length_min) || 0) * 60;
      return Boolean(v?.id && v?.title && src.startsWith('http') && secs > 5);
    });
  } catch {
    return [];
  }
}

export default async function ReelsPage() {
  const initialVideos = await getInitialReels();
  return <ReelsClient initialVideos={initialVideos} />;
}