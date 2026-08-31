/**
 * AF Motos - Gerador de Metadados Padronizados para o Next.js App Router
 */

import type { Metadata } from 'next';
import { SEO_CONFIG, getCanonicalUrl, shouldBlockIndexing } from './config.ts';
import { ensureAbsoluteImageUrl } from './utils.ts';

export interface PageMetadataInput {
  title: string;
  description: string;
  path?: string;
  ogImage?: string | null;
  ogType?: 'website' | 'article' | 'profile';
  noIndex?: boolean;
  keywords?: string[];
}

/**
 * Constrói um objeto de Metadata compatível com o Next.js App Router.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = getCanonicalUrl(input.path || '');
  const absoluteOgImage = ensureAbsoluteImageUrl(input.ogImage);
  const isNoIndex = input.noIndex || shouldBlockIndexing();

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: SEO_CONFIG.defaultStoreName,
      locale: SEO_CONFIG.locale,
      type: input.ogType || 'website',
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [absoluteOgImage],
    },
  };

  if (isNoIndex) {
    metadata.robots = {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    };
  }

  if (input.keywords && input.keywords.length > 0) {
    metadata.keywords = input.keywords;
  }

  return metadata;
}
