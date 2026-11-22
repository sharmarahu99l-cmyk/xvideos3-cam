import { NextResponse } from 'next/server';
import { searchPornhubVideos } from '../../lib/pornhub';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || 'desi';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const order = searchParams.get('order') || 'most_viewed';

  const videos = await searchPornhubVideos(q, page, order);

  return NextResponse.json(videos, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
