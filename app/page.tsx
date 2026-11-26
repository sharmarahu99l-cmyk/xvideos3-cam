import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { StoredVideo } from './lib/userPrefs';
import { getHourlyKeywordFeed, searchUnifiedVideos } from '../lib/keywordFeed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getInitialVideos(query: string, page: number): Promise<StoredVideo[]> {
  const searchTerm = query.trim();

  if (!searchTerm) {
    const feed = await getHourlyKeywordFeed('main', page, 30, 'latest');
    return feed as unknown as StoredVideo[];
  }

  const results = await searchUnifiedVideos(searchTerm, page, 30, 'latest');
  return results as unknown as StoredVideo[];
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params?.q === 'string' ? params.q.trim() : '';
  const page = Math.max(1, Number(params?.page) || 1);

  if (q) {
    const qs = new URLSearchParams({ q });
    if (page > 1) qs.set('page', String(page));
    return {
      title: `${q} Videos${page > 1 ? ` - Page ${page}` : ''} | HubTube - IndianSexVideo HD`,
      description: `Watch free HD ${q} videos and viral clips${page > 1 ? ` (Page ${page})` : ''} streaming fast on HubTube (indiansexvideo.tv).`,
      alternates: { canonical: `/?${qs.toString()}` },
    };
  }

  return {
    title:
      page > 1
        ? `Desi MMS, Pakistani Viral Videos & Indian Sex Reels - Page ${page} | IndianSexVideo.tv`
        : 'Desi MMS, Indian Sex Reels, Pakistani Viral & Desi Leaked Videos HD | IndianSexVideo.tv',
    description:
      'Stream free Desi MMS, Indian sex reels, Desi sex reels, Pakistani viral videos, Desi leaked videos, and Desi village girls HD clips updated hourly on HubTube (indiansexvideo.tv).',
    alternates: { canonical: page > 1 ? `/?page=${page}` : '/' },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params?.q === 'string' ? params.q : '';
  const page = Math.max(1, Number(params?.page) || 1);
  const initialVideos = await getInitialVideos(q, page);

  return <HomeClient initialVideos={initialVideos} initialQuery={q} initialPage={page} />;
}
