import Link from 'next/link';
import crawlIndex from '../data/crawl-index.json';

type CrawlItem = {
  id: string;
  t: string;
  i?: string;
};

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export default function RelatedVideos({
  currentId,
  count = 16,
}: {
  currentId: string;
  count?: number;
}) {
  const list = crawlIndex as CrawlItem[];
  const total = list.length;
  if (total === 0) return null;

  const baseSeed = hashString(currentId || 'default');
  const picked: CrawlItem[] = [];
  const seen = new Set<string>([currentId]);

  // Step through the 100k index using prime strides so every watch page links to 16 distinct pages
  const strides = [1, 7, 31, 127, 509, 2039, 8191, 16411];
  for (let i = 0; picked.length < count && i < count * 4; i++) {
    const stride = strides[i % strides.length];
    const idx = (baseSeed + i * stride) % total;
    const candidate = list[idx];
    if (candidate && !seen.has(candidate.id)) {
      seen.add(candidate.id);
      picked.push(candidate);
    }
  }

  return (
    <section
      aria-label="Related Videos"
      className="mt-10 border-t border-zinc-800 pt-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          Related HD &amp; Desi Videos
        </h2>
        <Link
          href="/categories"
          className="text-xs font-medium text-amber-400 hover:underline"
        >
          Browse All Categories →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {picked.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${encodeURIComponent(video.id)}`}
            className="group overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/60 transition hover:border-amber-500/50 hover:bg-zinc-900"
          >
            {video.i ? (
              <div className="aspect-video w-full overflow-hidden bg-zinc-950">
                <img
                  src={video.i}
                  alt={video.t}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ) : null}
            <div className="p-2.5">
              <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-200 group-hover:text-amber-400">
                {video.t}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
