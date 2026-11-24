import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import {
  ALL_CATEGORIES,
  ALL_PORNSTARS,
  toCategorySlug,
  toPornstarSlug,
} from '../../lib/seoData';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://indiansexvideo.tv';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'indiansexvideo992837465indexnow';

async function getLatestVideoUrls(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://www.eporner.com/api/v2/video/search/?query=desi&per_page=50&page=1&order=latest&lq=0&thumbsize=big&format=json',
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const videos = Array.isArray(data?.videos) ? data.videos : [];
    return videos
      .map((v: { id?: string }) => (v?.id ? `${BASE_URL}/watch/${encodeURIComponent(v.id)}` : ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function submitToGoogleIndexingApi(urls: string[]) {
  const rawCreds = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (!rawCreds) {
    return { submitted: 0, error: 'Missing GOOGLE_INDEXING_CREDENTIALS env variable' };
  }

  const credentials = JSON.parse(rawCreds);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse?.token;
  if (!accessToken) {
    return { submitted: 0, error: 'Failed to obtain Google OAuth access token' };
  }

  let submitted = 0;
  // Google Indexing API default quota is 200 URL notifications per day
  for (const url of urls.slice(0, 150)) {
    try {
      const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
      });
      if (res.ok) submitted++;
    } catch {}
  }

  return { submitted };
}

async function submitToIndexNow(urls: string[]) {
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'indiansexvideo.tv',
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 500),
      }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 500 };
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const latestVideos = await getLatestVideoUrls();
  const categoryUrls = ALL_CATEGORIES.slice(0, 40).map(
    (c) => `${BASE_URL}/category/${toCategorySlug(c)}`
  );
  const pornstarUrls = ALL_PORNSTARS.slice(0, 40).map(
    (s) => `${BASE_URL}/pornstar/${toPornstarSlug(s)}`
  );

  const batchUrls = Array.from(
    new Set([
      `${BASE_URL}/`,
      `${BASE_URL}/reels`,
      ...latestVideos,
      ...categoryUrls,
      ...pornstarUrls,
    ])
  );

  const [googleResult, indexNowResult] = await Promise.all([
    submitToGoogleIndexingApi(batchUrls),
    submitToIndexNow(batchUrls),
  ]);

  return NextResponse.json({
    totalUrls: batchUrls.length,
    google: googleResult,
    indexNow: indexNowResult,
  });
}