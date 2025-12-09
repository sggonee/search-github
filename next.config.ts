import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/',
        destination: '/github/search-users',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
