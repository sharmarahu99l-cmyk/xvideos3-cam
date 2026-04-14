import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XVIDEOS3 - Free XVIDEOS",
  description: "Watch free xvideos, desi bhabhi, indian porn, pakistani mms and more in HD. XVIDEOS3.com",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23111111'/%3E%3Ctext x='50' y='145' font-family='Arial Black' font-size='160' fill='%23e60012'%3EX%3C/text%3E%3C/svg%3E",
        sizes: "any",
      },
    ],
    apple: "/apple-icon.png",
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