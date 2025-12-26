/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // Environment-dependent CORS configuration
    const allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:3000', 'http://127.0.0.1:3000']

    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            key: 'Access-Control-Allow-Origin',
            value:
              process.env.NODE_ENV === 'development'
                ? '*'
                : allowedOrigins[0] || 'https://vibeyard.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
