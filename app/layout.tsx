import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Sora } from "next/font/google";
import MotionRoot from "@/components/MotionRoot";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOVA — Your research. Connected. Understood.",
  description:
    "NOVA is an AI-powered research workspace that turns scattered papers, PDFs and notes into extraordinary, connected knowledge.",
};

export const viewport: Viewport = {
  themeColor: "#05060F",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${instrument.variable}`}>
      <body className="relative min-h-screen bg-base">
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-noise" />
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}
