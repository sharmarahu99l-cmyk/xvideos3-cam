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

  // 1. Check manually pinned videos in data/manual-videos.json
  const pinned = (Array.isArray(manualVideos) ? manualVideos : []) as ManualVideoEntry[];
  const manualHit = pinned.find((m) => m && m.id === id);
  if (manualHit) {
    return {
      id: manualHit.id,
      title: manualHit.title,
      default_thumb: { src: manualHit.thumb },
      length_min: manualHit.duration || '06:30',
      views: manualHit.views || '25.4K',
      keywords: manualHit.keywords || 'desi mms, viral desi, indian hd',
      embed: manualHit.embed,
      added: '2026-11-26 12:00:00',
    } as WatchVideo;
  }

  // 2. Fetch live Eporner video details (including full keywords/tags, duration, views, thumb)
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
    if (res.ok) {
      const data: WatchVideo = await res.json();
      if (data?.id && data?.title) {
        return {
          ...data,
          embed:
            typeof data.embed === 'string' && data.embed.startsWith('http')
              ? data.embed
              : `https://www.eporner.com/embed/${encodeURIComponent(id)}/`,
        };
      }
    }
  } catch {}

  // 3. Guaranteed fallback object so WatchClient ALWAYS renders the player, description, tags & Similar Videos
  return {
    id,
    title: `Watch HD Desi & Viral Video (${id})`,
    default_thumb: { src: '' },
    length_min: '08:15',
    length_sec: 495,
    views: '18.4K',
    keywords: 'desi, indian, desi mms, bhabhi, viral video, hd porn',
    embed: `https://www.eporner.com/embed/${encodeURIComponent(id)}/`,
    added: '2026-11-26 12:00:00',
  } as WatchVideo;
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
