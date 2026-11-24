import type { Metadata } from 'next';
import HomeClient from '../../HomeClient';
import { StoredVideo } from '../../lib/userPrefs';
import { buildPornstarSeoCopy, fromPornstarSlug } from '../../lib/seoData';

async function getPornstarVideos(slug: string, page: number): Promise<StoredVideo[]> {
  const query = fromPornstarSlug(slug) || 'angela white';
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
        query
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
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const name = fromPornstarSlug(slug);
  const seo = buildPornstarSeoCopy(name, page);
  const canonicalPath =
    page > 1
      ? `/pornstar/${encodeURIComponent(slug)}?page=${page}`
      : `/pornstar/${encodeURIComponent(slug)}`;

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    alternates: { canonical: canonicalPath },
  };
}

export default async function PornstarSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const name = fromPornstarSlug(slug);
  const initialVideos = await getPornstarVideos(slug, page);
  const seo = buildPornstarSeoCopy(name, page);

  return (
    <>
      <HomeClient initialVideos={initialVideos} initialQuery={name} initialPage={page} />
      {page === 1 && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
            <h2 className="text-base sm:text-lg font-black text-[#FF9900]">
              About {seo.displayName} on HubTube (indiansexvideo.tv)
            </h2>
            {seo.articleParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}
    </>
  );
}