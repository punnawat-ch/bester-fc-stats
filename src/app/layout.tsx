import type { Metadata } from "next";
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
    default: "Bester FC",
    template: "%s · Bester FC",
  },
  description:
    "Football competition dashboard featuring match results, rankings, and player performance for Bester Football Club.",
  applicationName: "Bester FC",
  keywords: [
    "Bester FC",
    "football stats",
    "league table",
    "match results",
    "player ranking",
    "club dashboard",
  ],
  authors: [{ name: "Bester Football Club" }],
  creator: "Bester Football Club",
  publisher: "Bester Football Club",
  category: "sports",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bester FC",
    description:
      "Football competition dashboard featuring match results, rankings, and player performance for Bester Football Club.",
    url: "/",
    siteName: "Bester FC",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Bester FC crest",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bester FC",
    description:
      "Football competition dashboard featuring match results, rankings, and player performance for Bester Football Club.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
