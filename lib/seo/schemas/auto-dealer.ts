/**
 * AF Motos - Schema AutoDealer / LocalBusiness para a Loja
 */

import { SEO_CONFIG, getBaseSiteUrl } from '../config.ts';
import { ensureAbsoluteImageUrl } from '../utils.ts';

export interface AutoDealerSchemaInput {
  siteName?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  detailedAddress?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
    country?: string;
  };
  cnpj?: string | null;
  logoUrl?: string | null;
  socialLinks?: Array<{ href: string }>;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Constrói o schema JSON-LD no padrão AutoDealer (Schema.org).
 */
export function buildAutoDealerSchema(input?: AutoDealerSchemaInput): Record<string, unknown> {
  const siteUrl = getBaseSiteUrl();
  const name = input?.siteName || SEO_CONFIG.defaultStoreName;
  const description = input?.description || SEO_CONFIG.defaultDescription;
  const logo = ensureAbsoluteImageUrl(input?.logoUrl, SEO_CONFIG.defaultOgImage);
  const telephone = input?.phone ? `+${input.phone.replace(/\D/g, '')}` : undefined;
  const email = input?.email && input.email.trim() ? input.email.trim() : undefined;

  const detailed = input?.detailedAddress;
  const streetAddress =
    detailed && (detailed.street || detailed.number)
      ? `${detailed.street || ''}${detailed.number ? `, ${detailed.number}` : ''}`
      : 'Rua Milton Adolfo de Jesus, 68, Loja';

  const addressNeighborhood = detailed?.neighborhood || 'São Francisco';
  const addressLocality = detailed?.city || SEO_CONFIG.defaultCity;
  const addressRegion = detailed?.state || SEO_CONFIG.defaultState;
  const postalCode = detailed?.cep || SEO_CONFIG.defaultCep;

  const sameAs = (input?.socialLinks || [])
    .map((s) => s.href)
    .filter((href) => href && href.startsWith('https://'));

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${siteUrl}/#autodealer`,
    name,
    legalName: name,
    url: siteUrl,
    logo,
    image: logo,
    description,
    ...(telephone ? { telephone } : {}),
    ...(email ? { email } : {}),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressNeighborhood,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry: 'BR',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '13:00',
      },
    ],
  };

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (input?.cnpj && input.cnpj.trim().length >= 14) {
    schema.taxID = input.cnpj.trim();
  }

  if (typeof input?.latitude === 'number' && typeof input?.longitude === 'number') {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  return schema;
}
