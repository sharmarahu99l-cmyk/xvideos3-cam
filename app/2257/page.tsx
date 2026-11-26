import AdSenseUnit from '../AdSenseUnit';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '18 U.S.C. § 2257 Compliance Statement | HubTube - indiansexvideo.tv',
  description: '18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement for indiansexvideo.tv.',
  alternates: { canonical: '/2257' },
};

export default function Compliance2257Page() {
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
        <h1 className="text-3xl font-black text-[#FF9900]">
          18 U.S.C. § 2257 Record-Keeping Requirements Compliance Statement
        </h1>

        <p>
          indiansexvideo.tv (&ldquo;HubTube&rdquo;) is not a producer (whether primary or secondary) of any of the visual content found on this website. All visual depictions indexed on indiansexvideo.tv are embedded from third-party content providers and adult tube platforms.
        </p>

        <p>
          Pursuant to 18 U.S.C. § 2257 and 28 C.F.R. Part 75, the records required to be maintained for all visual depictions are kept by the respective third-party primary or secondary producers and hosting platforms from which the embeds originate.
        </p>
      <AdSenseUnit slot="1736997659" layout="in-article" format="fluid" />


        <p>
          For compliance inquiries or immediate link removal, contact <strong className="text-[#FF9900]">dmca@indiansexvideo.tv</strong>.
        </p>
      </main>
    </div>
  );
}