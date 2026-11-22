import type { Metadata } from 'next';
import WatchClient, { WatchVideo } from './WatchClient';

async function getVideoById(id: string): Promise<WatchVideo | null> {
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/${encodeURIComponent(id)}/?format=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.id) return null;
    return data as WatchVideo;
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

  if (!video || !video.title) {
    return {
      title: `Watch HD Video ${id}`,
      description: 'Watch free HD Desi and adult videos streaming fast on HubTube (XVideos3.cam).',
      alternates: { canonical: `/watch/${id}` },
    };
  }

  const cleanTitle = video.title.trim();
  const keywordList = video.keywords
    ? video.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];
  const description = `Watch ${cleanTitle} in full HD on HubTube (XVideos3.cam). Free streaming ${keywordList.slice(0, 6).join(', ')} video.`;

  return {
    title: cleanTitle,
    description,
    keywords: [...keywordList, 'desi videos', 'hd porn', 'hubtube', 'xvideos3'],
    alternates: {
      canonical: `/watch/${id}`,
    },
    openGraph: {
      type: 'video.other',
      url: `https://xvideos3.cam/watch/${id}`,
      title: `${cleanTitle} - HubTube HD`,
      description,
      images: video.default_thumb?.src ? [{ url: video.default_thumb.src }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description,
      images: video.default_thumb?.src ? [video.default_thumb.src] : undefined,
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

  const durationIso = video
    ? `PT${video.length_min || 0}M${video.length_sec || 0}S`
    : undefined;

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
