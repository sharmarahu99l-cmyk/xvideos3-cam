'use client';

import Link from 'next/link';

const pornstarsList = [
  { name: "Angela White", count: "695 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Riley Reid", count: "962 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Violet Myers", count: "779 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Dani Daniels", count: "378 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Ava Addams", count: "241 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Lana Rhoades", count: "744 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Abella Danger", count: "866 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Lauren Phillips", count: "1555 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Cory Chase", count: "1414 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Mia Khalifa", count: "1214 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Lena Paul", count: "434 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Valentina Nappi", count: "199 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Brandi Love", count: "492 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Natasha Nice", count: "24 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Adriana Chechik", count: "1305 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Savannah Bond", count: "541 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Lisa Ann", count: "563 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Manuel Ferrara", count: "518 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Mia Malkova", count: "253 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Alexis Fawx", count: "594 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Sara Jay", count: "475 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Yorgelis Carrillo", count: "2047 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Aidra Fox", count: "3278 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Blake Blossom", count: "750 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Little Caprice", count: "172 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Nicole Aniston", count: "359 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Cherie DeVille", count: "615 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Alexis Texas", count: "388 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Melody Marks", count: "354 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Kendra Lust", count: "22 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Mandy Muse", count: "173 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Lulu Chu", count: "344 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Kenzie Reeves", count: "381 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Jennifer White", count: "412 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Abigaiil Morris", count: "327 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Emily Willis", count: "562 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Dee Williams", count: "604 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Jane Wilde", count: "351 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Alyx Star", count: "256 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Maria Nagai", count: "95 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Kelsi Monroe", count: "289 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Alex Coal", count: "61 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Lexi Luna", count: "27 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Payton Preslee", count: "431 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Syren De Mer", count: "364 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Johnny Love", count: "104 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Alexandra Cat", count: "1147 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Gabbie Carter", count: "362 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Hazel Moore", count: "240 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Skylar Vox", count: "763 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Bridgette B", count: "339 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Damion Dayski", count: "482 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Jada Stevens", count: "747 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Julia Ann", count: "337 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Phoenix Marie", count: "14 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" },
  { name: "Anissa Kate", count: "782 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16717123/13_240.jpg" },
  { name: "Johnny Sins", count: "398 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16757404/10_240.jpg" },
  { name: "Chanel Preston", count: "544 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16707389/14_240.jpg" },
  { name: "Alura Jenson", count: "240 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16708775/9_240.jpg" },
  { name: "Reagan Foxx", count: "609 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16738807/3_240.jpg" },
  { name: "Eliza Ibarra", count: "313 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720610/14_240.jpg" },
  { name: "Ariella Ferrera", count: "263 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16720381/15_240.jpg" },
  { name: "Mick Blue", count: "598 Videos", thumb: "https://static-ca-cdn.eporner.com/thumbs/static4/1/16/167/16759810/11_240.jpg" }
];

export default function PornstarsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-4xl font-bold text-[#FF9900] mb-8 text-center">PORNSTARS</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {pornstarsList.map((star) => (
          <Link key={star.name} href={`/?q=${encodeURIComponent(star.name)}`} className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-[#1a1a1a]">
              <img 
                src={star.thumb} 
                alt={star.name} 
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                <p className="font-bold text-lg">{star.name}</p>
                <p className="text-[#FF9900] text-sm">{star.count}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}