import { NextRequest, NextResponse } from 'next/server';

export interface SearchHint {
  label: string;
  type: 'category' | 'pornstar' | 'desi' | 'video';
}

const CATEGORIES = [
  "Japanese", "Anal", "HD Porn 1080p", "Teen", "VR Porn", "Asian", "Big Tits",
  "Shemale", "MILF", "Gay", "Ebony", "Homemade", "Indian", "Interracial",
  "Amateur", "Lesbian", "60 FPS", "Big Ass", "POV", "Mature", "Creampie",
  "Hentai", "BBW", "Hardcore", "Threesome", "Latina", "Big Dick", "Pornstar",
  "Double Penetration", "Vintage", "Group Sex", "Blowjob", "Cumshot",
  "Masturbation", "Students", "Blonde", "Petite", "Orgy", "Webcam", "Office",
  "BDSM", "Public", "Brunette", "Older Men", "Massage", "Lingerie", "Toys",
  "Hotel", "Fat", "Outdoor", "Squirt", "Fetish", "Redhead", "Housewives",
  "Sleep", "Small Tits", "Swinger", "Bukkake", "Uniform", "Striptease",
  "Bondage", "For Women", "Nurses", "Handjob", "Fisting", "HQ Porn",
  "Bisexual", "HD Sex", "Footjob", "ASMR", "Doctor",
];

const PORNSTARS = [
  "Angela White", "Riley Reid", "Violet Myers", "Dani Daniels", "Ava Addams",
  "Lana Rhoades", "Abella Danger", "Lauren Phillips", "Cory Chase", "Mia Khalifa",
  "Lena Paul", "Valentina Nappi", "Brandi Love", "Natasha Nice", "Adriana Chechik",
  "Savannah Bond", "Lisa Ann", "Manuel Ferrara", "Mia Malkova", "Alexis Fawx",
  "Sara Jay", "Yorgelis Carrillo", "Aidra Fox", "Blake Blossom", "Little Caprice",
  "Nicole Aniston", "Cherie DeVille", "Alexis Texas", "Melody Marks", "Kendra Lust",
  "Mandy Muse", "Lulu Chu", "Kenzie Reeves", "Jennifer White", "Abigaiil Morris",
  "Emily Willis", "Dee Williams", "Jane Wilde", "Alyx Star", "Maria Nagai",
  "Kelsi Monroe", "Alex Coal", "Lexi Luna", "Payton Preslee", "Syren De Mer",
  "Johnny Love", "Alexandra Cat", "Gabbie Carter", "Hazel Moore", "Skylar Vox",
  "Bridgette B", "Damion Dayski", "Jada Stevens", "Julia Ann", "Phoenix Marie",
  "Anissa Kate", "Johnny Sins", "Chanel Preston", "Alura Jenson", "Reagan Foxx",
  "Eliza Ibarra", "Ariella Ferrera", "Mick Blue",
];

const DESI_AND_TRENDING = [
  "Desi", "Desi Bhabhi", "Desi Aunty", "Desi MMS", "Desi Viral MMS", "Desi Sex",
  "Desi Chudai", "Desi Hardcore", "Desi Homemade", "Desi Couple", "Desi College Girl",
  "Desi Village Girl", "Desi Saree Sex", "Desi Salwar Suit", "Desi Hindi Audio",
  "Desi Punjabi", "Punjabi Kudi", "Pakistani MMS", "Pakistani Sex", "Pakistani Hijab",
  "Indian Bhabhi", "Indian Aunty", "Indian MMS", "Indian Wife", "Indian Couple",
  "Indian Homemade", "Indian Hardcore", "Indian College", "Indian Maid", "Indian Saree",
  "Bhabhi Devar", "Hindi Audio Sex", "Urdu Audio", "Punjabi Audio", "South Indian Desi",
  "Tamil Desi", "Telugu Desi", "Bengali Bhabhi", "Marathi Bhabhi", "Gujarati Aunty",
  "Mallu Aunty", "Bhojpuri Desi", "Desi Hotel", "Desi Car Sex", "Desi Outdoor",
  "Desi Shower", "Desi Massage", "Desi Blowjob", "Desi Anal", "Desi Doggy",
  "Desi Big Boobs", "Desi Big Ass", "Desi Stepmom", "Desi Suhag Raat", "Desi First Night",
  "Desi Leaked Scandal", "Desi Hidden Cam", "Desi OnlyFans", "Desi Web Series",
];

interface EpornerVideo {
  title?: string;
  keywords?: string;
}

async function fetchLiveSuggestions(q: string): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(
      `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(q)}&per_page=25&format=json`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36' },
      }
    );
    if (!res.ok) return [];
    const data: { videos?: EpornerVideo[] } = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos : [];
    const lowerQ = q.toLowerCase();
    const results: string[] = [];

    for (const v of videos) {
      if (v.keywords) {
        const tags = v.keywords.split(',').map((t) => t.trim()).filter(Boolean);
        for (const tag of tags) {
          if (tag.toLowerCase().includes(lowerQ) && tag.length <= 45) {
            results.push(tag);
          }
        }
      }
      if (v.title && v.title.toLowerCase().includes(lowerQ)) {
        results.push(v.title.trim());
      }
    }
    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const lowerQ = q.toLowerCase();

  // Do NOT return hints until the user actually types something
  if (!lowerQ) {
    return NextResponse.json({ hints: [] });
  }

  const seen = new Set<string>();
  const hints: SearchHint[] = [];

  const pushUnique = (label: string, type: SearchHint['type']) => {
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      hints.push({ label, type });
    }
  };

  const matchList = (list: string[], type: SearchHint['type']) => {
    list
      .filter((item) => item.toLowerCase().startsWith(lowerQ))
      .forEach((item) => pushUnique(item, type));
    list
      .filter((item) => !item.toLowerCase().startsWith(lowerQ) && item.toLowerCase().includes(lowerQ))
      .forEach((item) => pushUnique(item, type));
  };

  matchList(DESI_AND_TRENDING, 'desi');
  matchList(CATEGORIES, 'category');
  matchList(PORNSTARS, 'pornstar');

  const live = await fetchLiveSuggestions(q);
  live.forEach((item) => pushUnique(item, 'video'));

  return NextResponse.json(
    { hints },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    }
  );
}
