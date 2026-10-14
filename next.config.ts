// next.config.ts
// Meet Me Club — Next.js 16 configuration

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google avatars
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Demo profile photos
      },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75, 100],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },

  // Standard legal redirects for Google Console verification
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/legal/confidentialite",
        permanent: true,
      },
      {
        source: "/confidentialite",
        destination: "/legal/confidentialite",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/legal/cgu",
        permanent: true,
      },
      {
        source: "/cgu",
        destination: "/legal/cgu",
        permanent: true,
      },
    ];
  },

  // Experimental features for Next.js 16
  experimental: {
    // Cache components for better performance
  },
};

export default nextConfig;
