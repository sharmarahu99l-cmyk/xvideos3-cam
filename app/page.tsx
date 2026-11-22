import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import type { StoredVideo } from './lib/userPrefs';

async function getInitialDesiVideos(query: string, page: number): Promise<StoredVideo[]> {
  const term = query.trim() || 'desi';
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(term)}&per_page=30&page=${page}&order=most_viewed&thumbsize=big&format=json`,
      {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const raw: StoredVideo[] = Array.isArray(data.videos) ? data.videos : [];
    return raw.filter((v) => {
      const src = v?.default_thumb?.src?.trim() || '';
      const secs = (Number(v.length_min) || 0) * 60 + (Number(v.length_sec) || 0);
      return Boolean(v?.id && v?.title && src.startsWith('http') && secs > 5);
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const page = Math.max(1, Number(sp.page) || 1);

  const canonicalParams = new URLSearchParams();
  if (q) canonicalParams.set('q', q);
  if (page > 1) canonicalParams.set('page', String(page));
  const canonicalPath = canonicalParams.toString() ? `/?${canonicalParams.toString()}` : '/';

  if (q) {
    return {
      title: `${q} Videos${page > 1 ? ` - Page ${page}` : ''} | Free HD Desi Videos & Porn`,
      description: `Watch unlimited free ${q} HD videos${page > 1 ? ` (Page ${page})` : ''}, viral Desi MMS, Indian bhabhi, and new Desi clips streaming fast on HubTube (XVideos3.cam).`,
      alternates: { canonical: canonicalPath },
    };
  }

  return {
    title:
      page > 1
        ? `Desi Videos, Desi Porn & Viral Desi MMS - Page ${page} | HubTube XVideos3`
        : 'Desi Videos, Desi Porn, Viral Desi MMS & Free HD Indian Videos | HubTube XVideos3',
    description:
      'Watch latest new Desi videos, Desi porn, viral Desi MMS, Indian bhabhi, aunty, Pakistani MMS, and Hindi audio HD videos streaming free on HubTube (XVideos3.cam).',
    alternates: { canonical: canonicalPath },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const page = Math.max(1, Number(sp.page) || 1);
  const initialVideos = await getInitialDesiVideos(q, page);

  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HubTube - XVideos3',
    alternateName: ['XVideos3', 'XVideos3.cam', 'HubTube Desi'],
    url: 'https://xvideos3.cam',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://xvideos3.cam/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
        <HomeClient initialVideos={initialVideos} initialQuery={q} initialPage={page} />
      </Suspense>
    </>
  );
}
