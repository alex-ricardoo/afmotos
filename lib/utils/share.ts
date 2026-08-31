/**
 * AF Motos - Utilitários de Compartilhamento de Motocicletas e URLs Canônicas
 */

import { CONSTANTS } from './constants';
import { getBaseSiteUrl } from '@/lib/seo';

export interface ShareableMotorcycle {
  slug: string;
  brand: string;
  model: string;
  version?: string | null;
  year_model?: number | null;
  year_manufacture?: number | null;
  price?: number | null;
  image_url?: string | null;
  description?: string | null;
}

/**
 * Gera a URL canônica pública para visualização e compartilhamento da motocicleta.
 * Garante que nenhuma rota interna ou administrativa seja exposta.
 */
export function getPublicMotorcycleUrl(
  motorcycle: { slug?: string | null; id?: string | null },
  baseUrl?: string,
): string {
  const origin =
    baseUrl ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '') ||
    getBaseSiteUrl();

  const cleanOrigin = origin.replace(/\/+$/, '');
  const path = motorcycle.slug ? `/motos/${motorcycle.slug}` : `/motos`;

  return `${cleanOrigin}${path}`;
}

/**
 * Monta o texto de mensagem contextualizado e seguro para WhatsApp.
 * Não inclui chassi, placa, renavam ou dados internos.
 */
export function buildMotorcycleWhatsAppShareUrl(
  phone: string | undefined | null,
  motorcycle: ShareableMotorcycle,
  url?: string,
  siteName?: string,
): string {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const canonicalUrl = url || getPublicMotorcycleUrl(motorcycle);
  const priceText = motorcycle.price
    ? ` (R$ ${motorcycle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
    : '';

  const yearText = motorcycle.year_model ? ` — ${motorcycle.year_model}` : '';

  const message = `Olá! Encontrei esta moto no site da ${storeName} e gostaria de saber mais:\n\n${motorcycle.brand} ${motorcycle.model}${yearText}${priceText}\n\nLink: ${canonicalUrl}`;

  const cleanDigits = (phone || '5511999999999').replace(/\D/g, '');
  const finalPhone = cleanDigits.startsWith('55') ? cleanDigits : `55${cleanDigits}`;

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Monta URL oficial de compartilhamento do Facebook.
 */
export function buildFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/**
 * Monta texto recomendado para copiar e colar no Instagram.
 */
export function buildInstagramShareText(
  motorcycle: ShareableMotorcycle,
  siteName: string = CONSTANTS.STORE_NAME,
  url?: string,
): string {
  const canonicalUrl = url || getPublicMotorcycleUrl(motorcycle);
  const year = motorcycle.year_model ? `Ano ${motorcycle.year_model}` : '';
  const price = motorcycle.price
    ? `R$ ${motorcycle.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'Consulte valores';

  return `🏍️ ${motorcycle.brand} ${motorcycle.model} ${motorcycle.version || ''}\n${year ? `📅 ${year}\n` : ''}💰 ${price}\n\nConfira todos os detalhes e fale conosco no site da ${siteName}:\n🔗 ${canonicalUrl}`;
}

/**
 * Executa Web Share API nativa caso disponível no navegador.
 */
export async function executeWebShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return true;
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.warn('Erro na Web Share API:', err);
      }
      return false;
    }
  }
  return false;
}
