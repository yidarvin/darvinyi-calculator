import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import OverlayHost from "@/components/overlays/OverlayHost";
import DebtTicker from "@/components/chrome/DebtTicker";
import { SurgeTimer } from "@/components/chrome/SurgeTimer";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calculator 2026",
  description: "The last calculator you'll ever need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink font-sans">
        {children}
        <OverlayHost />
        <DebtTicker />
        <SurgeTimer />
      </body>
    </html>
  );
}
