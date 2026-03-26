/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Ensure that the monorepo root is used for traces in Docker
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
};

module.exports = nextConfig;
