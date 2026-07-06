import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { UIStateProvider } from "../context/ui-state-context";
import { getClub } from "../lib/football";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Bester FC Match Results & Rankings";
const DEFAULT_DESCRIPTION =
  "Official Bester FC football dashboard showing match results, league rankings, and player performance statistics.";
const DEFAULT_KEYWORDS = [
  "Bester FC",
  "bester fc match results",
  "bester fc rankings",
  "football results",
  "league table",
  "player statistics",
];
const DEFAULT_OG_IMAGE = "/og-match-results.png";

export async function generateMetadata(): Promise<Metadata> {
  const club = await getClub();
  const siteUrl =
    club.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = club.seoTitle ?? DEFAULT_TITLE;
  const description = club.seoDescription ?? DEFAULT_DESCRIPTION;
  const keywords =
    club.seoKeywords.length > 0 ? club.seoKeywords : DEFAULT_KEYWORDS;
  const ogImage = club.ogImageUrl ?? DEFAULT_OG_IMAGE;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${club.shortName}`,
    },
    description,
    applicationName: club.shortName,
    keywords,
    authors: [{ name: club.name }],
    creator: club.name,
    publisher: club.name,
    category: "sports",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: club.shortName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${club.shortName} match results and rankings`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
