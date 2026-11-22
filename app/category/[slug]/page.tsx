import Link from 'next/link';
import VideoCard from '../../VideoCard';
import JuicyBanner from '../../JuicyBanner';
import { searchPornhubVideos } from '../../lib/pornhub';

export default async function CategorySlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageNum = Math.max(1, Number(sp.page) || 1);
  const label = decodeURIComponent(slug).replace(/-/g, ' ');

  const videos = await searchPornhubVideos(label, pageNum, 'most_viewed');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-[#FF9900] capitalize">
            {label} Videos — Page {pageNum}
          </h1>
          <Link
            href="/"
            className="text-sm bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full font-semibold transition"
          >
            ← Back Home
          </Link>
        </div>

        <JuicyBanner />

        {videos.length === 0 ? (
          <div className="text-center py-20 text-yellow-500 text-xl">
            No videos found for &ldquo;{label}&rdquo;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-6">
            {videos.map((v) => (
              <Link key={v.id} href={`/watch/${v.id}`} className="block">
                <VideoCard video={v} />
              </Link>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-4 mt-10">
          {pageNum > 1 && (
            <Link
              href={`/category/${encodeURIComponent(slug)}?page=${pageNum - 1}`}
              className="px-6 py-3 bg-[#222] hover:bg-[#FF9900] hover:text-black rounded-full font-bold transition"
            >
              ← Prev Page
            </Link>
          )}
          <Link
            href={`/category/${encodeURIComponent(slug)}?page=${pageNum + 1}`}
            className="px-6 py-3 bg-[#FF9900] text-black rounded-full font-bold hover:bg-[#ffaa33] transition"
          >
            Next Page →
          </Link>
        </div>
      </div>
    </div>
  );
}
