import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface ReelItem {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: string | number;
  length_sec?: number | string;
  views?: string | number;
  keywords?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || 'desi').trim();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const orderingParam = searchParams.get('order') || 'top-weekly';

  const epornerOrder =
    orderingParam === 'newest' || orderingParam === 'latest'
      ? 'latest'
      : orderingParam === 'rating' || orderingParam === 'top-rated'
      ? 'top-rated'
      : orderingParam === 'mostviewed' || orderingParam === 'most-popular'
      ? 'most-popular'
      : 'top-weekly';

  try {
    const url = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      query
    )}&per_page=18&page=${page}&order=${encodeURIComponent(
      epornerOrder
    )}&lq=0&thumbsize=big&format=json`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
    }

    const data = await res.json();
    const list = Array.isArray(data?.videos) ? data.videos : [];
    const out: ReelItem[] = [];

    for (const v of list) {
      const vidId = String(v?.id || '').trim();
      const title = String(v?.title || '').trim();
      const thumb = String(v?.default_thumb?.src || '').trim();
      if (!vidId || !title || !thumb.startsWith('http')) continue;

      out.push({
        id: vidId,
        title,
        default_thumb: { src: thumb },
        length_min: v?.length_min,
        length_sec: v?.length_sec,
        views: v?.views ?? 0,
        keywords: typeof v?.keywords === 'string' ? v.keywords : '',
      });
    }

    return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}