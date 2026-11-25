import Link from "next/link";
import type { Metadata } from 'next';
import HomeClient from '../../HomeClient';
import { StoredVideo } from '../../lib/userPrefs';
import { buildCategorySeoCopy, fromCategorySlug } from '../../lib/seoData';

async function getCategoryVideos(slug: string, page: number): Promise<StoredVideo[]> {
  const query = fromCategorySlug(slug) || 'desi';
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
  const query = fromCategorySlug(slug);
  const seo = buildCategorySeoCopy(query, page);
  const canonicalPath =
    page > 1
      ? `/category/${encodeURIComponent(slug)}?page=${page}`
      : `/category/${encodeURIComponent(slug)}`;

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    alternates: { canonical: canonicalPath },
  };
}

export default async function CategorySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const query = fromCategorySlug(slug);
  const initialVideos = await getCategoryVideos(slug, page);
  const seo = buildCategorySeoCopy(query, page);

  return (
    <>
      <HomeClient initialVideos={initialVideos} initialQuery={query} initialPage={page} />
      {page === 1 && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 space-y-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-zinc-900/80 px-4 py-2.5 text-xs sm:text-sm">
        <span className="text-zinc-300">Prefer vertical 9:16 mobile clips?</span>
        <Link href="/reels" className="font-bold text-amber-400 hover:underline">Watch Desi Sex Reels HD →</Link>
      </div>

            <h2 className="text-base sm:text-lg font-black text-[#FF9900]">
              About {seo.displayTitle} on HubTube (indiansexvideo.tv)
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