import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getBaseSiteUrl } from '@/lib/seo';
import { getPublicSiteSettings } from '@/lib/settings/server-queries';

/**
 * Revalidação incremental do sitemap a cada 1 hora (ISR).
 * Mantém o sitemap fresco com novas motos cadastradas sem sobrecarregar o banco.
 */
export const revalidate = 3600;

/**
 * Gerador Oficial de Sitemap XML para Google Search Console e Motores de Busca.
 *
 * Diretrizes do Google Search Central atendidas:
 * 1. Apenas URLs canônicas com status HTTP 200 OK (sem redirecionamentos 3xx ou páginas noindex).
 * 2. URLs absolutas sanitizadas com HTTPS.
 * 3. Datas `lastModified` precisas para otimização de crawl budget.
 * 4. Motos vendidas (noindex) excluídas do sitemap para concentrar autoridade no estoque ativo.
 * 5. Tratamento de fallback resiliente para garantir 100% de disponibilidade do endpoint /sitemap.xml.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseSiteUrl();
  const currentDate = new Date();

  // 1. URLs Institucionais e Comerciais Canônicas (Status 200 OK)
  const baseStaticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/motos`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vender-minha-moto`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/anunciar-sua-moto`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/motos-vendidas`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/politica-de-privacidade`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    const [supabase, siteSettings] = await Promise.all([
      createClient(),
      getPublicSiteSettings().catch(() => null),
    ]);

    const staticRoutes = [...baseStaticRoutes];

    // Inclui a página /sobre apenas se estiver habilitada e publicada
    if (!siteSettings?.about || siteSettings.about.isPublished !== false) {
      staticRoutes.push({
        url: `${baseUrl}/sobre`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Inclui a página /historico-veicular apenas se o serviço estiver ativo
    if (!siteSettings?.vehicleHistory || siteSettings.vehicleHistory.isEnabled !== false) {
      staticRoutes.push({
        url: `${baseUrl}/historico-veicular`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // 2. Consulta de Inventário Ativo (Apenas motos com status AVAILABLE)
    const { data: activeMotorcycles, error } = await supabase
      .from('motorcycles')
      .select('slug, updated_at, created_at, status')
      .eq('status', 'AVAILABLE')
      .order('updated_at', { ascending: false });

    if (error || !activeMotorcycles) {
      console.warn(
        '[SEO Sitemap] Aviso ao consultar inventário de motos:',
        error?.message || error,
      );
      return staticRoutes;
    }

    // 3. Montagem das URLs de Inventário
    const motorcycleRoutes: MetadataRoute.Sitemap = activeMotorcycles
      .filter((moto) => moto.slug && moto.slug.trim().length > 0)
      .map((moto) => {
        const lastMod = moto.updated_at
          ? new Date(moto.updated_at)
          : moto.created_at
            ? new Date(moto.created_at)
            : currentDate;

        return {
          url: `${baseUrl}/motos/${moto.slug.trim()}`,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.8,
        };
      });

    return [...staticRoutes, ...motorcycleRoutes];
  } catch (err) {
    console.error('[SEO Sitemap] Erro inesperado ao gerar sitemap:', err);
    return baseStaticRoutes;
  }
}
