import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/id/?id=${encodeURIComponent(id)}&thumbsize=big&format=json`,
      {
        next: { revalidate: 3600 },
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36' },
      }
    );

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
    // Client will use direct Eporner fallback
  }

  return NextResponse.json(null, { status: 200 });
}
