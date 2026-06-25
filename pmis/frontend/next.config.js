/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    allowedDevOrigins: ['http://10.0.24.110:3000'],
  },
}

module.exports = nextConfig
