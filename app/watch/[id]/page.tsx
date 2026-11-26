import RelatedVideos from "../../../components/RelatedVideos";
import type { Metadata } from 'next';
import WatchClient, { type WatchVideo } from './WatchClient';

async function getVideoById(id: string): Promise<WatchVideo | null> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      {
        next: { revalidate: 1800 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return null;
    const data: WatchVideo = await res.json();
    return data?.id ? data : null;
  } catch {
    return null;
  }
}

function toIsoDuration(lengthSec?: number | string): string {
  const total = Math.max(1, Number(lengthSec) || 60);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return `PT${hrs > 0 ? `${hrs}H` : ''}${mins}M${secs}S`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);
  const title = video?.title
    ? `${video.title} | HubTube - IndianSexVideo HD`
    : 'Watch Free HD Video | HubTube - IndianSexVideo';
  return {
    title,
    description: `Stream ${video?.title || 'HD Desi and viral videos'} free on HubTube (indiansexvideo.tv).`,
    alternates: { canonical: `/watch/${encodeURIComponent(id)}` },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id.startsWith("xh-")) {
    const xhId = id.slice(3);
    return (
      <main className="mx-auto max-w-5xl px-3 py-6">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe src={`https://xhamster.com/embed/${xhId}`} className="h-full w-full border-0" allowFullScreen />
        </div>
      </main>
    );
  }
  const initialVideo = await getVideoById(id);

  const jsonLd = initialVideo
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: initialVideo.title,
        description: `Watch ${initialVideo.title} in free HD on HubTube (indiansexvideo.tv).`,
        thumbnailUrl: initialVideo.default_thumb?.src
          ? [initialVideo.default_thumb.src]
          : undefined,
        uploadDate: initialVideo.added
          ? new Date(initialVideo.added).toISOString()
          : '2026-01-01T00:00:00Z',
        duration: toIsoDuration(initialVideo.length_sec),
        embedUrl: `https://www.eporner.com/embed/${encodeURIComponent(id)}/`,
        contentUrl: `https://indiansexvideo.tv/watch/${encodeURIComponent(id)}`,
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WatchAction' },
          userInteractionCount:
            Number(String(initialVideo.views ?? 1000).replace(/[^0-9]/g, '')) || 1000,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <WatchClient id={id} initialVideo={initialVideo} />
    </>
  );
}