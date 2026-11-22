import type { Metadata } from "next";
import "./globals.css";
import GlobalUI from "./GlobalUI";

export const metadata: Metadata = {
  metadataBase: new URL("https://xvideos3.cam"),
  title: {
    default: "HubTube (XVideos3) - Free Desi, Indian & HD Porn Videos",
    template: "%s | HubTube - XVideos3 HD",
  },
  description:
    "Watch free HD Desi porn, Indian bhabhi, aunty, Pakistani MMS, viral desi videos, Hindi audio, and 4K 60fps adult videos streaming fast on HubTube (XVideos3.cam).",
  keywords: [
    "desi videos", "desi porn", "indian porn", "desi sex", "desi bhabhi",
    "indian bhabhi", "desi aunty", "indian aunty", "desi mms", "viral desi mms",
    "pakistani mms", "pakistani sex", "desi chudai", "bhabhi ki chudai",
    "aunty ki chudai", "hindi audio sex", "punjabi kudi", "punjabi desi",
    "desi homemade", "desi couple", "desi college girl", "desi village girl",
    "desi saree sex", "desi salwar suit", "devar bhabhi", "south indian desi",
    "tamil desi", "telugu desi", "bengali bhabhi", "marathi bhabhi",
    "gujarati aunty", "mallu aunty", "bhojpuri desi", "desi hardcore",
    "desi leaked scandal", "desi hidden cam", "desi suhag raat", "desi big boobs",
    "desi big ass", "indian homemade", "indian wife", "indian viral video",
    "xvideos3", "xvideos3.cam", "hubtube", "free hd porn", "4k porn", "1080p porn",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "HubTube - XVideos3",
    url: "https://xvideos3.cam",
    title: "HubTube (XVideos3) - Free Desi, Indian & HD Porn Videos",
    description:
      "Stream unlimited free Desi videos, Indian bhabhi, viral MMS, and 4K HD adult videos on HubTube (XVideos3.cam).",
  },
  twitter: {
    card: "summary_large_image",
    title: "HubTube (XVideos3) - Free Desi & HD Porn Videos",
    description:
      "Watch free Desi, Indian, Pakistani MMS, and 4K HD videos on XVideos3.cam.",
  },
  other: {
    rating: "adult",
    "RTA-5042-1996-1400-1577-RTA": "RTA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-[#ddd]">
        {children}
        <GlobalUI />
      </body>
    </html>
  );
}
