import type { Metadata } from 'next';
import Link from 'next/link';
import { toCategorySlug } from '../lib/seoData';

export const metadata: Metadata = {
  title: 'All Porn Categories & Desi Video Tags | HubTube - XVideos3',
  description:
    'Browse all HD porn categories, Desi videos, Bhabhi, Aunty, MMS, Amateur, 4K, and VR categories on HubTube (XVideos3.cam).',
  alternates: { canonical: '/categories' },
};

const CATEGORIES = [
  'Desi', 'Desi Bhabhi', 'Desi Aunty', 'MMS', 'Viral Desi MMS', 'Indian',
  'Hindi Audio Sex', 'Homemade', 'Amateur', '1080p', '4K', '60 FPS',
  'Asian', 'Japanese', 'Anal', 'Teen', 'VR Porn', 'Big Tits', 'Big Ass',
  'MILF', 'POV', 'Creampie', 'Hardcore', 'Threesome', 'Latina', 'Ebony',
  'Interracial', 'Lesbian', 'Blowjob', 'Cumshot', 'Masturbation', 'Blonde',
  'Brunette', 'Redhead', 'Petite', 'BBW', 'Massage', 'Public', 'Office',
  'Lingerie', 'Squirt', 'Fetish', 'BDSM', 'Solo', 'Top Rated',
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tighter">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/reels"
              className="bg-[#FF9900] text-black font-black text-xs px-3.5 py-2 rounded-full"
            >
              ▶ REELS
            </Link>
            <Link
              href="/"
              className="text-sm font-bold bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-black text-[#FF9900] mb-6">
          Browse All Categories
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const slug = toCategorySlug(cat);
            return (
              <Link
                key={cat}
                href={`/category/${slug}`}
                className="bg-[#141414] hover:bg-[#FF9900] text-gray-100 hover:text-black border border-gray-800 hover:border-[#FF9900] rounded-2xl p-4 font-bold text-center transition shadow"
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}