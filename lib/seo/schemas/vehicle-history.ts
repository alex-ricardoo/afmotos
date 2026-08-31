/**
 * AF Motos - Schema JSON-LD para a Landing Page de Histórico Veicular
 */

import { getBaseSiteUrl } from '../config.ts';

export interface VehicleHistoryJsonLdParams {
  siteName: string;
  price: number;
  currency?: string;
  description?: string;
  faqs: Array<{ question: string; answer: string }>;
}

export function buildVehicleHistoryServiceSchema({
  siteName,
  price,
  currency = 'BRL',
  description,
  faqs,
}: VehicleHistoryJsonLdParams): Record<string, unknown>[] {
  const baseUrl = getBaseSiteUrl();
  const pageUrl = `${baseUrl}/historico-veicular`;

  // 1. Service Schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Histórico Veicular para Motos',
    serviceType: 'Consulta e Relatório Veicular Digital',
    description:
      description ||
      'Relatório de histórico veicular completo para motocicletas por placa. Verificação de roubo e furto, leilão, sinistro, gravames, multas e débitos.',
    provider: {
      '@type': 'AutoDealer',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Pernambuco',
    },
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
  };

  // 2. BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Histórico Veicular',
        item: pageUrl,
      },
    ],
  };

  // 3. FAQPage Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return [serviceSchema, breadcrumbSchema, faqSchema];
}
