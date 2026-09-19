// ─────────────────────────────────────────────────────────────────────────────
// Core domain types for the vehicle report normalization layer.
// These types form the contract between raw API Brasil data and the PDF/UI.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semantic classification of data availability for a given field.
 *
 * The key distinction: "positive" means the source *explicitly* confirmed
 * absence of an occurrence (e.g., "NADA CONSTA"), while "not_informed" means
 * the source returned null/undefined/empty — which is NOT the same as "clear".
 */
export type DataAvailability =
  | 'positive'       // Source explicitly confirmed absence of occurrence/restriction
  | 'negative'       // Source confirmed presence of occurrence/restriction
  | 'not_informed'   // Field was null, undefined, empty, or not provided by source
  | 'not_available'  // This data type is not offered by the current product/query
  | 'inconsistent'   // Divergence detected between multiple sources
  | 'historical';    // Record exists but is historical (not necessarily active)

/**
 * Origin of the evidence for a data point.
 */
export type EvidenceSource =
  | 'national'    // Base Nacional (SENATRAN / RENAVAM)
  | 'state'       // Base Estadual (DETRAN)
  | 'financial'   // SIRCAF / Gravame / Financial institutions
  | 'fipe'        // Tabela FIPE
  | 'auction'     // Auction databases
  | 'sinister'    // Insurance / sinister databases
  | 'provider';   // API Brasil (aggregated / unspecified)

/**
 * A single data point enriched with availability, source, and date metadata.
 */
export interface ReportDataPoint<T> {
  value: T | null;
  availability: DataAvailability;
  source: EvidenceSource;
  sourceUpdatedAt?: string | null;
  note?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Source Consistency
// ─────────────────────────────────────────────────────────────────────────────

export interface SourceConsistencyEntry {
  field: string;
  sources: Array<{ source: string; value: string }>;
  recommendation: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gravame
// ─────────────────────────────────────────────────────────────────────────────

export type GravameStatus = 'active' | 'cleared' | 'not_informed';

export interface GravameCurrentStatus {
  status: GravameStatus;
  label: string;
  agent?: string;
  inclusionDate?: string;
}

export interface GravameHistoricalRecord {
  agent: string;
  statusLabel: string;
  inclusionDate?: string;
  observation?: string;
}

export interface GravameNormalized {
  current: GravameCurrentStatus;
  historicalRecords: GravameHistoricalRecord[];
  totalRecordsFound: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIPE
// ─────────────────────────────────────────────────────────────────────────────

export interface FipeSingleReference {
  code: string;
  version: string;
  price: number;
  fuel?: string;
  referenceMonth?: string;
}

export interface FipeReferenceNormalized {
  primary: FipeSingleReference | null;
  alternatives: FipeSingleReference[];
  hasMultipleReferences?: boolean;
  selectionNote: string;
  marketDisclaimer: string;
  priceHistory: Array<{ reference: string; price: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Debts
// ─────────────────────────────────────────────────────────────────────────────

export interface DebtsSourceInfo {
  licensingYear?: string;
  lastUpdateDate?: string;
  isStale: boolean;
  staleWarning?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Owner
// ─────────────────────────────────────────────────────────────────────────────

export interface OwnerNormalized {
  state?: string;
  period?: string;
  documentType: 'PF' | 'PJ' | 'unknown';
  maskedDocument: string;
  hasInsufficientData: boolean;
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Commercial Status
// ─────────────────────────────────────────────────────────────────────────────

export interface CommercialStatusNormalized {
  vehicleStatus: ReportDataPoint<string>;
  saleCommunication: ReportDataPoint<boolean>;
  rentalRecord: ReportDataPoint<boolean>;
  theftRobbery: ReportDataPoint<boolean>;
  renajud: ReportDataPoint<string>;
  administrativeRestriction: ReportDataPoint<string>;
  tributaryRestriction: ReportDataPoint<string>;
  judicialRestriction: ReportDataPoint<string>;
  towRestriction: ReportDataPoint<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportMetadata {
  generatedAt: string;
  providerName: string;
  normalizerVersion: string;
  sourceUpdateDates: Array<{ source: string; date: string | null }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const NORMALIZER_VERSION = '2.0.0';

export const STALE_THRESHOLD_DAYS_DEFAULT = 90;

export const FIPE_MARKET_DISCLAIMER =
  'O valor da Tabela FIPE é uma referência de mercado e pode variar conforme versão, estado de conservação, região, quilometragem, acessórios e condições de negociação.';

export const REPORT_GENERAL_DISCLAIMER =
  'Este relatório foi elaborado com base nas informações disponibilizadas pela integração com a API Brasil e fontes públicas/conveniadas na data de atualização indicada. ' +
  'Este relatório é complementar e não substitui vistoria mecânica presencial, perícia, conferência do CRLV-e ou validação documental junto aos órgãos competentes antes da compra ou transferência.';
