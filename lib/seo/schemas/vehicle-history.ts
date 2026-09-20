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
    name: 'Consulta de Histórico Veicular Completo por Placa',
    alternateName: [
      'Histórico Veicular',
      'Consulta Veicular por Placa',
      'Laudo Cautelar Veicular',
      'Consulta de Procedência Veicular',
    ],
    serviceType: 'Consulta e Relatório de Procedência Veicular Online',
    description:
      description ||
      'Relatório oficial de histórico veicular completo por placa para carros, motos e caminhões em todo o Brasil. Verificação de leilão, sinistro, roubo e furto, gravames, multas, débitos e restrições judiciais com emissão imediata em PDF.',
    provider: {
      '@type': 'AutoDealer',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil',
    },
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: pageUrl,
      seller: {
        '@type': 'AutoDealer',
        name: siteName,
      },
    },
  };

  // 2. WebApplication Schema (Otimizado para buscas do Google e extração por IAs)
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `Consulta de Histórico Veicular - ${siteName}`,
    url: pageUrl,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'Ferramenta online para consulta imediata de histórico veicular e antecedentes por placa veicular Mercosul ou padrão antigo.',
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
    },
  };

  // 3. BreadcrumbList Schema
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

  // 4. FAQPage Schema
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

  return [serviceSchema, webAppSchema, breadcrumbSchema, faqSchema];
}
