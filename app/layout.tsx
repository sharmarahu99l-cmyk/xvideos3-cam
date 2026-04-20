import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hubtube - Free Porn Videos",
  description: "Hubtube - Watch free HD porn videos. Hubtube is your best source for random porn videos.",
  icons: {
    icon: "/favicon.ico",           // ← Your uploaded sexy V-shaped girl ass favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}