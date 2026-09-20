/**
 * AF Motos - Configuração Central de SEO e Domínio Canônico
 */

import { CONSTANTS } from '../utils/constants.ts';

export const SEO_CONFIG = {
  defaultStoreName: CONSTANTS.STORE_NAME,
  defaultCity: 'Cabo de Santo Agostinho',
  defaultState: 'PE',
  defaultCep: '54350-655',
  defaultAddress:
    'Rua Milton Adolfo de Jesus, 68, Loja, São Francisco, Cabo de Santo Agostinho - PE, 54350-655',
  defaultTitleTemplate: `%s | ${CONSTANTS.STORE_NAME}`,
  defaultTitle: `${CONSTANTS.STORE_NAME} | Veículos, Motos e Histórico Veicular em Cabo de Santo Agostinho - PE`,
  defaultDescription: `Encontre veículos e motos na ${CONSTANTS.STORE_NAME}, em Cabo de Santo Agostinho - PE. Consulta de histórico veicular completo por placa, procedência garantida e atendimento direto no WhatsApp.`,
  defaultOgImage: '/logo.jpg',
  defaultFallbackSiteUrl: 'https://aflocacoesevendas.com.br',
  locale: 'pt_BR',
};

/**
 * Retorna a URL base canônica do site devidamente sanitizada (sem barra no final).
 */
export function getBaseSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Em ambiente local de desenvolvimento, usa localhost por padrão
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    const cleanVercel = vercelUrl.trim().replace(/\/+$/, '');
    return cleanVercel.startsWith('http') ? cleanVercel : `https://${cleanVercel}`;
  }

  return SEO_CONFIG.defaultFallbackSiteUrl.replace(/\/+$/, '');
}

/**
 * Gera uma URL canônica absoluta para qualquer caminho do site.
 */
export function getCanonicalUrl(path: string = ''): string {
  const baseUrl = getBaseSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Para a raiz, retorna a base sem barra final ou com / padrão
  if (cleanPath === '/' || cleanPath === '') {
    return baseUrl;
  }

  return `${baseUrl}${cleanPath}`;
}

/**
 * Determina se o ambiente atual deve ser protegido com noindex (ex: Vercel preview, branches de teste).
 */
export function shouldBlockIndexing(): boolean {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return true;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_ENV && process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
    return true;
  }
  return false;
}
