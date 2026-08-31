/**
 * AF Motos - Schema BreadcrumbList para Navegação Hierárquica
 */

import { getCanonicalUrl } from '../config.ts';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Constrói o schema JSON-LD no padrão BreadcrumbList (Schema.org).
 */
export function buildBreadcrumbsSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: getCanonicalUrl(item.path),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}
