/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'floo.digital']
    }
  },
  images: {
    domains: ['localhost', 'floo.digital']
  }
}

module.exports = nextConfig
