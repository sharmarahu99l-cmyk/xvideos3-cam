export function isValidRealTitle(title: string, id?: string): boolean {
  const clean = (title || '').trim();
  if (clean.length < 4) return false;
  if (!/[a-zA-Z0-9]{2,}/.test(clean)) return false;
  const lower = clean.toLowerCase();
  if (id && lower.includes(`(${id.toLowerCase()})`)) return false;
  if (
    lower.startsWith('watch hd desi & viral video') ||
    lower.startsWith('hd video stream') ||
    lower.startsWith('desi & viral hd clip') ||
    lower === 'eporner' ||
    lower === 'just a moment...' ||
    lower === 'attention required!'
  ) {
    return false;
  }
  return true;
}

export function cleanEpornerTitle(rawTitle: string, id: string): string {
  const cleaned = (rawTitle || '')
    .replace(/\s*[-|]\s*EPORNER(\.COM)?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return isValidRealTitle(cleaned, id) ? cleaned : '';
}

export function isFallbackPlaceholderTitle(title: string, id: string): boolean {
  return !isValidRealTitle(title, id);
}

export function extractVideoTags(title: string, rawKeywords?: string): string[] {
  const stopWords = new Set([
    'with', 'from', 'that', 'this', 'have', 'video', 'videos', 'watch', 'free',
    'porn', 'stream', 'streaming', 'online', 'full', 'part', 'eporner', 'hubtube',
    'making', 'xxxvideos', 'clip', 'clips', 'viral',
  ]);

  const safeTitle = isValidRealTitle(title) ? title : '';
  const titleLower = safeTitle.toLowerCase().trim();

  const fromKeywords = (rawKeywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => {
      const low = k.toLowerCase();
      return low.length >= 3 && low !== titleLower && !stopWords.has(low);
    });

  const fromTitle = safeTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w) && !stopWords.has(w));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...fromKeywords, ...fromTitle]) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out.slice(0, 15);
}

export function buildUniqueSeoDescription(params: {
  id: string;
  title: string;
  keywords?: string;
  duration?: string | number;
  views?: string | number;
}): string {
  const validTitle = isValidRealTitle(params.title, params.id)
    ? params.title.trim()
    : `Desi Viral HD Video ${params.id}`;
  const tags = extractVideoTags(validTitle, params.keywords);
  const topCluster = tags.slice(0, 4).join(', ');
  const midCluster = tags.slice(4, 8).join(', ');
  const durationLabel = params.duration ? `${params.duration} full-length` : 'full-length HD';
  const rawViewsNum = Number(String(params.views || '').replace(/[^0-9]/g, ''));
  const viewsLabel =
    rawViewsNum > 0 ? `${rawViewsNum.toLocaleString()} views` : 'trending views';

  const sentence1 = `Watch "${validTitle}" in ${durationLabel} HD (${viewsLabel}) on IndianSexVideo.tv.`;
  const sentence2 = topCluster
    ? ` Tagged under ${topCluster}${midCluster ? ` featuring ${midCluster}` : ''}, this upload delivers instant adaptive streaming and smooth timeline scrubbing across mobile and desktop.`
    : ` Indexed for instant adaptive streaming, mobile playback, and smooth timeline scrubbing without buffering.`;
  const sentence3 = ` Discover similar ${tags[0] || 'desi'} and ${tags[1] || 'indian'} videos matched directly to "${validTitle}" below.`;

  return `${sentence1}${sentence2}${sentence3}`;
}
