/**
 * AF Motos - Schema FAQPage para Páginas com Perguntas e Respostas
 */

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Constrói o schema JSON-LD no padrão FAQPage (Schema.org).
 */
export function buildFaqSchema(items: FaqItem[]): Record<string, unknown> {
  const mainEntity = items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
