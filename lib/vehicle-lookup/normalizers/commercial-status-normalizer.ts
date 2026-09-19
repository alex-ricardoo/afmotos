// ─────────────────────────────────────────────────────────────────────────────
// Commercial Status Normalizer
//
// Extracts commercial/operational status flags using structured availability
// semantics. No longer directly accesses raw_response from vehicle-pdf.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { CommercialStatusNormalized, ReportDataPoint } from './types.ts';
import {
  resolveAvailability,
  stripEmojis,
  isExplicitNadaConsta,
} from './availability-helpers.ts';

function makeDataPoint<T>(
  value: T | null | undefined,
  explicitText: unknown,
  source: CommercialStatusNormalized['vehicleStatus']['source'] = 'state',
  sourceUpdatedAt?: string | null,
): ReportDataPoint<T> {
  return {
    value: value ?? null,
    availability: resolveAvailability(value, explicitText),
    source,
    sourceUpdatedAt: sourceUpdatedAt || null,
  };
}

/**
 * Normalizes commercial status from the raw data — extracting rental records,
 * sale communication, vehicle status, and restrictions from both baseEstadual
 * and baseNacional without re-parsing the raw JSON from higher-level adapters.
 */
export function normalizeCommercialStatus(
  data: Record<string, any> | null,
): CommercialStatusNormalized {
  if (!data) {
    const defaultPoint = <T>(val: T | null = null): ReportDataPoint<T> => ({
      value: val,
      availability: 'not_available',
      source: 'provider',
      sourceUpdatedAt: null,
    });

    return {
      vehicleStatus: defaultPoint<string>(),
      saleCommunication: defaultPoint<boolean>(),
      rentalRecord: defaultPoint<boolean>(),
      theftRobbery: defaultPoint<boolean>(),
      renajud: defaultPoint<string>(),
      administrativeRestriction: defaultPoint<string>(),
      tributaryRestriction: defaultPoint<string>(),
      judicialRestriction: defaultPoint<string>(),
      towRestriction: defaultPoint<string>(),
    };
  }

  const be = data.baseEstadual || {};
  const bn = data.baseNacional || {};
  const sourceDate = be.licdata || be.dataEmissaoCrv || bn.dtUltimaAtualizacao || null;

  // Vehicle status
  const situacao = be.situacaoVeiculo || bn.situacaoVeiculo || null;

  // Sale communication
  const vendaText = be.comunicacaoVenda || '';
  const vendaNacional = bn.indicadorComunicacaoVendas || '';
  const hasSaleCommunication =
    !isExplicitNadaConsta(vendaText) &&
    !isExplicitNadaConsta(vendaNacional) &&
    (vendaText.toUpperCase().includes('CONSTA') && !vendaText.toUpperCase().includes('NAO CONSTA')) ||
    vendaNacional === 'SIM';

  // Rental record
  const rentalData = data.registroEmLocadora;
  const hasRental = rentalData?.registroEmLocadora === true;

  // Theft / Robbery
  const rouboFurto = data.rouboFurto;
  const hasTheft = rouboFurto?.constaOcorrenciaAtiva === true;
  const theftText = be.restricaoRouboFurto || bn.ocorrencia || '';

  // Renajud
  const renajudText = be.restricaoRenajud || '';
  const renajudNacional = bn.indicadorRestricaoRenajud || '';

  // Administrative restriction
  const adminText = be.restricaoAdminisrativa || '';

  // Tributary restriction
  const tribText = be.restricaoTributaria || '';

  // Judicial restriction
  const judicialText = be.restricaoJudicial || '';

  // Tow restriction
  const towText = be.restricaoGuincho || '';

  return {
    vehicleStatus: makeDataPoint(
      situacao ? stripEmojis(String(situacao)) : null,
      situacao,
      'state',
      sourceDate,
    ),
    saleCommunication: makeDataPoint(
      hasSaleCommunication,
      vendaText || vendaNacional,
      'state',
      sourceDate,
    ),
    rentalRecord: makeDataPoint(hasRental, null, 'provider'),
    theftRobbery: makeDataPoint(
      hasTheft,
      theftText,
      'national',
      sourceDate,
    ),
    renajud: makeDataPoint(
      isExplicitNadaConsta(renajudText) || isExplicitNadaConsta(renajudNacional)
        ? 'Sem restrição'
        : renajudText || renajudNacional || null,
      renajudText || renajudNacional,
      'state',
      sourceDate,
    ),
    administrativeRestriction: makeDataPoint(
      isExplicitNadaConsta(adminText) ? null : adminText || null,
      adminText,
      'state',
      sourceDate,
    ),
    tributaryRestriction: makeDataPoint(
      isExplicitNadaConsta(tribText) ? null : tribText || null,
      tribText,
      'state',
      sourceDate,
    ),
    judicialRestriction: makeDataPoint(
      isExplicitNadaConsta(judicialText) ? null : judicialText || null,
      judicialText,
      'state',
      sourceDate,
    ),
    towRestriction: makeDataPoint(
      isExplicitNadaConsta(towText) ? null : towText || null,
      towText,
      'state',
      sourceDate,
    ),
  };
}
