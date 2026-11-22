import { NextResponse } from 'next/server';
import { searchPornhubVideos } from '../../lib/pornhub';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || 'desi';
  const order = searchParams.get('order') || 'most_viewed';

  const videos = await searchPornhubVideos(q, 1, order);
  const firstThumb = videos[0]?.default_thumb?.src || '';

  return NextResponse.json(
    { thumb: firstThumb, videos: videos.slice(0, 10) },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
