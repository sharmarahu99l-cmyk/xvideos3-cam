import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q) return NextResponse.json([]);

  const res = await fetch(
    `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=20&page=1&order=most_viewed`
  );
  const data = await res.json();

  return NextResponse.json(data.videos || []);
}