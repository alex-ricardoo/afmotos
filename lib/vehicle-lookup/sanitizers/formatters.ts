/**
 * Standardized neutral text helpers for absent data and negative occurrences.
 * Adheres strictly to non-accusatory, source-dependent legal framing.
 */

/**
 * Returns a standardized label for missing or unpopulated fields.
 * Never converts missing fields into "Nada Consta" or "Aprovado".
 */
export function formatNotInformed(fieldName?: string): string {
  if (fieldName && fieldName.length > 0) {
    return 'Não informado pela fonte';
  }
  return 'Não informado pela fonte';
}

/**
 * Standardized phrases indicating no records were found in the consulted source.
 */
export function formatNoOccurrence(
  category:
    | 'leilao'
    | 'sinistro'
    | 'recall'
    | 'roubo'
    | 'renajud'
    | 'gravame'
    | 'debito'
    | 'locadora'
    | 'venda'
    | 'geral' = 'geral',
): string {
  switch (category) {
    case 'leilao':
      return 'Nenhum registro identificado nas bases consultadas';
    case 'sinistro':
      return 'Nenhuma ocorrência identificada nas bases consultadas';
    case 'recall':
      return 'Nenhuma ocorrência informada nas bases consultadas';
    case 'roubo':
      return 'Nenhuma ocorrência ativa identificada nas bases consultadas';
    case 'renajud':
      return 'Nenhum apontamento identificado na base consultada';
    case 'gravame':
      return 'Nenhum gravame ativo identificado nas bases consultadas';
    case 'debito':
      return 'Sem débitos financeiros informados na base consultada';
    case 'locadora':
      return 'Não consta nas bases consultadas';
    case 'venda':
      return 'Não consta na base estadual consultada';
    default:
      return 'Nenhum apontamento identificado nas bases consultadas';
  }
}

/**
 * Normalizes engine power value. Returns "Não informada pela fonte" for null,
 * undefined, empty string, "0", or numeric 0.
 */
export function normalizePower(power: unknown): string {
  if (power == null) return 'Não informada pela fonte';
  const str = String(power).trim();
  if (
    str === '' ||
    str === '0' ||
    str === '0 CV' ||
    str === '0.0' ||
    str === '0,0' ||
    Number(str) === 0
  ) {
    return 'Não informada pela fonte';
  }
  // If already formatted with CV
  if (/cv$/i.test(str)) {
    return str;
  }
  return `${str} CV`;
}

/**
 * Normalizes engine displacement / cylinder capacity.
 */
export function normalizeDisplacement(displacement: unknown): string {
  if (displacement == null) return 'Não informada pela fonte';
  const str = String(displacement).trim();
  if (
    str === '' ||
    str === '0' ||
    str === '0 cc' ||
    str === '0.0' ||
    str === '0,0' ||
    Number(str) === 0
  ) {
    return 'Não informada pela fonte';
  }
  if (/cc$/i.test(str)) {
    return str;
  }
  return `${str} cc`;
}
