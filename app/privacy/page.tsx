import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | HubTube - indiansexvideo.tv',
  description: 'Privacy Policy and Cookie Disclosure for HubTube (indiansexvideo.tv).',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-black text-[#FF9900]">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Last Updated: November 2026 • Domain: indiansexvideo.tv</p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Data We Collect</h2>
          <p>
            You can browse indiansexvideo.tv without creating an account. Your age verification status, liked reels, and local viewing preferences are stored locally in your browser&apos;s storage (`localStorage`) and are never sold to third parties.
          </p>
</section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Optional Registered Accounts</h2>
          <p>
            If you choose to register or sign in using email or Google OAuth, your email address and private watch history are stored securely in our encrypted database so you can view or delete your history at any time from the Watch History page.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Third-Party Advertising &amp; Embeds</h2>
          <p>
            We partner with third-party advertising networks (including JuicyAds) and embedded video providers that may use cookies or anonymous identifiers to serve advertisements and measure impressions. You can clear cookies at any time in your browser settings.
          </p>
        </section>
      </main>
    </div>
  );
}