/**
 * AF Motos - Utilitários de Formatação e Sanitização de SEO
 */

import { SEO_CONFIG } from './config.ts';

export interface FormattableMotorcycle {
  brand: string;
  model: string;
  version?: string | null;
  year_model?: number | null;
  year_manufacture?: number | null;
  mileage?: number | null;
  color?: string | null;
  price?: number | null;
  description?: string | null;
  location?: string | null;
}

/**
 * Monta o título semântico para a página de uma motocicleta (para uso com title template do Next.js).
 */
export function formatMotorcycleTitle(moto: FormattableMotorcycle): string {
  const versionPart = moto.version ? ` ${moto.version}` : '';
  const yearPart = moto.year_model ? ` ${moto.year_model}` : '';
  const city = moto.location || `${SEO_CONFIG.defaultCity} - ${SEO_CONFIG.defaultState}`;

  return `${moto.brand} ${moto.model}${versionPart}${yearPart} usada à venda em ${city}`;
}

/**
 * Monta a meta description persuasiva e humanizada para uma motocicleta.
 */
export function formatMotorcycleDescription(
  moto: FormattableMotorcycle,
  siteName: string = SEO_CONFIG.defaultStoreName,
): string {
  if (moto.description && moto.description.trim().length > 30) {
    const cleanDesc = moto.description.trim().replace(/\s+/g, ' ');
    if (cleanDesc.length <= 155) return cleanDesc;
    return `${cleanDesc.substring(0, 152)}...`;
  }

  const year = moto.year_model || moto.year_manufacture;
  const yearPart = year ? ` ${year}` : '';
  const kmPart =
    typeof moto.mileage === 'number' ? `, ${moto.mileage.toLocaleString('pt-BR')} km` : '';
  const colorPart = moto.color ? `, cor ${moto.color}` : '';
  const pricePart =
    typeof moto.price === 'number' && moto.price > 0
      ? ` por R$ ${moto.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : '';
  const city = moto.location || `${SEO_CONFIG.defaultCity} - ${SEO_CONFIG.defaultState}`;

  return `${moto.brand} ${moto.model}${yearPart}${kmPart}${colorPart}${pricePart}. Disponível na ${siteName} em ${city}. Confira fotos, detalhes e fale no WhatsApp.`;
}

/**
 * Serializa de forma segura um objeto para JSON-LD prevenindo injeções de script (XSS).
 */
export function safeJsonLdReplacer(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Garante que uma URL de imagem seja absoluta com protocolo HTTPS.
 */
export function ensureAbsoluteImageUrl(url?: string | null, fallbackUrl?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    const fallback = fallbackUrl || SEO_CONFIG.defaultOgImage;
    if (fallback.startsWith('http://') || fallback.startsWith('https://')) {
      return fallback;
    }
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SEO_CONFIG.defaultFallbackSiteUrl;
    return `${baseUrl.replace(/\/+$/, '')}${fallback.startsWith('/') ? fallback : `/${fallback}`}`;
  }

  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SEO_CONFIG.defaultFallbackSiteUrl;
  return `${baseUrl.replace(/\/+$/, '')}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}
