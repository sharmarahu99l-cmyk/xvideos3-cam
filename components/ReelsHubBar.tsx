import Link from 'next/link';

const HUBS = [
  { slug: 'indian-sex-reels', label: 'Indian Sex Reels' },
  { slug: 'desi-sex-reels', label: 'Desi Sex Reels' },
  { slug: 'sex-reels', label: 'Sex Reels' },
  { slug: 'hot-sex-reels', label: 'Hot Sex Reels' },
];

export default function ReelsHubBar({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav
      aria-label="Featured Reels Topics"
      className="mb-5 flex items-center gap-2 overflow-x-auto pb-1"
    >
      <Link
        href="/reels"
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
          !activeSlug
            ? 'border-amber-500 bg-amber-500/15 text-amber-300'
            : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
        }`}
      >
        All Vertical Reels
      </Link>

      {HUBS.map((hub) => {
        const isActive = activeSlug === hub.slug;
        return (
          <Link
            key={hub.slug}
            href={`/reels/${hub.slug}`}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              isActive
                ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {hub.label}
          </Link>
        );
      })}

      <Link
        href="/categories"
        className="shrink-0 rounded-full border border-zinc-800/80 bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-white"
      >
        All Categories →
      </Link>
    </nav>
  );
}
