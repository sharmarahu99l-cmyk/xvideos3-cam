import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import crawlIndex from '../../../data/crawl-index.json';
import ReelsHubBar from '../../../components/ReelsHubBar';
import TrendingHubBar from '../../../components/TrendingHubBar';

type CrawlItem = { id: string; t: string; i?: string };

type TrendingConfig = {
  title: string;
  h1: string;
  description: string;
  intro: string;
  keywords: string[];
  matchTerms: string[];
};

const TRENDING_TOPICS: Record<string, TrendingConfig> = {
  'desi-mms': {
    title: 'Desi MMS & Viral Desi MMS HD Videos | IndianSexVideo.tv',
    h1: 'Desi MMS & Viral Desi MMS Videos',
    description:
      'Watch free Desi MMS and viral Desi MMS videos in HD on IndianSexVideo.tv. Fast mobile streaming across curated Desi clips and full-length scenes.',
    intro:
      'Browse popular Desi MMS and viral Desi MMS uploads in high definition, with instant mobile playback and full access to our complete category archive.',
    keywords: ['desi mms', 'viral desi mms', 'desi mms xxx', 'desi mms sex'],
    matchTerms: ['mms', 'desi', 'hindi', 'bhabhi'],
  },
  'desi-leaked-videos': {
    title: 'Desi Leaked Videos & Indian Desi Clips HD | IndianSexVideo.tv',
    h1: 'Desi Leaked Videos HD',
    description:
      'Stream free Desi leaked videos and Indian Desi clips in 1080p HD on IndianSexVideo.tv. Updated daily with fast mobile-ready playback.',
    intro:
      'Explore trending Desi leaked videos and Indian Desi HD scenes formatted for fast loading on mobile and desktop.',
    keywords: ['desi leaked videos', 'indian desi leaked videos', 'xxx desi leaked videos'],
    matchTerms: ['leaked', 'mms', 'desi', 'indian'],
  },
  'desi-village-girls': {
    title: 'Desi Village Girls Sex Videos HD | IndianSexVideo.tv',
    h1: 'Desi Village Girls Sex Videos',
    description:
      'Watch Desi village girls sex videos in HD on IndianSexVideo.tv. Curated rural Desi clips and full-length regional HD uploads.',
    intro:
      'Watch authentic Desi village girls HD videos and regional scenes, or browse all categories across our 60,000+ video library.',
    keywords: ['desi village girls sex videos', 'xxx desi village girls', 'desi village girls sex'],
    matchTerms: ['village', 'gaon', 'desi', 'bhabhi'],
  },
  'hot-desi-porn-videos': {
    title: 'Hot Desi Porn Videos HD – Trending Indian Clips | IndianSexVideo.tv',
    h1: 'Hot Desi Porn Videos HD',
    description:
      'Stream hot Desi porn videos in 1080p HD on IndianSexVideo.tv. Top-rated Indian and Desi scenes with zero-buffer streaming.',
    intro:
      'Discover top-rated hot Desi HD videos and trending Indian uploads, alongside vertical Reels and full category browsing.',
    keywords: ['hot desi porn videos', 'hot desi videos hd', 'hot indian desi videos'],
    matchTerms: ['hot', 'sexy', 'desi', 'indian'],
  },
  'pakistani-girls': {
    title: 'Pakistani Girls XXX Videos HD | IndianSexVideo.tv',
    h1: 'Pakistani Girls XXX Videos',
    description:
      'Watch Pakistani girls XXX videos in HD on IndianSexVideo.tv. Fast mobile streaming across curated Pakistani and Desi uploads.',
    intro:
      'Browse curated Pakistani girls HD videos and South Asian clips with fast mobile playback and full category navigation.',
    keywords: ['pakistani girls', 'xxx videos pakistani girls', 'pakistani girls hd'],
    matchTerms: ['pakistani', 'lahore', 'karachi', 'urdu'],
  },
  'pakistani-viral-videos': {
    title: 'Pakistani Viral Videos & Viral Pakistani Sex Videos HD | IndianSexVideo.tv',
    h1: 'Pakistani Viral Videos HD',
    description:
      'Stream Pakistani viral videos and new Desi Pakistani HD scenes on IndianSexVideo.tv. Updated daily with fast mobile playback.',
    intro:
      'Watch trending Pakistani viral videos and Desi Pakistani HD scenes, with one-tap access to vertical Reels and full categories.',
    keywords: [
      'pakistani viral videos',
      'viral pakistani sex videos',
      'xxx pakistani viral videos',
      'desi pakistani sex videos',
    ],
    matchTerms: ['pakistani', 'viral', 'pashto', 'punjabi'],
  },
  'pakistani-viral-mms': {
    title: 'Pakistani Viral MMS & HD Clips | IndianSexVideo.tv',
    h1: 'Pakistani Viral MMS Videos',
    description:
      'Watch free Pakistani viral MMS videos in HD on IndianSexVideo.tv. Mobile-optimized streaming across trending Pakistani MMS clips.',
    intro:
      'Explore trending Pakistani viral MMS clips and full-length South Asian HD videos with fast, responsive mobile playback.',
    keywords: [
      'pakistani viral mms',
      'pakistani viral mms video',
      'pakistani viral mms xxx',
      'pakistani viral mms sex',
    ],
    matchTerms: ['pakistani', 'mms', 'viral'],
  },
  'pakistani-leaked-mms': {
    title: 'Pakistani Leaked MMS Videos HD | IndianSexVideo.tv',
    h1: 'Pakistani Leaked MMS Videos',
    description:
      'Stream Pakistani leaked MMS videos in HD on IndianSexVideo.tv. Fast-loading Pakistani and Desi clips curated for mobile viewing.',
    intro:
      'Browse Pakistani leaked MMS HD videos and South Asian uploads, or switch anytime to our full catalog of categories and Reels.',
    keywords: [
      'pakistani leaked mms',
      'pakistani leaked mms video',
      'pakistani leaked mms porn',
    ],
    matchTerms: ['pakistani', 'leaked', 'mms'],
  },
};

