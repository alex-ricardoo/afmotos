import { maskCpf } from './mask-cpf.ts';
import { maskCnpj } from './mask-cnpj.ts';

const PLACEHOLDER_DOC_REGEX = /^(0{11}|0{14}|1{11}|1{14}|2{11}|2{14}|9{11}|9{14})$/;

/**
 * Checks whether a document string is a known dummy/placeholder.
 */
export function isPlaceholderDoc(doc: string | null | undefined): boolean {
  if (!doc) return true;
  const clean = doc.replace(/\D/g, '');
  if (!clean || clean.length < 5) return true;
  if (PLACEHOLDER_DOC_REGEX.test(clean)) return true;
  if (/^(\d)\1+$/.test(clean) && (clean.length === 11 || clean.length === 14)) return true;
  return false;
}

/**
 * Masks a personal (CPF) or corporate (CNPJ) document according to LGPD guidelines.
 * Never displays placeholders as valid masked documents.
 */
export function maskDocument(
  doc: string | null | undefined,
  type?: 'PF' | 'PJ' | 'unknown',
): string {
  if (!doc || isPlaceholderDoc(doc)) {
    return 'Não disponibilizado';
  }

  const clean = doc.replace(/\D/g, '');

  if (type === 'PJ' || clean.length === 14) {
    return maskCnpj(clean);
  }

  if (type === 'PF' || clean.length === 11) {
    return maskCpf(clean);
  }

  if (clean.length >= 6) {
    return `${clean.slice(0, 3)}***${clean.slice(-3)}`;
  }

  return 'Não disponibilizado';
}
