import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@wa-broadcast/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
}

export default nextConfig
