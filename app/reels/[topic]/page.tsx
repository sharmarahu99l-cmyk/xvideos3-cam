import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import crawlIndex from '../../../data/crawl-index.json';
import ReelsHubBar from '../../../components/ReelsHubBar';

type CrawlItem = { id: string; t: string; i?: string };

type TopicConfig = {
  title: string;
  h1: string;
  description: string;
  intro: string;
  keywords: string[];
  matchTerms: string[];
};

const TOPICS: Record<string, TopicConfig> = {
  'indian-sex-reels': {
    title: 'Indian Sex Reels HD – Free Mobile Short Videos | IndianSexVideo.tv',
    h1: 'Indian Sex Reels HD',
    description:
      'Watch free Indian sex reels in 1080p HD on IndianSexVideo.tv. Fast mobile-first short clips and full-length Indian scenes with instant playback.',
    intro:
      'Browse curated Indian sex reels formatted for fast mobile streaming. Switch anytime to full-length HD scenes or explore all categories across our full catalog.',
    keywords: ['indian sex reels', 'indian sex reels hd', 'indian short sex videos'],
    matchTerms: ['indian', 'hindi', 'bhabhi', 'desi'],
  },
  'desi-sex-reels': {
    title: 'Desi Sex Reels HD – Free Desi Short Videos | IndianSexVideo.tv',
    h1: 'Desi Sex Reels HD',
    description:
      'Stream free Desi sex reels in HD on IndianSexVideo.tv. Instant mobile playback across curated Desi clips, bhabhi scenes, and full HD uploads.',
    intro:
      'Explore trending Desi sex reels and short mobile clips updated daily, alongside thousands of full-length Desi and regional HD videos.',
    keywords: ['desi sex reels', 'desi sex reels hd', 'desi reels video'],
    matchTerms: ['desi', 'bhabhi', 'indian', 'hindi'],
  },
  'sex-reels': {
    title: 'Sex Reels HD – Free Mobile Short Sex Videos | IndianSexVideo.tv',
    h1: 'Sex Reels HD',
    description:
      'Watch free sex reels in HD on IndianSexVideo.tv. Mobile-optimized short video clips and full-length scenes with zero-buffer streaming.',
    intro:
      'Discover fast-loading HD sex reels designed for effortless mobile browsing, with direct access to our complete library of full-length videos and categories.',
    keywords: ['sex reels', 'sex reels hd', 'short sex reels'],
    matchTerms: ['reel', 'short', 'indian', 'desi', 'hd'],
  },
  'hot-sex-reels': {
    title: 'Hot Sex Reels HD – Trending Short Videos | IndianSexVideo.tv',
    h1: 'Hot Sex Reels HD',
    description:
      'Stream hot sex reels in 1080p HD on IndianSexVideo.tv. Trending Indian and Desi short clips plus full-length scenes optimized for mobile.',
    intro:
      'Watch popular and hot sex reels selected for high-definition mobile playback, or browse our full archive of categories and performers.',
    keywords: ['hot sex reels', 'hot sex reels hd', 'hot indian sex reels'],
    matchTerms: ['hot', 'sexy', 'indian', 'desi', 'bhabhi'],
  },
};

export function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const cfg = TOPICS[topic];
  if (!cfg) return {};

  return {
    title: cfg.title,
    description: cfg.description,
    keywords: cfg.keywords,
    alternates: {
      canonical: `https://indiansexvideo.tv/reels/${topic}`,
    },
    openGraph: {
      title: cfg.title,
      description: cfg.description,
      url: `https://indiansexvideo.tv/reels/${topic}`,
      type: 'website',
    },
  };
}

export default async function ReelsTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const cfg = TOPICS[topic];
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
    url: `https://indiansexvideo.tv/reels/${topic}`,
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

      <ReelsHubBar activeSlug={topic} />

      <header className="mb-6 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {cfg.h1}
          </h1>
          <Link
            href="/reels"
            className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Open Fullscreen Swipe Player
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
