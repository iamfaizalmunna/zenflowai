import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/qa', destination: '/qa/index.html' },
      { source: '/qa/v1', destination: '/qa/v1/index.html' },
      { source: '/qa/phases', destination: '/qa/phases/index.html' },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
