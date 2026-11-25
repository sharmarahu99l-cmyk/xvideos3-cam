import ReelsSeoBlock from "../../components/ReelsSeoBlock";
import type { Metadata } from 'next';
import ReelsClient, { type ReelVideo } from './ReelsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


const TOPIC_POOL = [
  'mms', 'leaked mms', 'desi mms', 'desi bhabhi', 'viral', 'indian homemade',
  'amateur', 'punjabi', 'hindi audio', 'desi couple', '4k', 'asian',
  'milf', 'big tits', 'homemade', 'latina', 'teen', 'pov',
];

function isValidReel(v: ReelVideo): boolean {
  const src = v?.default_thumb?.src?.trim() || '';
  return Boolean(v?.id && v?.title && src.startsWith('http'));
}

async function fetchInitialEporner(
  query: string,
  page: number,
  order: 'top-weekly' | 'latest' | 'most-popular'
): Promise<ReelVideo[]> {
  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=15&page=${page}&order=${order}&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: ReelVideo[] = Array.isArray(data?.videos) ? data.videos : [];
    return list.filter(isValidReel);
  } catch {
    return [];
  }
}

export default async function ReelsPage() {
  const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5).slice(0, 2);
  const [batchA, batchB] = await Promise.all([
    fetchInitialEporner(shuffled[0], Math.floor(Math.random() * 8) + 1, 'top-weekly'),
    fetchInitialEporner(shuffled[1], Math.floor(Math.random() * 8) + 1, 'most-popular'),
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