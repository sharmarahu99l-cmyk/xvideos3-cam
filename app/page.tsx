import type { Metadata } from 'next';
import type { StoredVideo } from './lib/userPrefs';

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
      keywords: [
        q,
        `${q} videos`,
        `${q} hd`,
        'desi videos',
        'desi porn',
        'desi mms',
        'viral desi videos',
        'new desi videos',
        'indian porn',
        'xvideos3',
      ],
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

async function getInitialVideos(query: string, page: number): Promise<StoredVideo[]> {
  const searchTerm = query.trim() || 'desi';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=30&page=${page}&order=most_viewed&format=json`,
      {
        signal: controller.signal,
        next: { revalidate: 900 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36' },
      }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.videos) ? (data.videos as StoredVideo[]) : [];
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const page = Math.max(1, Number(sp.page) || 1);
  const initialVideos = await getInitialVideos(q, page);

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

  const itemListSchema =
    initialVideos.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: q ? `${q} Videos` : 'Trending Desi & Viral HD Videos',
          itemListElement: initialVideos.slice(0, 20).map((v, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `https://xvideos3.cam/watch/${v.id}`,
            name: v.title,
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-white">
        <form action="/" className="mx-auto mb-8 flex max-w-2xl">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search videos"
            className="min-w-0 flex-1 rounded-l-lg border border-white/20 bg-black px-4 py-3"
          />
          <button type="submit" className="rounded-r-lg bg-red-600 px-5 py-3 font-semibold">
            Search
          </button>
        </form>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialVideos.map((video) => (
            <a
              key={video.id}
              href={`/watch/${video.id}`}
              className="rounded-lg border border-white/10 p-4 hover:border-white/30"
            >
              <h2 className="line-clamp-2 font-semibold">{video.title}</h2>
            </a>
          ))}
        </section>

        {initialVideos.length === 0 && (
          <p className="mx-auto max-w-2xl text-center text-white/60">No videos found.</p>
        )}
      </main>
    </>
  );
}
