import { NextResponse } from 'next/server';
import { getPornhubVideoById } from '../../../lib/pornhub';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await getPornhubVideoById(id);

  if (!video) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(video, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
