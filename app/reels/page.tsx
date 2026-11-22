import type { Metadata } from 'next';
import ReelsClient, { type ReelVideo } from './ReelsClient';

export const metadata: Metadata = {
  title: 'HubTube Reels — Free HD Desi & Adult Short Videos | XVideos3',
  description:
    'Swipe through endless full-screen HD Desi videos, viral MMS, and adult reels on HubTube (XVideos3.cam).',
  alternates: { canonical: '/reels' },
};

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36',
};

async function getVideoById(id: string): Promise<ReelVideo | null> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      { next: { revalidate: 1800 }, headers: FETCH_HEADERS }
    );
    if (!res.ok) return null;
    const v: ReelVideo = await res.json();
    if (v?.id && v?.title && v?.default_thumb?.src?.startsWith('http')) {
      return v;
    }
  } catch {}
  return null;
}

async function getInitialReels(startId?: string): Promise<ReelVideo[]> {
  try {
    const [startVideo, listRes] = await Promise.all([
      startId ? getVideoById(startId) : Promise.resolve(null),
      fetch(
        'https://www.eporner.com/api/v2/video/search/?query=desi&per_page=20&page=1&order=most_viewed&thumbsize=big&format=json',
        { next: { revalidate: 1800 }, headers: FETCH_HEADERS }
      ),
    ]);

    let list: ReelVideo[] = [];
    if (listRes.ok) {
      const data = await listRes.json();
      const raw: ReelVideo[] = Array.isArray(data.videos) ? data.videos : [];
      list = raw.filter((v) => {
        const src = v?.default_thumb?.src?.trim() || '';
        const secs = Number(v.length_sec) || (Number(v.length_min) || 0) * 60;
        return Boolean(v?.id && v?.title && src.startsWith('http') && secs > 5);
      });
    }

    if (startVideo) {
      return [startVideo, ...list.filter((v) => v.id !== startVideo.id)];
    }
    return list;
  } catch {
    return [];
  }
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