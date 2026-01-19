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

export const metadata: Metadata = {
  title: "Bester FC Stats",
  description: "Football competition dashboard for Bester Football Club",
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
