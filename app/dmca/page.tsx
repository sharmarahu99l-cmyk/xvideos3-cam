import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DMCA & Content Removal Policy | HubTube - indiansexvideo.tv',
  description: 'DMCA Copyright Takedown and Non-Consensual Content Removal Policy for indiansexvideo.tv.',
  alternates: { canonical: '/dmca' },
};

export default function DmcaPage() {
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
        <h1 className="text-3xl font-black text-[#FF9900]">DMCA &amp; Content Removal Notice</h1>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Automated Third-Party Index</h2>
          <p>
            indiansexvideo.tv (HubTube) does not host any video files on its servers. All videos displayed on this site are embedded directly from third-party video hosts via public APIs. Removing a video from the upstream host automatically removes it from playback across the web.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. How to Submit a Takedown Request</h2>
          <p>
            If you are a copyright owner, performer, or authorized representative and wish to have a specific URL blocked from indiansexvideo.tv, please send a notice containing:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The exact URL(s) on `https://indiansexvideo.tv/watch/...` you want removed.</li>
            <li>Proof of copyright ownership or performer identification.</li>
            <li>Your contact email and a statement of good-faith belief.</li>
          </ul>
          <p className="pt-2">
            Send takedown notices to: <strong className="text-[#FF9900]">dmca@indiansexvideo.tv</strong>. Verified requests are processed within 24–48 hours.
          </p>
        </section>
      </main>
    </div>
  );
}