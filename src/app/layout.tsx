import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { UIStateProvider } from "../context/ui-state-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bester FC Match Results & Rankings",
    template: "%s · Bester FC",
  },
  description:
    "Official Bester FC football dashboard showing match results, league rankings, and player performance statistics.",
  applicationName: "Bester FC",
  keywords: [
    "Bester FC",
    "bester fc match results",
    "bester fc rankings",
    "football results",
    "league table",
    "player statistics",
  ],
  authors: [{ name: "Bester Football Club" }],
  creator: "Bester Football Club",
  publisher: "Bester Football Club",
  category: "sports",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Bester FC Match Results & Rankings",
    description:
      "Match results, rankings, and player performance for Bester Football Club.",
    url: siteUrl,
    siteName: "Bester FC",
    images: [
      {
        url: "/og-match-results.png",
        width: 1200,
        height: 630,
        alt: "Bester FC match results and rankings",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bester FC Match Results & Rankings",
    description:
      "Live football match results and rankings for Bester FC.",
    images: ["/og-match-results.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1124",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#08110c] text-white antialiased`}
      >
        <UIStateProvider>{children}</UIStateProvider>
      </body>
    </html>
  );
}
