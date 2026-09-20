import { MetadataRoute } from 'next';
import { getBaseSiteUrl } from '@/lib/seo';

/**
 * AF Veículos PE - Gerador dinâmico de robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseSiteUrl();

  const commonDisallows = [
    '/admin/',
    '/api/',
    '/cliente/',
    '/login',
    '/auth/',
    '/contratos/',
    '/recibos/',
    '/propostas/',
    '/laudos/',
    '/*?*sort=',
    '/*?*view=',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: commonDisallows,
      },
      // Motores de Busca com IA & GEO (Generative Engine Optimization)
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'],
        allow: [
          '/',
          '/historico-veicular',
          '/motos',
          '/motos-vendidas',
          '/vender-minha-moto',
          '/anunciar-sua-moto',
          '/sobre',
        ],
        disallow: commonDisallows,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
