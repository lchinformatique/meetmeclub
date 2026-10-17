// src/app/layout.tsx
// Root layout — metadata, fonts, PWA support, global providers

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Meet Me Club — Plus qu'une rencontre, un rendez-vous !",
    template: "%s | Meet Me Club",
  },
  description:
    "Rencontrez des célibataires vérifiés à Lomé : chat privé, appels vidéo et vrais rendez-vous dans les meilleurs lieux. Inscription gratuite, réservée aux 18 ans et plus.",
  applicationName: "Meet Me Club",
  keywords: ["rencontres Togo", "rencontres Lomé", "dating Afrique", "rendez-vous Lomé", "meet me club"],
  authors: [{ name: "Meet Me Club" }],
  creator: "Meet Me Club",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.meetmeclub.net"),
  openGraph: {
    type: "website",
    locale: "fr_TG",
    url: "https://www.meetmeclub.net",
    siteName: "Meet Me Club",
    title: "Meet Me Club 💞 Plus qu'une rencontre, un rendez-vous !",
    description:
      "Des célibataires vérifiés t'attendent à Lomé. Discute en privé, appelle en vidéo, rencontre-les pour de vrai. Inscription gratuite en 1 minute.",
    // Image d'aperçu : src/app/opengraph-image.jpg (logo + slogan + couple)
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Me Club 💞 Plus qu'une rencontre, un rendez-vous !",
    description: "Des célibataires vérifiés t'attendent à Lomé. Inscription gratuite en 1 minute.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png" },
    ],
    shortcut: "/icons/icon-192x192.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meet Me Club",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B2559" },
    { media: "(prefers-color-scheme: dark)", color: "#071530" },
  ],
};

import CustomerSupportWidget from "@/components/CustomerSupportWidget";
import MobileBottomNav from "@/components/MobileBottomNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import SecurityProtectionProvider from "@/components/SecurityProtectionProvider";
import RealtimeProvider from "@/components/realtime/RealtimeProvider";

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
        {/* iOS Apple Touch Icon & Standalone Web App Meta */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Meet Me Club" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Meet Me Club" />
      </head>
      <body>
        <SecurityProtectionProvider>
          <RealtimeProvider>
            {children}
            <CustomerSupportWidget />
            <MobileBottomNav />
            <PwaInstallPrompt />
          </RealtimeProvider>
        </SecurityProtectionProvider>
      </body>
    </html>
  );
}
