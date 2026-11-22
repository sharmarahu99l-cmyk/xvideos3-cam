import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

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
      title: `${q} Videos${page > 1 ? ` - Page ${page}` : ''} - Free HD Desi & Porn`,
      description: `Watch unlimited free ${q} HD videos${page > 1 ? ` (Page ${page})` : ''} streaming fast on HubTube (XVideos3.cam). Updated daily with new ${q} clips.`,
      alternates: { canonical: canonicalPath },
    };
  }

  return {
    title:
      page > 1
        ? `Desi, Indian & HD Porn Videos - Page ${page}`
        : 'HubTube (XVideos3) - Free Desi, Indian & HD Porn Videos',
    description:
      'Watch free HD Desi videos, Indian bhabhi, aunty, Pakistani MMS, and 4K 60fps adult videos streaming fast on HubTube (XVideos3.cam).',
    alternates: { canonical: canonicalPath },
  };
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <HomeClient />
    </Suspense>
  );
}
