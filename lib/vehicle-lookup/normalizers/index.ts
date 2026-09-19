// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Report Normalizers — Barrel Exports
//
// All normalizer modules export from here. Import via:
//   import { normalizeGravame, ... } from '../normalizers/index.ts';
// ─────────────────────────────────────────────────────────────────────────────

// Types
export type {
  DataAvailability,
  EvidenceSource,
  ReportDataPoint,
  SourceConsistencyEntry,
  GravameStatus,
  GravameCurrentStatus,
  GravameHistoricalRecord,
  GravameNormalized,
  FipeSingleReference,
  FipeReferenceNormalized,
  DebtsSourceInfo,
  OwnerNormalized,
  CommercialStatusNormalized,
  ReportMetadata,
} from './types.ts';

export {
  NORMALIZER_VERSION,
  STALE_THRESHOLD_DAYS_DEFAULT,
  FIPE_MARKET_DISCLAIMER,
  REPORT_GENERAL_DISCLAIMER,
} from './types.ts';

// Helpers
export {
  stripEmojis,
  normalizeForComparison,
  isExplicitNadaConsta,
  isExplicitRestriction,
  isPlaceholderDocument,
  resolveAvailability,
  formatAvailabilityLabel,
  formatFieldStatus,
  getSourceUpdateDate,
  parseBrazilianDate,
  isSourceStale,
} from './availability-helpers.ts';

// Normalizers
export { normalizeGravame } from './gravame-normalizer.ts';
export { detectMunicipioDivergence, detectUfDivergence, detectAllDivergences, normalizeLocationForComparison } from './source-consistency.ts';
export { normalizeFipeReferences } from './fipe-normalizer.ts';
export { normalizeDebts } from './debts-normalizer.ts';
export { normalizeOwners } from './owner-normalizer.ts';
export { normalizeCommercialStatus } from './commercial-status-normalizer.ts';

// Logger
export { logConsultationEvent } from './safe-logger.ts';
