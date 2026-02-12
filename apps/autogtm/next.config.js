/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@autogtm/core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
