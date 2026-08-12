import type { NextConfig } from "next";

const BACKEND = 'http://16.170.242.253:8000';

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      // beforeFiles rewrites prevent Next.js from stripping trailing slashes before proxying
      beforeFiles: [
        {
          source: '/backend/v1/auth/google/login',
          destination: `${BACKEND}/v1/auth/google/login`,
        },
        {
          source: '/backend/:path*',
          destination: `${BACKEND}/:path*/`,
        },
        {
          source: '/mohir-api/:path*',
          destination: `https://mohir.ai/api/:path*`,
        },
      ]
    };
  },
  // Rasm domenlarini ruxsatlash (poster_image uchun)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '16.170.242.253',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
