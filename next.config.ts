import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.192.87.98'],
  images: {
    // CREA DDF listing media is hosted on unbounded third-party hosts (agent
    // sites, realtyninja, onikon, youtube thumbnails, etc.) that can't be
    // enumerated in remotePatterns — a non-whitelisted host makes next/image
    // throw and crashes the result list. Disable optimization so any external
    // listing image renders. (A production setup should proxy DDF media
    // through an image CDN and re-enable optimization.)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
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
