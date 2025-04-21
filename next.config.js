/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['vtfgg.netlify.app'],
  },
  experimental: {
    serverActions: true,
  },
}

export default nextConfig 