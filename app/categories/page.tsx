'use client';

import Link from 'next/link';

const categoriesList = [
  { name: "Japanese", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Anal", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "HD Porn 1080p", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Teen", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "VR Porn", count: "14,492", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Asian", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Big Tits", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Shemale", count: "10,875", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "MILF", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Gay", count: "10,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Ebony", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Homemade", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Indian", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Interracial", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Amateur", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Lesbian", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "60 FPS", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Big Ass", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "POV", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Mature", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Creampie", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Hentai", count: "9,826", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "BBW", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Hardcore", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Threesome", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Latina", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Big Dick", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Pornstar", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Double Penetration", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Vintage", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Group Sex", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Blowjob", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Cumshot", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Masturbation", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Students", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Blonde", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Petite", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Orgy", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Webcam", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Office", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "BDSM", count: "16,802", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Public", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Brunette", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Older Men", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Massage", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Lingerie", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Toys", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Hotel", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Fat", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Outdoor", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Squirt", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Fetish", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Redhead", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Housewives", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Sleep", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Small Tits", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Swinger", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Bukkake", count: "15,680", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Uniform", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Striptease", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Bondage", count: "17,146", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "For Women", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Nurses", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Handjob", count: "14,981", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Fisting", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "HQ Porn", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Bisexual", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "HD Sex", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Footjob", count: "14,981", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "ASMR", count: "20,000+", thumb: "https://picsum.photos/id/1015/600/600" },
  { name: "Doctor", count: "12,580", thumb: "https://picsum.photos/id/1015/600/600" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] p-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => window.history.back()} className="text-3xl text-[#FF9900]">←</button>
        <h1 className="text-2xl font-bold text-[#FF9900]">Categories</h1>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categoriesList.map((cat) => (
            <Link key={cat.name} href={`/?q=${encodeURIComponent(cat.name)}`} className="block group">
              <div className="relative rounded-3xl overflow-hidden aspect-square bg-[#1a1a1a]">
                <img src={cat.thumb} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/id/1015/600/600'; }} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-white text-center font-semibold text-lg">{cat.name}</p>
                  <p className="text-[#FF9900] text-center text-sm mt-1">{cat.count} Videos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}