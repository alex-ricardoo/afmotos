import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
