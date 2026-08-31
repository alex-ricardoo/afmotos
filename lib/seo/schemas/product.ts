/**
 * AF Motos - Schema Product & Offer para Motocicletas
 */

import { getCanonicalUrl, getBaseSiteUrl, SEO_CONFIG } from '../config.ts';
import { ensureAbsoluteImageUrl, formatMotorcycleDescription } from '../utils.ts';

export interface ProductSchemaInput {
  slug: string;
  brand: string;
  model: string;
  version?: string | null;
  year_model?: number | null;
  year_manufacture?: number | null;
  mileage?: number | null;
  color?: string | null;
  price?: number | null;
  description?: string | null;
  images?: Array<{ url: string }> | null;
  image_url?: string | null;
  status?: string;
  siteName?: string;
}

/**
 * Constrói o schema JSON-LD no padrão Product + Offer (Schema.org).
 */
export function buildMotorcycleProductSchema(
  moto: ProductSchemaInput,
  siteName: string = SEO_CONFIG.defaultStoreName,
): Record<string, unknown> {
  const canonicalUrl = getCanonicalUrl(`/motos/${moto.slug}`);
  const siteUrl = getBaseSiteUrl();

  const title = `${moto.brand} ${moto.model}${moto.version ? ` ${moto.version}` : ''}${moto.year_model ? ` ${moto.year_model}` : ''}`;
  const description = formatMotorcycleDescription(moto, siteName);

  const imagesList =
    moto.images && moto.images.length > 0
      ? moto.images.map((img) => ensureAbsoluteImageUrl(img.url)).filter(Boolean)
      : moto.image_url
        ? [ensureAbsoluteImageUrl(moto.image_url)]
        : [ensureAbsoluteImageUrl(SEO_CONFIG.defaultOgImage)];

  const isSold = moto.status === 'SOLD';
  const availability = isSold ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: title,
    description,
    image: imagesList,
    category: 'Motorcycle',
    brand: {
      '@type': 'Brand',
      name: moto.brand,
    },
    model: moto.model,
    productionDate: moto.year_manufacture ? String(moto.year_manufacture) : undefined,
  };

  if (typeof moto.price === 'number' && moto.price > 0) {
    schema.offers = {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'BRL',
      price: moto.price.toFixed(2),
      itemCondition: 'https://schema.org/UsedCondition',
      availability,
      seller: {
        '@type': 'AutoDealer',
        name: siteName,
        url: siteUrl,
      },
    };
  }

  return schema;
}