export function generateStaticParams() {
  return Object.keys(TRENDING_TOPICS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cfg = TRENDING_TOPICS[slug];
  if (!cfg) return {};

  return {
    title: cfg.title,
    description: cfg.description,
    keywords: cfg.keywords,
    alternates: {
      canonical: `https://indiansexvideo.tv/trending/${slug}`,
    },
    openGraph: {
      title: cfg.title,
      description: cfg.description,
      url: `https://indiansexvideo.tv/trending/${slug}`,
      type: 'website',
    },
  };
}

export default async function TrendingTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cfg = TRENDING_TOPICS[slug];
  if (!cfg) notFound();

  const allVideos = crawlIndex as CrawlItem[];
  const matched = allVideos.filter((v) => {
    const lower = (v.t || '').toLowerCase();
    return cfg.matchTerms.some((term) => lower.includes(term));
  });

  const displayVideos = (matched.length >= 24 ? matched : allVideos).slice(0, 48);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cfg.h1,
    description: cfg.description,
    url: `https://indiansexvideo.tv/trending/${slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'IndianSexVideo.tv',
      url: 'https://indiansexvideo.tv',
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ReelsHubBar />
      <TrendingHubBar activeSlug={slug} />

      <header className="mb-6 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {cfg.h1}
          </h1>
          <Link
            href="/categories"
            className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-500 hover:text-amber-300"
          >
            Browse All Categories
          </Link>
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-300 sm:text-sm">
          {cfg.intro}
        </p>
      </header>

      <section aria-label={cfg.h1}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {displayVideos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${encodeURIComponent(video.id)}`}
              className="group overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/60 transition hover:border-amber-500/50 hover:bg-zinc-900"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                {video.i ? (
                  <img
                    src={video.i}
                    alt={video.t}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                  HD
                </span>
              </div>
              <div className="p-2 sm:p-2.5">
                <h2 className="line-clamp-2 text-xs font-medium leading-snug text-zinc-200 group-hover:text-amber-400 sm:text-sm">
                  {video.t}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
