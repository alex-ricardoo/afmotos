import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Normaliza um texto para formato de slug amigável para SEO:
 * - Remove acentos e diacríticos
 * - Converte para minúsculas
 * - Substitui espaços e caracteres especiais por hífens
 * - Remove hífens duplicados e pontas soltas
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // substitui caracteres não alfanuméricos por -
    .replace(/-+/g, '-') // remove hífens consecutivos
    .replace(/^-+|-+$/g, ''); // remove hífens no início e fim
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface MotorcycleSlugParams {
  brand: string;
  model: string;
  version?: string | null;
  year_model: number | string;
}

/**
 * Gera o slug base para uma motocicleta combinando marca, modelo, versão (opcional) e ano do modelo.
 * Exemplo:
 * - "Honda", "Pop 110i", null, 2025 -> "honda-pop-110i-2025"
 * - "Honda", "CG 160", "Titan ESD", 2024 -> "honda-cg-160-titan-esd-2024"
 */
export function generateBaseMotorcycleSlug({
  brand,
  model,
  version,
  year_model,
}: MotorcycleSlugParams): string {
  const parts = [brand, model, version, String(year_model)].filter(
    (part): part is string => Boolean(part && String(part).trim()),
  );

  return slugify(parts.join(' '));
}

/**
 * A partir de um slug base e uma lista de slugs existentes no banco,
 * determina o próximo slug disponível no padrão:
 * - slug-base
 * - slug-base-2
 * - slug-base-3
 * - slug-base-4
 */
export function findNextAvailableSlug(baseSlug: string, existingSlugs: string[]): string {
  const slugSet = new Set(existingSlugs.map((s) => s.trim().toLowerCase()));

  // 1. Se o slug base estiver livre, usa ele normalmente
  if (!slugSet.has(baseSlug)) {
    return baseSlug;
  }

  // 2. Coleta todos os sufixos *estritamente numéricos* usados para o padrão baseSlug-N.
  //    Slugs com sufixos não numéricos (ex: "honda-pop-110i-2025-special") são ignorados.
  const numericSuffixPattern = new RegExp(`^${escapeRegex(baseSlug)}-(\\d+)$`);
  const usedNumbers = new Set<number>();

  for (const slug of slugSet) {
    const match = slug.match(numericSuffixPattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= 2) {
        usedNumbers.add(num);
      }
    }
  }

  // 3. Localiza o próximo número sequencial disponível começando em 2
  let candidateNumber = 2;
  while (usedNumbers.has(candidateNumber) || slugSet.has(`${baseSlug}-${candidateNumber}`)) {
    candidateNumber++;
  }

  return `${baseSlug}-${candidateNumber}`;
}

/**
 * Consulta o banco de dados e gera um slug garantidamente único para uma motocicleta.
 *
 * Estratégia da query:
 * - Busca slugs exatamente iguais ao base (ex: "honda-pop-110i-2025")
 * - Busca slugs com sufixos numéricos (ex: "honda-pop-110i-2025-2", "honda-pop-110i-2025-10")
 * - Usa ilike com padrão "base-%" para cobrir todos de uma vez (PostgREST suporta % no ilike)
 * - A filtragem precisa de sufixos numéricos ocorre em memória via findNextAvailableSlug
 */
export async function generateUniqueMotorcycleSlug(
  supabase: SupabaseClient<Database>,
  params: MotorcycleSlugParams,
  excludeId?: string,
): Promise<string> {
  const baseSlug = generateBaseMotorcycleSlug(params);

  if (!baseSlug) {
    return `moto-${Date.now()}`;
  }

  try {
    // Busca slugs que comecem com "baseSlug" (captura o slug exato e todos os sufixos sequenciais).
    // Usando .ilike() diretamente para garantir tipagem correta do Supabase TS client.
    // Falsos positivos (ex: "honda-pop-110i-2025-especial") são descartados em memória
    // pelo findNextAvailableSlug, que aceita apenas sufixos numéricos via regex.
    let query = supabase
      .from('motorcycles')
      .select('slug')
      .ilike('slug', `${baseSlug}%`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Aviso ao consultar slugs existentes para motocicleta:', error.message);
      return baseSlug;
    }

    const existingSlugs = (data || [])
      .map((row) => row.slug)
      .filter((s): s is string => typeof s === 'string' && s.length > 0);

    return findNextAvailableSlug(baseSlug, existingSlugs);
  } catch (err) {
    console.error('Erro ao gerar slug único para motocicleta:', err);
    return baseSlug;
  }
}

/**
 * Verifica se um erro retornado pelo Supabase/PostgreSQL é violação de constraint de slug único (23505).
 */
export function isSlugConflictError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as { code?: string; message?: string; details?: string };
  const code = err.code || '';
  const message = err.message || '';
  const details = err.details || '';

  const hasCode23505 = code === '23505' || message.includes('23505');
  const isSlugRelated =
    message.includes('motorcycles_slug_key') ||
    message.includes('slug') ||
    details.includes('motorcycles_slug_key') ||
    details.includes('slug');

  return hasCode23505 && isSlugRelated;
}
