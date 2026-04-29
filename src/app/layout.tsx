import type { Metadata } from "next";
import { Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://earthspell.vercel.app"),
  title: "EarthSpell — Your name written in Earth",
  description: "Spell your name with 100% real NASA Landsat satellite images. Every letter is a real place on Earth.",
  openGraph: {
    title: "EarthSpell — Your name written in Earth",
    description: "Spell your name with 100% real NASA Landsat satellite images. Every letter is a real place on Earth.",
    images: [{ url: "/api/og?name=EARTH", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EarthSpell — Your name written in Earth",
    description: "Spell your name with 100% real NASA Landsat satellite images.",
    images: ["/api/og?name=EARTH"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
