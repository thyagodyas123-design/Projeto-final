/** @type {import('next').NextConfig} */
const CLASSROOM_HOST = process.env.CLASSROOM_HOST || 'localhost';
const CLASSROOM_PORT = process.env.CLASSROOM_PORT || '3004';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/curso/:id',
        destination: `http://${CLASSROOM_HOST}:${CLASSROOM_PORT}/curso/:id`,
      },
      {
        source: '/curso/:id/:path*',
        destination: `http://${CLASSROOM_HOST}:${CLASSROOM_PORT}/curso/:id/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/health',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ];
  },
};

export default nextConfig;
