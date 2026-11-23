import type { Metadata } from 'next';
import AgeGate from './AgeGate';
import PopAdsScript from './PopAdsScript';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://xvideos3.cam'),
  title: 'Desi Videos, Desi Porn, Viral Desi MMS & Free HD Indian Videos | HubTube XVideos3',
  description:
    'Watch latest new Desi videos, Desi porn, viral Desi MMS, Indian bhabhi, aunty, Pakistani MMS, and Hindi audio HD videos streaming free on HubTube (XVideos3.cam).',
  other: {
    RATING: 'RTA-5042-1996-1400-1577-RTA',
    rating: 'adult',
    'google-adsense-account': 'ca-pub-2014909859491780',
  },
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
        <meta name="rating" content="adult" />
        <meta name="google-adsense-account" content="ca-pub-2014909859491780" />
      </head>
      <body className="bg-[#0a0a0a] text-[#ddd]">
        <AgeGate />
        <PopAdsScript />
        {children}
      </body>
    </html>
  );
}