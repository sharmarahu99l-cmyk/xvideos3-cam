import type { Metadata } from 'next';
import WatchClient, { type WatchVideo } from './WatchClient';
import manualVideos from '../../../data/manual-videos.json';

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

async function getVideoById(rawId: string): Promise<WatchVideo | null> {
  const id = decodeURIComponent(rawId || '').trim();
  if (!id) return null;

  const pinned = (Array.isArray(manualVideos) ? manualVideos : []) as ManualVideoEntry[];
  const manualHit = pinned.find((m) => m && m.id === id);
  if (manualHit) {
    return {
      id: manualHit.id,
      title: manualHit.title,
      default_thumb: { src: manualHit.thumb },
      length_min: manualHit.duration || '06:30',
      length_sec: 390,
      views: manualHit.views || '25.4K',
      keywords: manualHit.keywords || 'desi mms, viral desi',
      embed: manualHit.embed,
      added: '2026-01-01 00:00:00',
    } as WatchVideo;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(4500),
          headers: {
            Accept: 'application/json, text/plain, */*',
          },
        }
      );
      if (res.status === 503 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      if (res.ok) {
        const data: WatchVideo = await res.json();
        if (data?.id && data?.title && data.title.trim().length > 2) {
          return data;
        }
      }
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
    }
  }

  return null;
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
