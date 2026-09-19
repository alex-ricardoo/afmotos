// ─────────────────────────────────────────────────────────────────────────────
// Owner Normalizer
//
// Normalizes owner history data with strict LGPD protection.
// Detects placeholder documents and never converts them to visually valid
// CPF/CNPJ in the report.
// ─────────────────────────────────────────────────────────────────────────────

import type { OwnerNormalized } from './types.ts';
import { isPlaceholderDocument } from './availability-helpers.ts';
import { maskCpf } from '../sanitizers/mask-cpf.ts';
import { maskCnpj } from '../sanitizers/mask-cnpj.ts';

interface RawOwnerRecord {
  uf?: string;
  placa?: string;
  chassi?: string;
  cpfCnpj?: string;
  renavam?: string;
  municipio?: string;
  ocorrencia?: string;
  anoExercicio?: string;
  proprietario?: string;
  tipoDocumento?: string;
  dataEmplacamento?: string;
  dataProcessamento?: string;
  motivoTipoAutorizacao?: string;
  correlacaoChassiRenavam?: boolean;
}

/**
 * Determines the document type from raw data.
 * Never assumes "Pessoa Física" when type is null.
 */
function resolveDocumentType(
  tipoDocumento: unknown,
  cpfCnpj: string | undefined | null,
): 'PF' | 'PJ' | 'unknown' {
  if (typeof tipoDocumento === 'string') {
    const upper = tipoDocumento.toUpperCase().trim();
    if (upper.includes('JURIDIC') || upper.includes('PJ') || upper === 'CNPJ') return 'PJ';
    if (upper.includes('FISIC') || upper.includes('PF') || upper === 'CPF') return 'PF';
  }

  // Infer from document length only when document is valid
  if (cpfCnpj && !isPlaceholderDocument(cpfCnpj)) {
    const clean = cpfCnpj.replace(/\D/g, '');
    if (clean.length === 14) return 'PJ';
    if (clean.length === 11) return 'PF';
  }

  return 'unknown';
}

/**
 * Masks a document according to type, with placeholder detection.
 */
function maskDocument(
  cpfCnpj: string | undefined | null,
  docType: 'PF' | 'PJ' | 'unknown',
): string {
  if (!cpfCnpj || isPlaceholderDocument(cpfCnpj)) {
    return 'Não disponibilizado';
  }

  const clean = cpfCnpj.replace(/\D/g, '');
  if (clean.length === 11 && docType !== 'PJ') {
    return maskCpf(clean);
  }
  if (clean.length === 14) {
    return maskCnpj(clean);
  }
  // Unknown length: generic masking
  if (clean.length >= 6) {
    return `${clean.slice(0, 3)}***${clean.slice(-3)}`;
  }
  return 'Não disponibilizado';
}

/**
 * Normalizes the owner history from raw API Brasil data.
 *
 * Rules:
 * 1. Detect placeholder documents (00000000000, etc.) — never display as valid docs
 * 2. Never assume "Pessoa Física" when tipoDocumento is null
 * 3. Mark records with insufficient data
 * 4. Always mask real documents according to LGPD
 */
export function normalizeOwners(rawOwners: unknown): OwnerNormalized[] {
  if (!rawOwners || !Array.isArray(rawOwners) || rawOwners.length === 0) {
    return [];
  }

  return (rawOwners as RawOwnerRecord[]).map((owner) => {
    const docType = resolveDocumentType(owner.tipoDocumento, owner.cpfCnpj);
    const isPlaceholder = isPlaceholderDocument(owner.cpfCnpj);
    const hasInsufficient = isPlaceholder || !owner.cpfCnpj;

    const maskedDocument = maskDocument(owner.cpfCnpj, docType);

    let note: string | undefined;
    if (hasInsufficient && !isPlaceholder) {
      note = 'Documento do titular não disponibilizado pela fonte';
    } else if (isPlaceholder) {
      note = 'Dado suprimido pela fonte por questões de sigilo';
    }
    if (docType === 'unknown' && !hasInsufficient) {
      note = (note ? note + '. ' : '') + 'Tipo de titular não informado pela fonte';
    }

    return {
      state: owner.uf || undefined,
      period: owner.anoExercicio || undefined,
      documentType: docType,
      maskedDocument,
      hasInsufficientData: hasInsufficient,
      note,
    };
  });
}
