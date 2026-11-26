import Link from 'next/link';

const TRENDING_HUBS = [
  { slug: 'desi-mms', label: 'Desi MMS' },
  { slug: 'desi-leaked-videos', label: 'Desi Leaked Videos' },
  { slug: 'desi-village-girls', label: 'Desi Village Girls' },
  { slug: 'hot-desi-porn-videos', label: 'Hot Desi Videos' },
  { slug: 'pakistani-girls', label: 'Pakistani Girls' },
  { slug: 'pakistani-viral-videos', label: 'Pakistani Viral Videos' },
  { slug: 'pakistani-viral-mms', label: 'Pakistani Viral MMS' },
  { slug: 'pakistani-leaked-mms', label: 'Pakistani Leaked MMS' },
];

export default function TrendingHubBar({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav
      aria-label="Trending Desi & Pakistani Topics"
      className="mb-5 flex items-center gap-2 overflow-x-auto pb-1"
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Trending:
      </span>
      {TRENDING_HUBS.map((hub) => {
        const isActive = activeSlug === hub.slug;
        return (
          <Link
            key={hub.slug}
            href={`/trending/${hub.slug}`}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
              isActive
                ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {hub.label}
          </Link>
        );
      })}
    </nav>
  );
}
