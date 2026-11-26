import TrendingHubBar from "../components/TrendingHubBar";
import Link from "next/link";
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { StoredVideo } from './lib/userPrefs';

async function getInitialVideos(query: string, page: number): Promise<StoredVideo[]> {
  const searchTerm = query.trim() || 'desi';
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        searchTerm
      )}&per_page=30&page=${page}&order=most-popular&lq=0&thumbsize=big&format=json`,
      {
        next: { revalidate: 900 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.videos) ? data.videos : [];
  } catch {
    return [];
  }
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
        ? `Trending Desi Videos, Viral MMS & HD Porn - Page ${page} | HubTube IndianSexVideo`
        : 'Desi Videos, Viral Desi MMS, Hindi Audio Bhabhi & Free HD Porn | HubTube IndianSexVideo',
    description:
      'Watch latest new Desi videos, viral Desi MMS, Hindi audio bhabhi, Indian aunty, Punjabi kudi, Pakistani MMS, and 4K HD videos streaming free on HubTube (indiansexvideo.tv).',
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