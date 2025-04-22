/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['vtfgg.netlify.app'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'vtfgg.netlify.app'],
    },
  },
}

export default nextConfig 