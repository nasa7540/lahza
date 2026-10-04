import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "../globals.css";

const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "600", "700"] });
const plexArabic = IBM_Plex_Sans_Arabic({ variable: "--font-plex-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"] });
const quran = localFont({ src: "../fonts/AmiriQuran-Regular.ttf", variable: "--font-quran-face", display: "swap" });

export const metadata: Metadata = { title: "لحظة — لوحة المراجعة", robots: { index: false, follow: false } };

/** The internal pages (review panel, company dashboard, evaluation) are in Arabic, outside the localized app. */
export default function ReviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${plexArabic.variable} ${quran.variable} antialiased`}>
      <body className="min-h-dvh bg-cream text-base">
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 py-6 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
