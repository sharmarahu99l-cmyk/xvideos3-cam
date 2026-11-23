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

export const SEO_DESI_HUB_LINKS = [
  'Desi Videos', 'Desi Porn', 'Desi MMS', 'Viral Desi Videos', 'New Desi Videos',
  'Desi Bhabhi', 'Indian Bhabhi', 'Desi Aunty', 'Indian Aunty', 'Indian Porn',
  'Pakistani MMS', 'Pakistani Sex', 'Desi Chudai', 'Hindi Audio Sex', 'Punjabi Desi',
  'Punjabi Kudi', 'Desi Homemade', 'Indian Homemade', 'Desi Couple', 'Desi College Girl',
  'Desi Village Girl', 'Desi Saree Sex', 'Bhabhi Devar', 'South Indian Desi', 'Tamil Desi',
  'Telugu Desi', 'Bengali Bhabhi', 'Marathi Bhabhi', 'Gujarati Aunty', 'Mallu Aunty',
  'Bhojpuri Desi', 'Desi Leaked Scandal', 'Desi Hidden Cam', 'Desi Suhag Raat', 'Indian Wife',
];

export const ALL_SITEMAP_CATEGORIES = Array.from(
  new Set([
    ...SEO_DESI_HUB_LINKS,
    'MMS', 'Viral MMS', 'Indian MMS', 'Amateur', '1080p', '4K', '60 FPS',
    'Asian', 'Japanese', 'Anal', 'Teen', 'VR Porn', 'Big Tits', 'Big Ass',
    'MILF', 'POV', 'Creampie', 'Hardcore', 'Threesome', 'Latina', 'Ebony',
    'Interracial', 'Lesbian', 'Blowjob', 'Cumshot', 'Masturbation', 'Blonde',
    'Brunette', 'Redhead', 'Petite', 'BBW', 'Massage', 'Public', 'Office',
    'Lingerie', 'Squirt', 'Fetish', 'BDSM', 'Solo', 'Homemade', 'Top Rated',
  ])
);

export function buildCategorySeoCopy(rawTitle: string): {
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

  const metaTitle = `${displayTitle} — Free HD ${displayTitle} & Viral Clips | HubTube XVideos3`;
  const metaDescription = `Watch the newest ${displayTitle} in full HD 1080p and 4K on HubTube (XVideos3.cam). Updated hourly with trending ${displayTitle}, viral clips, and fast mobile streaming.`;

  const articleParagraphs = [
    `Welcome to the dedicated ${displayTitle} hub on HubTube (XVideos3.cam), updated automatically every hour with the highest-rated and most-watched ${displayTitle} from around the world. Whether you are browsing on mobile or desktop, our fast-loading player delivers smooth HD 1080p and 4K playback without forced registration walls or slow redirects.`,
    `Explore thousands of hand-indexed ${displayTitle} uploads sorted by popularity, weekly trending views, and latest releases. You can also swipe through vertical short clips in HubReels or discover related niches using the smart topic filters below every video grid. All content indexed on XVideos3.cam complies with RTA adult labeling and 18 U.S.C. § 2257 requirements.`,
  ];

  return { displayTitle, metaTitle, metaDescription, articleParagraphs };
}