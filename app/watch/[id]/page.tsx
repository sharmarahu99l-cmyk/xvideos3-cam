import type { Metadata } from 'next';
import WatchClient, { type WatchVideo } from './WatchClient';
import manualVideos from '../../../data/manual-videos.json';
import {
  buildUniqueSeoDescription,
  cleanEpornerTitle,
  extractVideoTags,
  isValidRealTitle,
} from '../../../lib/seoDescription';

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

async function fetchTitleFromRedirectSlug(id: string): Promise<string> {
  try {
    const res = await fetch(`https://www.eporner.com/video-${encodeURIComponent(id)}/`, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });
    const loc = res.headers.get('location') || '';
    const slugMatch = loc.match(/\/video-[^/]+\/([^/?#]+)/i);
    if (slugMatch && slugMatch[1]) {
      const words = slugMatch[1]
        .replace(/[-_]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
      const candidate = words.join(' ');
      if (isValidRealTitle(candidate, id)) return candidate;
    }
  } catch {}
  return '';
}

async function fetchRealTitleFromEmbed(id: string): Promise<string> {
  try {
    const res = await fetch(`https://www.eporner.com/embed/${encodeURIComponent(id)}/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
      headers: {
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
    });
    if (!res.ok) return '';
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const decoded = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      return cleanEpornerTitle(decoded, id);
    }
  } catch {}
  return '';
}

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
      length_sec: 390,
      views: manualHit.views || '25400',
      keywords: manualHit.keywords || extractVideoTags(manualHit.title).join(', '),
      embed: manualHit.embed,
      added: '2026-11-26 12:00:00',
    } as WatchVideo;
  }

  // 2. Fetch live Eporner JSON metadata (real title, real keywords/tags, views, duration)
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
        const realTitle = cleanEpornerTitle(data?.title || '', id);
        if (data?.id && realTitle) {
          const derivedTags = extractVideoTags(realTitle, data.keywords);
          return {
            ...data,
            title: realTitle,
            keywords: derivedTags.join(', '),
            embed:
              typeof data.embed === 'string' && data.embed.startsWith('http')
                ? data.embed
                : `https://www.eporner.com/embed/${encodeURIComponent(id)}/`,
          };
        }
      }
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 250));
    }
  }

  // 3. Resolve real title from Eporner canonical URL slug redirect or embed <title>
  const slugTitle = await fetchTitleFromRedirectSlug(id);
  const embedTitle = slugTitle ? '' : await fetchRealTitleFromEmbed(id);
  const resolvedTitle = slugTitle || embedTitle || `Desi Viral HD Video ${id}`;
  const resolvedTags = extractVideoTags(resolvedTitle);

  return {
    id,
    title: resolvedTitle,
    default_thumb: { src: '' },
    length_min: '08:15',
    length_sec: 495,
    views: '18400',
    keywords: resolvedTags.join(', '),
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
  const realTitle = video?.title || `Desi Viral HD Video ${id}`;
  const uniqueDescription = buildUniqueSeoDescription({
    id,
    title: realTitle,
    keywords: video?.keywords,
    duration: video?.length_min,
    views: video?.views,
  });

  return {
    title: `${realTitle} | HubTube - IndianSexVideo.tv`,
    description: uniqueDescription,
    keywords: video?.keywords,
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

  const uniqueDescription = initialVideo
    ? buildUniqueSeoDescription({
        id,
        title: initialVideo.title,
        keywords: initialVideo.keywords,
        duration: initialVideo.length_min,
        views: initialVideo.views,
      })
    : '';

  const jsonLd = initialVideo
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: initialVideo.title,
        description: uniqueDescription,
        keywords: initialVideo.keywords,
        thumbnailUrl: initialVideo.default_thumb?.src
          ? [initialVideo.default_thumb.src]
          : undefined,
        uploadDate: initialVideo.added
          ? new Date(initialVideo.added).toISOString()
          : '2026-11-26T00:00:00Z',
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
