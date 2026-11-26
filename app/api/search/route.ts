import { NextResponse } from 'next/server';
import { searchUnifiedVideos } from '../../../lib/keywordFeed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || 'desi';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(60, Math.max(10, Number(searchParams.get('per_page')) || 30));
  const order = searchParams.get('order') || '';

  const videos = await searchUnifiedVideos(q, page, perPage, order);
  return NextResponse.json(videos, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
