import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/termos-de-uso',
        destination: '/politica-de-privacidade',
        permanent: true,
      },
      {
        source: '/termos',
        destination: '/politica-de-privacidade',
        permanent: true,
      },
      {
        source: '/consignar-moto',
        destination: '/anunciar-sua-moto',
        permanent: false,
      },
      {
        source: '/venda-sua-moto',
        destination: '/anunciar-sua-moto',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
