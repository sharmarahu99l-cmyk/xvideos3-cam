export function cleanEpornerTitle(rawTitle: string, id: string): string {
  const cleaned = (rawTitle || '')
    .replace(/\s*[-|]\s*EPORNER(\.COM)?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || `HD Video Stream ${id}`;
}

export function isFallbackPlaceholderTitle(title: string, id: string): boolean {
  const lower = (title || '').toLowerCase();
  return (
    !title ||
    lower.includes(`(${id.toLowerCase()})`) ||
    lower.startsWith('watch hd desi & viral video') ||
    lower.startsWith('hd video stream') ||
    lower.startsWith('desi & viral hd clip')
  );
}

export function extractVideoTags(title: string, rawKeywords?: string): string[] {
  const stopWords = new Set([
    'with', 'from', 'that', 'this', 'have', 'video', 'videos', 'watch', 'free',
    'porn', 'stream', 'streaming', 'online', 'full', 'part', 'eporner', 'hubtube',
    'making', 'xxxvideos',
  ]);

  const titleLower = title.toLowerCase().trim();
  const fromKeywords = (rawKeywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => {
      const low = k.toLowerCase();
      return low.length >= 3 && low !== titleLower && !stopWords.has(low);
    });

  const fromTitle = title
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
  const title = cleanEpornerTitle(params.title, params.id);
  const tags = extractVideoTags(title, params.keywords);
  const topCluster = tags.slice(0, 4).join(', ');
  const midCluster = tags.slice(4, 8).join(', ');
  const durationLabel = params.duration ? `${params.duration} full-length` : 'full-length HD';
  const viewsLabel = params.views ? `${Number(params.views).toLocaleString()} views` : 'trending views';

  const sentence1 = `Watch "${title}" in ${durationLabel} HD (${viewsLabel}) on IndianSexVideo.tv.`;
  const sentence2 = topCluster
    ? ` Categorized under ${topCluster}${midCluster ? ` with themes including ${midCluster}` : ''}, this upload delivers instant adaptive streaming and mobile-ready playback.`
    : ` Indexed for instant adaptive streaming, mobile-ready playback, and fast timeline seeking without buffering.`;
  const sentence3 = ` Browse similar ${tags[0] || 'desi'} and ${tags[1] || 'viral'} clips matched directly to "${title}" below.`;

  return `${sentence1}${sentence2}${sentence3}`;
}
