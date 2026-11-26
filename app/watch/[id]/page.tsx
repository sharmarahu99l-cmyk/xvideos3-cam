import type { Metadata } from 'next';
import Link from 'next/link';
import manualVideos from '../../../data/manual-videos.json';
import { searchUnifiedVideos, UnifiedVideo } from '../../../lib/keywordFeed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ManualVideoEntry = {
  id: string;
  title: string;
  thumb: string;
  embed: string;
  duration?: string;
  views?: string;
  keywords?: string;
};

interface ResolvedVideo {
  id: string;
  title: string;
  embedUrl: string;
  duration: string;
  views: string;
  keywords: string;
}

async function resolveVideoById(rawId: string): Promise<ResolvedVideo | null> {
  const id = decodeURIComponent(rawId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return null;

  // 1. Check manually pinned videos (data/manual-videos.json)
  const pinned = (Array.isArray(manualVideos) ? manualVideos : []) as ManualVideoEntry[];
  const manualHit = pinned.find((m) => m && m.id === id);
  if (manualHit && manualHit.embed) {
    return {
      id: manualHit.id,
      title: manualHit.title || 'Featured HD Video',
      embedUrl: manualHit.embed,
      duration: manualHit.duration || '06:30',
      views: manualHit.views || '25.4K',
      keywords: manualHit.keywords || 'desi mms, viral desi',
    };
  }

  // 2. Fetch live Eporner metadata by ID in real time
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.id && data.title) {
        return {
          id: String(data.id),
          title: String(data.title),
          embedUrl:
            typeof data.embed === 'string' && data.embed.startsWith('http')
              ? data.embed
              : `https://www.eporner.com/embed/${encodeURIComponent(id)}/`,
          duration: String(data.length_min || '08:20'),
          views: String(data.views || '19.4K'),
          keywords: typeof data.keywords === 'string' ? data.keywords : 'desi, mms, hd',
        };
      }
    }
  } catch {}

  // 3. Direct Eporner embed fallback
  return {
    id,
    title: `HD Video Stream (${id})`,
    embedUrl: `https://www.eporner.com/embed/${encodeURIComponent(id)}/`,
    duration: '08:00',
    views: '15.0K',
    keywords: 'desi, hd',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await resolveVideoById(id);
  const title = video?.title || 'Watch HD Video | HubTube';
  return {
    title: `${title} | HubTube - IndianSexVideo.tv`,
    description: `Watch ${title} free in HD streaming on HubTube (indiansexvideo.tv).`,
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await resolveVideoById(id);

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4">
        <p className="text-xl font-bold text-[#FF9900] mb-4">Invalid Video Link</p>
        <Link href="/" className="bg-[#FF9900] text-black font-black px-5 py-2.5 rounded-full">
          ← Back to Homepage
        </Link>
      </div>
    );
  }

  const relatedTopic =
    video.title
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 2)
      .join(' ') || 'desi';

  const relatedVideos: UnifiedVideo[] = await searchUnifiedVideos(relatedTopic, 1, 15, 'most-popular');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] sticky top-0 z-50 p-3 border-b border-gray-800">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-[#FF9900]">H</span>
            <span className="text-2xl sm:text-3xl font-black text-white">UB</span>
            <span className="text-2xl sm:text-3xl font-black text-[#FF9900]">T</span>
            <span className="text-2xl sm:text-3xl font-black text-white">UBE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/reels"
              className="bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black text-xs px-3 py-2 rounded-full"
            >
              ▶ REELS
            </Link>
            <Link
              href="/"
              className="bg-[#222] hover:bg-[#FF9900] hover:text-black text-white font-bold text-xs px-3.5 py-2 rounded-full transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black border border-gray-800 shadow-2xl">
          <iframe
            src={video.embedUrl}
            title={video.title}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        </div>

        <div className="mt-4 bg-[#141414] border border-gray-800 rounded-2xl p-4">
          <h1 className="text-lg sm:text-2xl font-black text-white leading-snug">
            {video.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-400">
            <span>👁 {video.views} views</span>
            <span>⏱ {video.duration}</span>
            <span className="text-[#FF9900] font-semibold">HD Stream</span>
          </div>
        </div>

        {relatedVideos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-black text-[#FF9900] mb-4">Related HD Videos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {relatedVideos
                .filter((rv) => rv.id !== video.id)
                .slice(0, 10)
                .map((rv) => (
                  <Link
                    key={rv.id}
                    href={`/watch/${rv.id}`}
                    className="group bg-[#161616] rounded-xl overflow-hidden border border-gray-800 hover:border-[#FF9900] transition block"
                  >
                    <div className="aspect-video bg-black overflow-hidden relative">
                      <img
                        src={rv.default_thumb.src}
                        alt={rv.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {rv.length_min && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {rv.length_min}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-gray-200 line-clamp-2 group-hover:text-[#FF9900]">
                        {rv.title}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
