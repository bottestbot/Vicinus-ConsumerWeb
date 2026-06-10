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
      {
        // CREA DDF / REALTOR.ca image CDN (actual host returned by the API)
        protocol: 'https',
        hostname: 'ddfcdn.realtor.ca',
        pathname: '/**',
      },
      {
        // REALTOR.ca media subdomains
        protocol: 'https',
        hostname: '*.realtor.ca',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
