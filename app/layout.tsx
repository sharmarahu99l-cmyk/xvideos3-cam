import type { Metadata } from 'next';
import AgeGate from './AgeGate';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://xvideos3.cam'),
  title: 'Desi Videos, Viral Desi MMS, Hindi Audio Bhabhi & Free HD Porn | HubTube XVideos3',
  description:
    'Watch latest new Desi videos, viral Desi MMS, Hindi audio bhabhi, Indian aunty, Punjabi kudi, Pakistani MMS, and 4K HD videos streaming free on HubTube (XVideos3.cam).',
  other: {
    RATING: 'RTA-5042-1996-1400-1577-RTA',
    rating: 'adult',
    'google-adsense-account': 'ca-pub-2014909859491780',
  },
};

const POPADS_SCRIPT = `/*<![CDATA[/* */
(function(){var i=window,f="f885b844f797fe522b609d35822b7559",q=[["siteId",564+704-684+5327315],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmRpc3BsYXl2ZXJ0aXNpbmcuY29tL2NzaWR5LmNzcw==","ZDNtem9rdHk5NTFjNXcuY2xvdWRmcm9udC5uZXQvaC9zanNubG9nLm1pbi5qcw=="],h=-1,s,j,k=function(){clearTimeout(j);h++;if(o[h]&&!(1821391076000<(new Date).getTime()&&1<h)){s=i.document.createElement("script");s.type="text/javascript";s.async=!0;var u=i.document.getElementsByTagName("script")[0];s.src="https://"+atob(o[h]);s.crossOrigin="anonymous";s.onerror=k;s.onload=function(){clearTimeout(j);i[f.slice(0,16)+f.slice(0,16)]||k()};j=setTimeout(k,5E3);u.parentNode.insertBefore(s,u)}};if(!i[f]){try{Object.freeze(i[f]=q)}catch(e){}k()}})();
/*]]>/* */`;

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
        <script
          type="text/javascript"
          data-cfasync="false"
          dangerouslySetInnerHTML={{ __html: POPADS_SCRIPT }}
        />
      </head>
      <body className="bg-[#0a0a0a] text-[#ddd]">
        <AgeGate />
        {children}
      </body>
    </html>
  );
}