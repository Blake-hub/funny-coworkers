/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: ['http://10.0.24.110:3000'],
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/uploads/:path*',
        destination: `${backend.replace(/\/api$/, '')}/api/uploads/:path*`,
      },
      {
        source: '/api/wiki/images/:path*',
        destination: `${backend.replace(/\/api$/, '')}/api/wiki/images/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backend.replace(/\/api$/, '')}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8080' },
      { protocol: 'http', hostname: '10.0.24.110', port: '3000' },
    ],
  },
}

module.exports = nextConfig
