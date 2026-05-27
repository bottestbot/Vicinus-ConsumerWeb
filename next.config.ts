import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        // Production CDN for property images from CREA DDF
        protocol: 'https',
        hostname: '*.ddf.ca',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
