import React from 'react';
import { safeJsonLdReplacer } from './utils.ts';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

/**
 * Componente para renderização segura de scripts de dados estruturados JSON-LD.
 * Aplica sanitização contra ataques de injeção e caracteres não escapados.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLdReplacer(data),
      }}
    />
  );
}
