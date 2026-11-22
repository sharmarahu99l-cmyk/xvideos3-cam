import type { Metadata } from 'next';
import WatchClient, { type WatchVideo } from './WatchClient';

async function getVideoById(id: string): Promise<WatchVideo | null> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      {
        next: { revalidate: 3600 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.id ? (data as WatchVideo) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);

  const title = video?.title
    ? `${video.title} | HubTube - XVideos3 HD`
    : 'Watch Free HD Desi & Adult Video | HubTube - XVideos3';

  const description = video?.title
    ? `Watch ${video.title} full HD video streaming free on HubTube (XVideos3.cam). Fast HD playback, viral Desi MMS, and Indian porn videos.`
    : 'Watch free HD Desi porn, viral MMS, and 4K adult videos streaming fast on HubTube (XVideos3.cam).';

  const thumb = video?.default_thumb?.src;

  return {
    title,
    description,
    alternates: {
      canonical: `/watch/${id}`,
    },
    openGraph: {
      type: 'video.other',
      title,
      description,
      url: `https://xvideos3.cam/watch/${id}`,
      ...(thumb ? { images: [{ url: thumb }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(thumb ? { images: [thumb] } : {}),
    },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await getVideoById(id);

  const durationSeconds =
    (video?.length_min || 0) * 60 + (video?.length_sec || 0);
  const durationIso = `PT${Math.max(1, durationSeconds)}S`;

  const videoSchema = video
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: `Watch ${video.title} full HD video on HubTube (XVideos3.cam).`,
        thumbnailUrl: video.default_thumb?.src ? [video.default_thumb.src] : [],
        uploadDate: video.added || new Date().toISOString(),
        duration: durationIso,
        embedUrl: `https://www.eporner.com/embed/${id}/`,
        contentUrl: `https://xvideos3.cam/watch/${id}`,
      }
    : null;

  return (
    <>
      {videoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
        />
      )}
      <WatchClient id={id} initialVideo={video} />
    </>
  );
}