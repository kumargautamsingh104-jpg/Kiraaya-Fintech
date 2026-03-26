/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kiraaya-docs.s3.ap-south-1.amazonaws.com',
      },
    ],
  },
};

module.exports = nextConfig;
