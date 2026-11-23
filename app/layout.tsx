import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://xvideos3.cam'),
  title: 'Desi Videos, Desi Porn, Viral Desi MMS & Free HD Indian Videos | HubTube XVideos3',
  description:
    'Watch latest new Desi videos, Desi porn, viral Desi MMS, Indian bhabhi, aunty, Pakistani MMS, and Hindi audio HD videos streaming free on HubTube (XVideos3.cam).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
      <meta name="RATING" content="RTA-5042-1996-1400-1577-RTA" />
        <meta name="google-adsense-account" content="ca-pub-2014909859491780" />
      </head>
      <body className="bg-[#0a0a0a] text-[#ddd]">
        {children}

        {/* JuicyAds PopUnders v3 */}
        <Script
          id="juicyads-popunder-v3"
          src="https://js.juicyads.com/jp.php?c=4474z2y2s224u4r2p2e4438444&u=https%3A%2F%2Fwww.juicyads.rocks"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}