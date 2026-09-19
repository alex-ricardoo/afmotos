// ─────────────────────────────────────────────────────────────────────────────
// Gravame Normalizer
//
// Separates current (active) gravame from historical (cleared) records.
// Never exposes documentoFinanciado, contrato, or numero in client DTOs.
// ─────────────────────────────────────────────────────────────────────────────

import type { GravameNormalized, GravameCurrentStatus, GravameHistoricalRecord } from './types.ts';
import { normalizeForComparison } from './availability-helpers.ts';

interface RawGravameRecord {
  uf?: string;
  placa?: string;
  agente?: string;
  chassi?: string;
  numero?: string;
  gravame?: string | null;
  renavam?: string;
  contrato?: string;
  situacao?: string;
  observacoes?: string;
  responsavel?: string;
  dataInclusao?: string;
  dataSituacao?: string;
  documentoFinanciado?: string;
  documentoAgente?: string;
  dataVigencia?: string;
  dataVigenciaContrato?: string;
  [key: string]: unknown;
}

function isBaixadoStatus(situacao: string): boolean {
  const norm = normalizeForComparison(situacao);
  return (
    norm.includes('BAIXADO') ||
    norm.includes('CANCELADO') ||
    norm.includes('DESALIENADO') ||
    norm.includes('ENCERRADO') ||
    norm.includes('QUITADO')
  );
}

function isActiveStatus(situacao: string): boolean {
  const norm = normalizeForComparison(situacao);
  if (isBaixadoStatus(situacao)) return false;
  return (
    norm.includes('ALIENACAO') ||
    norm.includes('PENDENTE') ||
    norm.includes('ATIVO') ||
    norm.includes('VIGENTE') ||
    norm.includes('INCLUIDO') ||
    (norm.length > 0 && !isBaixadoStatus(situacao))
  );
}

function isHistoricalObservation(obs: string | undefined | null): boolean {
  if (!obs) return false;
  return normalizeForComparison(obs).includes('HISTORICO');
}

/**
 * Format a gravame status for user-friendly display.
 * Explains that "baixado" is different from "never had gravame".
 */
function formatGravameStatusLabel(situacao: string | null | undefined): string {
  if (!situacao) return 'Situação não informada pela fonte';
  const norm = normalizeForComparison(situacao);

  if (norm.includes('BAIXADO')) {
    return 'Gravame baixado pelo agente financeiro';
  }
  if (norm.includes('CANCELADO')) {
    return 'Gravame cancelado';
  }
  if (norm.includes('DESALIENADO')) {
    return 'Veículo desalienado';
  }
  if (norm.includes('ALIENACAO') || norm.includes('ATIVO') || norm.includes('VIGENTE')) {
    return 'Gravame/restrição financeira ativa identificada';
  }
  if (norm.includes('PENDENTE')) {
    return 'Gravame pendente de confirmação';
  }

  // Return sanitized original
  return situacao.trim();
}

/**
 * Normalizes gravame data from the raw API Brasil response.
 *
 * Key rules:
 * - Separates active vs cleared/historical gravames
 * - Never exposes documentoFinanciado, contrato number, or internal identifiers
 * - Explains that "gravame baixado" ≠ "never had financing"
 */
export function normalizeGravame(rawGravame: unknown): GravameNormalized {
  // No gravame data at all
  if (!rawGravame) {
    return {
      current: {
        status: 'not_informed',
        label: 'Situação financeira não informada pela fonte',
      },
      historicalRecords: [],
      totalRecordsFound: 0,
    };
  }

  // Single object (alternate API format)
  if (!Array.isArray(rawGravame) && typeof rawGravame === 'object') {
    const g = rawGravame as RawGravameRecord;
    const situacao = g.situacao || g.gravame || '';
    const isCleared = isBaixadoStatus(situacao);

    return {
      current: {
        status: isCleared ? 'cleared' : isActiveStatus(situacao) ? 'active' : 'not_informed',
        label: formatGravameStatusLabel(situacao),
        agent: g.agente || undefined,
        inclusionDate: g.dataInclusao || undefined,
      },
      historicalRecords: [],
      totalRecordsFound: 1,
    };
  }

  // Array of gravame records
  if (!Array.isArray(rawGravame) || rawGravame.length === 0) {
    return {
      current: {
        status: 'not_informed',
        label: 'Nenhum registro de gravame retornado pela fonte',
      },
      historicalRecords: [],
      totalRecordsFound: 0,
    };
  }

  const records = rawGravame as RawGravameRecord[];

  // Find truly active gravame (not baixado/historico)
  const activeRecord = records.find((g) => {
    const sit = g.situacao || g.gravame || '';
    if (isBaixadoStatus(sit)) return false;
    if (isHistoricalObservation(g.observacoes)) return false;
    return isActiveStatus(sit);
  });

  // Build current status
  let current: GravameCurrentStatus;

  if (activeRecord) {
    current = {
      status: 'active',
      label: formatGravameStatusLabel(activeRecord.situacao),
      agent: activeRecord.agente || undefined,
      inclusionDate: activeRecord.dataInclusao || undefined,
    };
  } else {
    // All gravames are cleared/historical
    // Check if the "current" tagged one exists
    const currentTagged = records.find(
      (g) => normalizeForComparison(g.observacoes) === 'ATUAL',
    );
    const referenceRecord = currentTagged || records[0];

    current = {
      status: 'cleared',
      label: 'Nenhum gravame ativo identificado nas bases consultadas',
      agent: referenceRecord?.agente || undefined,
      inclusionDate: referenceRecord?.dataInclusao || undefined,
    };
  }

  // Build historical records (all cleared ones)
  const historicalRecords: GravameHistoricalRecord[] = records
    .filter((g) => {
      // Skip the active one if it exists
      if (activeRecord && g === activeRecord) return false;
      return true;
    })
    .map((g) => ({
      agent: g.agente || 'Agente não informado',
      statusLabel: formatGravameStatusLabel(g.situacao),
      inclusionDate: g.dataInclusao || undefined,
      observation: isHistoricalObservation(g.observacoes)
        ? 'Registro histórico'
        : normalizeForComparison(g.observacoes) === 'ATUAL'
          ? 'Gravame mais recente'
          : g.observacoes || undefined,
    }));

  return {
    current,
    historicalRecords,
    totalRecordsFound: records.length,
  };
}
