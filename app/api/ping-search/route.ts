import { NextResponse } from 'next/server';

export async function GET() {
  const host = 'indiansexvideo.tv';
  const sitemapIndexUrl = `https://${host}/sitemap-index.xml`;

  const indexNowPayload = {
    host,
    key: '33f53b49382ab3ecf8eef01eca5dee29',
    urlList: [
      `https://${host}/`,
      `https://${host}/?q=desi`,
      `https://${host}/?q=desi%20videos`,
      `https://${host}/?q=desi%20porn`,
      `https://${host}/?q=desi%20mms`,
      `https://${host}/?q=viral%20desi`,
      `https://${host}/?q=new%20desi`,
      `https://${host}/categories`,
      `https://${host}/pornstars`,
    ],
  };

  let indexNowStatus = 0;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload),
    });
    indexNowStatus = res.status;
  } catch {
    indexNowStatus = 500;
  }

  return NextResponse.json({
    ok: true,
    sitemap: sitemapIndexUrl,
    indexNowStatus,
    updatedAt: new Date().toISOString(),
  });
}
