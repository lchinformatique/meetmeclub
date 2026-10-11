// src/app/layout.tsx
// Root layout — metadata, fonts, global providers

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Meet Me Club — Plus qu'une rencontre, un rendez-vous !",
    template: "%s | Meet Me Club",
  },
  description:
    "Meet Me Club est la plateforme de rencontres pour adultes au Togo. Rencontrez, échangez et partagez des moments inoubliables dans des lieux soigneusement sélectionnés à Lomé.",
  keywords: ["rencontres Togo", "rencontres Lomé", "dating Afrique", "rendez-vous Lomé", "meet me club"],
  authors: [{ name: "Meet Me Club" }],
  creator: "Meet Me Club",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://meetmeclub.tg"),
  openGraph: {
    type: "website",
    locale: "fr_TG",
    url: "https://meetmeclub.tg",
    siteName: "Meet Me Club",
    title: "Meet Me Club — Plus qu'une rencontre, un rendez-vous !",
    description:
      "La plateforme de rencontres sérieuses au Togo. Réservez votre rendez-vous dans les meilleurs lieux de Lomé.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Me Club",
    description: "Plus qu'une rencontre, un rendez-vous !",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E10600" },
    { media: "(prefers-color-scheme: dark)", color: "#0B2E6B" },
  ],
};

import CustomerSupportWidget from "@/components/CustomerSupportWidget";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <CustomerSupportWidget />
        <MobileBottomNav />
      </body>
    </html>
  );
}
