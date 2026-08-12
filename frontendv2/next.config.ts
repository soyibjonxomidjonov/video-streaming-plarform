import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backend media/poster va CDN (Bunny.net) rasmlarini <Image> orqali yuklashga ruxsat.
  // Kerak bo'lganda domenlarni bu yerga qo'shing.
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "16.170.242.253" },
      { protocol: "https", hostname: "**.b-cdn.net" },
    ],
  },
};

export default nextConfig;
