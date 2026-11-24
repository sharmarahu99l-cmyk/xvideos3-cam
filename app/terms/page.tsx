import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | HubTube - indiansexvideo.tv',
  description: 'Terms of Service and User Agreement for HubTube (indiansexvideo.tv).',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tighter">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>
          <Link href="/" className="text-sm font-bold bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full transition">
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6 text-sm leading-relaxed text-gray-300">
        <h1 className="text-3xl font-black text-[#FF9900]">Terms of Service</h1>
        <p className="text-xs text-gray-400">Last Updated: November 2026 • Domain: indiansexvideo.tv</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Adult Age Requirement (18+)</h2>
          <p>
            indiansexvideo.tv (&ldquo;HubTube&rdquo;) is an adult-oriented search and video indexing website. By accessing or using this website, you affirm under penalty of perjury that you are at least 18 years of age (or the age of legal majority in your jurisdiction) and that viewing sexually explicit material is legal in your community.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Third-Party Content &amp; Embedded Streams</h2>
          <p>
            HubTube acts solely as an automated search index and aggregator of publicly available third-party video embeds and API feeds. indiansexvideo.tv does not host, upload, store, or produce any video files on its servers. All videos remain hosted on their respective third-party platforms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Zero-Tolerance Policy on Illegal Content</h2>
          <p>
            We enforce a strict zero-tolerance policy against non-consensual content, CSAM, revenge porn, or any illegal material. Any link reported as non-consensual or unlawful is immediately blocked from our search index and reported to the upstream host.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Intellectual Property &amp; DMCA</h2>
          <p>
            All trademarks and copyrights belong to their respective owners. To request removal of an indexed link, please follow the instructions on our{' '}
            <Link href="/dmca" className="text-[#FF9900] underline">
              DMCA &amp; Content Removal
            </Link>{' '}
            page.
          </p>
        </section>
      </main>
    </div>
  );
}