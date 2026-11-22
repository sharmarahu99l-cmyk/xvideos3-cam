import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(null, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/${encodeURIComponent(id)}/?format=json`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
        },
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      }
    }
  } catch {
    // Return null on timeout/error
  }

  return NextResponse.json(null, { status: 200 });
}
