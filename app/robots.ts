import { MetadataRoute } from 'next';
import { getBaseSiteUrl } from '@/lib/seo';

/**
 * AF Motos - Gerador dinâmico de robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/login',
          '/auth/',
          '/consulta-placa/',
          '/contratos/',
          '/recibos/',
          '/propostas/',
          '/laudos/',
          '/*?*sort=',
          '/*?*view=',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
