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

export const toPornstarSlug = toCategorySlug;
export const fromPornstarSlug = fromCategorySlug;

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

// 120+ Categories covering every major adult niche on the web
export const ALL_CATEGORIES: string[] = Array.from(
  new Set([
    ...SEO_DESI_HUB_LINKS,
    // Formats & Quality
    '1080p HD', '4K Ultra HD', '60 FPS', 'VR Porn', 'POV', 'Homemade', 'Amateur',
    'Hidden Cam', 'Webcam', 'Public', 'Outdoor', 'Uncensored', 'Full Movie',
    // Popular Niches & Actions
    'Anal', 'Blowjob', 'Creampie', 'Cumshot', 'Hardcore', 'Threesome', 'Group Sex',
    'Orgy', 'Gangbang', 'Double Penetration', 'Squirt', 'Masturbation', 'Handjob',
    'Footjob', 'Fisting', 'Bukkake', 'Swinger', 'Cuckold', 'Fetish', 'BDSM',
    'Bondage', 'Massage', 'Striptease', 'Roleplay', 'Cosplay', 'Hentai', 'ASMR',
    // Body Types & Age Ranges
    'Teen', 'MILF', 'Mature', 'BBW', 'Petite', 'Big Tits', 'Small Tits', 'Big Ass',
    'Natural Tits', 'Blonde', 'Brunette', 'Redhead', 'Curvy', 'Skinny', 'Solo Girl',
    'Housewives', 'College Girls', 'Students',
    // Ethnicities & Regional
    'Indian', 'Asian', 'Japanese', 'Korean', 'Chinese', 'Thai', 'Filipina',
    'Latina', 'Brazilian', 'Colombian', 'Ebony', 'Interracial', 'Arab', 'Turkish',
    'Russian', 'European', 'Czech', 'German', 'French', 'Italian', 'British',
    // Settings & Outfits
    'Lingerie', 'Stockings', 'Saree', 'Uniform', 'Nurses', 'Office', 'Doctor',
    'Teacher', 'Maid', 'Hotel', 'Shower', 'Gym', 'Car', 'Beach',
    // Orientations & Other
    'Lesbian', 'Bisexual', 'Gay', 'Shemale', 'For Women', 'Vintage', 'Top Rated',
  ])
);

// 150+ Top International, Desi-Origin, Classic & Trending Pornstars
export const ALL_PORNSTARS: string[] = Array.from(
  new Set([
    // Top Global Stars
    'Angela White', 'Riley Reid', 'Mia Khalifa', 'Lana Rhoades', 'Abella Danger',
    'Dani Daniels', 'Ava Addams', 'Cory Chase', 'Violet Myers', 'Lauren Phillips',
    'Lena Paul', 'Valentina Nappi', 'Brandi Love', 'Natasha Nice', 'Adriana Chechik',
    'Savannah Bond', 'Lisa Ann', 'Mia Malkova', 'Alexis Fawx', 'Sara Jay',
    'Aidra Fox', 'Blake Blossom', 'Little Caprice', 'Nicole Aniston', 'Cherie DeVille',
    'Alexis Texas', 'Melody Marks', 'Kendra Lust', 'Mandy Muse', 'Lulu Chu',
    'Kenzie Reeves', 'Jennifer White', 'Abigaiil Morris', 'Emily Willis', 'Dee Williams',
    'Jane Wilde', 'Alyx Star', 'Maria Nagai', 'Kelsi Monroe', 'Alex Coal',
    'Lexi Luna', 'Payton Preslee', 'Syren De Mer', 'Gabbie Carter', 'Hazel Moore',
    'Skylar Vox', 'Bridgette B', 'Jada Stevens', 'Julia Ann', 'Phoenix Marie',
    'Anissa Kate', 'Chanel Preston', 'Alura Jenson', 'Reagan Foxx', 'Eliza Ibarra',
    'Ariella Ferrera', 'Sasha Grey', 'Eva Lovia', 'August Ames', 'Tori Black',
    'Madison Ivy', 'Asa Akira', 'Hitomi Tanaka', 'Eimi Fukada', 'Rae Lil Black',
    'Eva Elfie', 'Sweetie Fox', 'Luxury Girl', 'Jia Lissa', 'Liya Silver',
    'Nancy Ace', 'Josephine Jackson', 'Octavia Red', 'Autumn Falls', 'Kendra Sunderland',
    'Leah Gotti', 'Elsa Jean', 'Piper Perri', 'Katrina Jade', 'Janice Griffith',
    'Romina Rain', 'Kira Noir', 'Ana Foxxx', 'Maitland Ward', 'Brooklyn Chase',
    'Krissy Lynn', 'Peta Jensen', 'Dillion Harper', 'Remy Lacroix', 'Bonnie Rotten',
    'Christy Mack', 'Stoya', 'Jenna Jameson', 'Bree Olson', 'Rachel Starr',
    'Sophie Dee', 'Gianna Michaels', 'Kagney Linn Karter', 'Siri Dahl', 'Casey Calvert',
    'Luna Star', 'Karma Rx', 'Gina Valentina', 'Karlee Grey', 'Nicole Kitt',
    'Vanna Bardot', 'Kylie Page', 'Kenzi Anne', 'Sabina Rouge', 'Freya Parker',
    'alina Lopez', 'Scarlit Scandal', 'Demi Sutra', 'Aaliyah Hadid', 'Lacy Lennon',
    'Bella Rolland', 'Kenna James', 'Maya Woulfe', 'Destiny Cruz', 'Chloe Amour',
    'Kimmy Granger', 'Romi Rain', 'aj Applegate', 'Dani Jensen', 'Veronica Rodriguez',
    'Brianna Beach', 'India Summer', 'Sarah Vandella', 'Tiffany Tatum', 'Stacy Cruz',
    // Desi / Indian-Origin Stars
    'Sunny Leone', 'Priya Rai', 'Anjali Kara', 'Sahara Knite', 'Riya Sen',
    'Nadia Ali', 'Shazia Sahari', 'Destiny Dixon', 'Sofia Rose', 'Pamela Sanchez',
    'Misha Maver', 'Jazmin Luv', 'Alina Rai', 'Zara DuRose', 'Maya Bijou',
    // Top Male Performers
    'Johnny Sins', 'Manuel Ferrara', 'Mick Blue', 'Jordi El Nino Polla', 'Keiran Lee',
    'Danny D', 'James Deen', 'Bruce Venture', 'Xander Corvus', 'Ramon Nomar',
    'Markus Dupree', 'Small Hands', 'Damion Dayski', 'Jason Luv', 'Dredd',
  ])
);

