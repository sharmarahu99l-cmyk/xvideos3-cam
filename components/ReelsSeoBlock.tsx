import Link from 'next/link';
import crawlIndex from '../data/crawl-index.json';

type CrawlItem = { id: string; t: string; i?: string };

export default function ReelsSeoBlock() {
  const clips = Array.isArray(crawlIndex) ? (crawlIndex as CrawlItem[]).slice(0, 24) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Desi Sex Reels HD – Indian Vertical Short Sex Videos',
    description:
      'Watch Desi Sex Reels HD and trending Indian vertical short sex videos free in 1080p on IndianSexVideo.tv.',
    url: 'https://indiansexvideo.tv/reels',
    inLanguage: ['en', 'hi'],
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-zinc-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl font-bold text-white sm:text-3xl">
        Desi Sex Reels HD – Free Indian Vertical Short Videos
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
        Stream fast-loading <strong>Desi Sex Reels HD</strong>, Hindi short clips, and trending
        Indian vertical adult videos on mobile and desktop with zero buffering.
      </p>

      {clips.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {clips.map((v) => (
            <Link
              key={v.id}
              href={`/watch/${encodeURIComponent(v.id)}`}
              className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70 hover:border-amber-500"
            >
              {v.i ? (
                <img
                  src={v.i}
                  alt={`${v.t} - Desi Sex Reels HD`}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover"
                />
              ) : null}
              <p className="line-clamp-2 p-2 text-xs text-zinc-200">{v.t}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
