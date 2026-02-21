/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_DISPLAY_URL: process.env.NEXT_PUBLIC_DISPLAY_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
