export function toCategorySlug(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fromCategorySlug(slug: string): string {
  return decodeURIComponent(slug || '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// High-volume, lower-competition long-tail keywords + core category hubs
export const SEO_DESI_HUB_LINKS = [
  'Desi Videos', 'Desi MMS', 'Viral Desi MMS', 'New Desi Videos', 'Desi Bhabhi',
  'Hindi Audio Sex', 'Indian Bhabhi Saree', 'Desi Village Girl', 'Desi Couple Homemade',
  'Punjabi Kudi Viral', 'Pakistani Leaked MMS', 'Indian Aunty Homemade', 'Bhabhi Devar Romance',
  'Desi College Girl MMS', 'Indian Wife Homemade', 'Desi Hidden Cam', 'Desi Suhag Raat',
  'South Indian Desi', 'Tamil Desi MMS', 'Telugu Desi Videos', 'Bengali Bhabhi MMS',
  'Marathi Bhabhi', 'Gujarati Aunty', 'Mallu Aunty Homemade', 'Bhojpuri Desi',
  'Desi Leaked Scandal', 'Indian Homemade Uncut', 'Desi Salwar Suit', 'Punjabi Desi',
  'Indian Porn 1080p', 'Desi Big Boobs', 'Desi Big Ass', 'Pakistani MMS', 'Indian MMS',
  'Desi Porn',
];

export const ALL_SITEMAP_CATEGORIES = Array.from(
  new Set([
    ...SEO_DESI_HUB_LINKS,
    'MMS', 'Viral MMS', 'Amateur', '1080p', '4K', '60 FPS',
    'Asian', 'Japanese', 'Anal', 'Teen', 'VR Porn', 'Big Tits', 'Big Ass',
    'MILF', 'POV', 'Creampie', 'Hardcore', 'Threesome', 'Latina', 'Ebony',
    'Interracial', 'Lesbian', 'Blowjob', 'Cumshot', 'Masturbation', 'Blonde',
    'Brunette', 'Redhead', 'Petite', 'BBW', 'Massage', 'Public', 'Office',
    'Lingerie', 'Squirt', 'Fetish', 'BDSM', 'Solo', 'Homemade', 'Top Rated',
  ])
);

export function buildCategorySeoCopy(
  rawTitle: string,
  page: number = 1
): {
  displayTitle: string;
  metaTitle: string;
  metaDescription: string;
  articleParagraphs: string[];
} {
  const clean = rawTitle.trim() || 'Desi Videos';
  const displayTitle = clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const pageSuffix = page > 1 ? ` (Page ${page})` : '';
  const metaTitle = `${displayTitle}${pageSuffix} — Free HD ${displayTitle} & Viral Clips | HubTube XVideos3`;
  const metaDescription = `Watch the newest ${displayTitle}${pageSuffix} in full HD 1080p and 4K on HubTube (XVideos3.cam). Updated hourly with trending ${displayTitle}, viral clips, and fast mobile streaming.`;

  const articleParagraphs = [
    `Welcome to the dedicated ${displayTitle} hub on HubTube (XVideos3.cam), updated automatically every hour with the highest-rated and most-watched ${displayTitle}. Whether you are browsing on mobile or desktop, our fast-loading player delivers smooth HD 1080p and 4K playback without forced registration walls.`,
    `Explore thousands of hand-indexed ${displayTitle} uploads sorted by popularity, weekly trending views, and latest releases. You can also swipe through vertical short clips in HubReels or discover related niches across our category directory. All content indexed on XVideos3.cam complies with RTA adult labeling and 18 U.S.C. § 2257 requirements.`,
  ];

  return { displayTitle, metaTitle, metaDescription, articleParagraphs };
}