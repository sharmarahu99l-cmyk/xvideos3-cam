import type { Metadata } from 'next';
import Link from 'next/link';
import VideoCard from '../VideoCard';
import JuicyBanner from '../JuicyBanner';
import { searchUnifiedVideos } from '../../lib/keywordFeed';
import { SEO_DESI_HUB_LINKS, toCategorySlug } from '../lib/seoData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const pageSuffix = page > 1 ? ` - Page ${page}` : '';

  return {
    title: `Viral Desi MMS - Watch Latest Viral Desi MMS Videos HD${pageSuffix} | HubTube`,
    description: `Watch Viral Desi MMS videos in crisp HD on HubTube (indiansexvideo.tv)${pageSuffix}. Stream trending Viral Desi MMS, Indian bhabhi clips, Hindi audio videos, and fresh Desi HD uploads updated in real time.`,
    keywords: [
      'viral desi mms',
      'desi mms',
      'viral desi mms video',
      'indian viral mms',
      'desi bhabhi mms',
      'latest desi mms hd',
      'indiansexvideo',
    ],
    alternates: {
      canonical: page > 1 ? `/viral-desi-mms?page=${page}` : '/viral-desi-mms',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ViralDesiMmsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const videos = await searchUnifiedVideos('viral desi mms', page, 30, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Viral Desi MMS - Watch Latest Viral Desi MMS Videos HD',
    description:
      'Watch Viral Desi MMS videos in crisp HD on HubTube (indiansexvideo.tv). Stream trending Viral Desi MMS, Indian bhabhi clips, and fresh Desi HD uploads updated in real time.',
    url: `https://indiansexvideo.tv/viral-desi-mms${page > 1 ? `?page=${page}` : ''}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'HubTube - IndianSexVideo.tv',
      url: 'https://indiansexvideo.tv/',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: videos.slice(0, 12).map((v, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://indiansexvideo.tv/watch/${v.id}`,
        name: v.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navigation Bar */}
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter shrink-0">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="bg-[#222] hover:bg-[#FF9900] hover:text-black text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-full transition"
            >
              🏠 Main Page
            </Link>
            <Link
              href="/reels"
              className="bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black text-xs sm:text-sm px-3.5 py-2 rounded-full transition"
            >
              ▶ REELS
            </Link>
            <Link
              href="/categories"
              className="hidden sm:inline-block bg-[#222] hover:bg-[#FF9900] hover:text-black text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-full transition"
            >
              Categories
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-gray-400 mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-[#FF9900] transition">
            Home (IndianSexVideo.tv)
          </Link>
          <span>/</span>
          <span className="text-[#FF9900] font-semibold">Viral Desi MMS</span>
        </nav>

        {/* Hero SEO Section + Clear Main Page CTA */}
        <section className="bg-[#111] border border-gray-800 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-block bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30 text-xs font-black px-3 py-1 rounded-full mb-2">
                🔥 TRENDING COLLECTION • UPDATED LIVE
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                Viral Desi MMS{page > 1 ? ` (Page ${page})` : ''}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed">
                Stream the latest <strong>Viral Desi MMS</strong> videos in fast HD on HubTube (indiansexvideo.tv). Explore trending Indian bhabhi clips, Hindi audio uploads, and popular Desi HD videos below, or jump straight to our full main catalog.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/"
                className="bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black text-sm px-5 py-3 rounded-full shadow-lg transition"
              >
                Explore Main Website →
              </Link>
              <Link
                href="/?q=viral+desi+mms"
                className="bg-[#1c1c1c] hover:bg-[#2a2a2a] text-white border border-gray-700 font-bold text-sm px-4 py-3 rounded-full transition"
              >
                Live Search Feed
              </Link>
            </div>
          </div>
        </section>

        <JuicyBanner />

        {/* Live Viral Desi MMS Video Grid */}
        <section aria-label="Viral Desi MMS Videos" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#FF9900]">
              Latest Viral Desi MMS Videos
            </h2>
            <span className="text-xs text-gray-400">Page {page}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {videos.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`} className="block">
                <VideoCard video={video as never} />
              </Link>
            ))}
          </div>
        </section>

        {/* Pagination */}
        <div className="mt-10 flex justify-center items-center gap-3">
          {page > 1 && (
            <Link
              href={page === 2 ? '/viral-desi-mms' : `/viral-desi-mms?page=${page - 1}`}
              className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold transition"
            >
              ← Prev Page
            </Link>
          )}
          <span className="px-4 py-2 bg-[#161616] rounded-full text-sm font-bold text-[#FF9900]">
            Page {page}
          </span>
          <Link
            href={`/viral-desi-mms?page=${page + 1}`}
            className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold transition"
          >
            Next Page →
          </Link>
        </div>

        {/* Bottom Banner */}
        <div className="mt-8">
          <JuicyBanner adzone={1133788} width={308} height={286} />
        </div>

        {/* Clean Editorial & Internal Linking Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-black text-[#FF9900] mb-2">
            About Viral Desi MMS on HubTube (IndianSexVideo.tv)
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mb-5 leading-relaxed">
            Our Viral Desi MMS hub indexes newly uploaded Desi clips, Indian bhabhi videos, and HD streams directly so visitors can watch on mobile or desktop with instant timeline seeking. Return anytime to the{' '}
            <Link href="/" className="text-[#FF9900] hover:underline font-semibold">
              IndianSexVideo.tv main page
            </Link>{' '}
            to browse all trending categories and live search results.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/"
              className="text-xs bg-[#FF9900] text-black font-black px-3.5 py-1.5 rounded-full transition"
            >
              ← Back to Main Page
            </Link>
            {SEO_DESI_HUB_LINKS.map((term) => (
              <Link
                key={term}
                href={`/category/${toCategorySlug(term)}`}
                className="text-xs bg-[#161616] hover:bg-[#FF9900] hover:text-black text-gray-300 px-3 py-1.5 rounded-full border border-gray-800 transition"
              >
                {term}
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/terms" className="hover:text-[#FF9900] transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#FF9900] transition">
                Privacy Policy
              </Link>
              <Link href="/dmca" className="hover:text-[#FF9900] transition">
                DMCA / Takedown
              </Link>
              <Link href="/2257" className="hover:text-[#FF9900] transition">
                18 U.S.C. § 2257
              </Link>
            </div>
            <p className="text-gray-500">
              © {new Date().getFullYear()} indiansexvideo.tv (HubTube) • 18+ Adults Only • RTA-5042-1996-1400-1577-RTA
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
