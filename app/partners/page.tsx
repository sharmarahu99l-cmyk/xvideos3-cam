import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Partners & Adult Link Directories | IndianSexVideo.tv',
  description:
    'Official partner network, curated adult directories, and webmaster link exchange hub for IndianSexVideo.tv.',
  alternates: {
    canonical: 'https://indiansexvideo.tv/partners',
  },
};

const FEATURED_PARTNERS = [
  {
    name: 'IndianSexVideo.tv — Trending Reels',
    url: 'https://indiansexvideo.tv/reels',
    description: 'Vertical mobile-first HD Desi & Indian short clips updated hourly.',
  },
  {
    name: 'IndianSexVideo.tv — All Categories',
    url: 'https://indiansexvideo.tv/categories',
    description: 'Browse curated Indian, Desi, 4K, and amateur video categories.',
  },
  {
    name: 'IndianSexVideo.tv — Top Models & Pornstars',
    url: 'https://indiansexvideo.tv/pornstars',
    description: 'Explore full HD video collections by verified performers and creators.',
  },
];

export default function PartnersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Partners &amp; Adult Directories
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        <strong>IndianSexVideo.tv</strong> partners with curated adult link lists, review hubs,
        and high-traffic niche tube sites. All listed partners receive direct{' '}
        <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-amber-400">dofollow</code>{' '}
        placement.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Featured Network &amp; Directories</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURED_PARTNERS.map((partner) => (
            <a
              key={partner.url}
              href={partner.url}
              target="_blank"
              rel="noopener"
              className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-amber-500/60 hover:bg-zinc-900"
            >
              <div className="font-semibold text-amber-400">{partner.name}</div>
              <p className="mt-1 text-xs text-zinc-400">{partner.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Request a Link / Partner Exchange</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Want your directory or adult site listed here? Place our link on your site first, then
          email your page URL and preferred anchor text to{' '}
          <a
            href="mailto:admin@indiansexvideo.tv"
            className="font-medium text-amber-400 underline"
          >
            admin@indiansexvideo.tv
          </a>
          . We review and publish reciprocal links within 24 hours.
        </p>

        <div className="mt-4 rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300">
          <div className="mb-1 font-semibold text-zinc-400">Our Link Details:</div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-amber-300">
            {`<a href="https://indiansexvideo.tv" target="_blank" rel="noopener">Indian Sex Videos - IndianSexVideo.tv</a>`}
          </pre>
        </div>
      </section>

      <div className="mt-8 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          ← Back to IndianSexVideo.tv Home
        </Link>
      </div>
    </main>
  );
}
