export default function CategoriesPage() {
  const categories = [
    { name: "Desi", slug: "desi" },
    { name: "Bhabhi", slug: "bhabhi" },
    { name: "Aunty", slug: "aunty" },
    { name: "Pakistani", slug: "pakistani" },
    { name: "Indian", slug: "indian" },
    { name: "Hindi Audio", slug: "hindi" },
    { name: "Viral MMS", slug: "viral-mms" },
    { name: "Devar Bhabhi", slug: "devar-bhabhi" },
    { name: "College Girl", slug: "college" },
    { name: "4K HD", slug: "4k" },
    { name: "Saree Sex", slug: "saree" },
    { name: "Muslim Hijab", slug: "hijab" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111] sticky top-0 z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-3xl font-black text-red-600">XVIDEOS3</a>
          <a href="/" className="ml-auto text-sm text-gray-400 hover:text-white">← Back to Home</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-red-600 mb-4">All Categories</h1>
        <p className="text-gray-400 mb-12">Choose your favorite desi category</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="bg-[#1a1a1a] hover:bg-red-600 border border-gray-700 hover:border-red-600 p-8 rounded-2xl text-center transition-all hover:scale-105"
            >
              <div className="text-6xl mb-6">🔥</div>
              <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
              <p className="text-gray-400 text-sm">HD Videos</p>
            </a>
          ))}
        </div>
      </div>

      <footer className="bg-[#080808] py-12 text-center text-gray-500 text-sm border-t border-gray-800">
        © 2026 XVideos3.cam • Free HD Desi & Indian Porn • 18+ Only
      </footer>
    </div>
  );
}