export const ALL_SITEMAP_CATEGORIES = ALL_CATEGORIES;

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
  const metaTitle = `${displayTitle}${pageSuffix} — Free HD ${displayTitle} & Viral Clips | HubTube IndianSexVideo`;
  const metaDescription = `Watch the newest ${displayTitle}${pageSuffix} in full HD 1080p and 4K on HubTube (indiansexvideo.tv). Updated hourly with trending ${displayTitle}, viral clips, and fast mobile streaming.`;

  const articleParagraphs = [
    `Welcome to the dedicated ${displayTitle} hub on HubTube (indiansexvideo.tv), updated automatically every hour with the highest-rated and most-watched ${displayTitle}. Whether you are browsing on mobile or desktop, our fast-loading player delivers smooth HD 1080p and 4K playback without forced registration walls.`,
    `Explore thousands of hand-indexed ${displayTitle} uploads sorted by popularity, weekly trending views, and latest releases. You can also swipe through vertical short clips in HubReels or discover related niches across our category directory. All content indexed on indiansexvideo.tv complies with RTA adult labeling and 18 U.S.C. § 2257 requirements.`,
  ];

  return { displayTitle, metaTitle, metaDescription, articleParagraphs };
}

export function buildPornstarSeoCopy(
  rawName: string,
  page: number = 1
): {
  displayName: string;
  metaTitle: string;
  metaDescription: string;
  articleParagraphs: string[];
} {
  const clean = rawName.trim() || 'Pornstar';
  const displayName = clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const pageSuffix = page > 1 ? ` (Page ${page})` : '';
  const metaTitle = `${displayName} Porn Videos${pageSuffix} — Free HD & 4K Scenes | HubTube IndianSexVideo`;
  const metaDescription = `Stream full HD and 4K ${displayName} porn videos${pageSuffix} free on HubTube (indiansexvideo.tv). Browse ${displayName}'s most-watched scenes, solo clips, and latest releases.`;

  const articleParagraphs = [
    `Watch the complete collection of ${displayName} HD and 4K scenes on HubTube (indiansexvideo.tv). Our index automatically aggregates ${displayName}'s highest-rated full-length releases, trending clips, and latest uploads in 1080p and 60fps.`,
    `Browse every page of ${displayName} videos without registration walls or slow popups, or jump into HubReels for instant vertical previews. All streams indexed on indiansexvideo.tv are RTA-labeled and 18 U.S.C. § 2257 compliant.`,
  ];

  return { displayName, metaTitle, metaDescription, articleParagraphs };
}