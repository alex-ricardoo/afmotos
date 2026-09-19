// ─────────────────────────────────────────────────────────────────────────────
// Safe Logger
//
// Logging helper that NEVER logs PII, raw payloads, or sensitive identifiers.
// Used for consultation events and normalization diagnostics.
// ─────────────────────────────────────────────────────────────────────────────

import { NORMALIZER_VERSION } from './types.ts';

interface ConsultationEvent {
  type: string;
  consultationId?: string;
  provider?: string;
  statusCode?: number;
  failureClass?: string;
  processingTimeMs?: number;
  normalizerVersion?: string;
  divergenceCount?: number;
  gravameRecordCount?: number;
  fipeAlternativeCount?: number;
  debtsStale?: boolean;
  ownerPlaceholderCount?: number;
}

/**
 * Logs a consultation event safely. Masks IDs and never includes
 * raw payload, chassi, CPF/CNPJ, motor, contrato, or financial documents.
 */
export function logConsultationEvent(event: ConsultationEvent): void {
  const safeEvent: Record<string, unknown> = {
    type: event.type,
    provider: event.provider || 'unknown',
    normalizerVersion: event.normalizerVersion || NORMALIZER_VERSION,
    timestamp: new Date().toISOString(),
  };

  // Mask consultation ID — only show first 8 chars
  if (event.consultationId) {
    safeEvent.consultationIdPrefix = event.consultationId.slice(0, 8) + '***';
  }

  if (event.statusCode != null) safeEvent.statusCode = event.statusCode;
  if (event.failureClass) safeEvent.failureClass = event.failureClass;
  if (event.processingTimeMs != null) safeEvent.processingTimeMs = event.processingTimeMs;
  if (event.divergenceCount != null) safeEvent.divergenceCount = event.divergenceCount;
  if (event.gravameRecordCount != null) safeEvent.gravameRecordCount = event.gravameRecordCount;
  if (event.fipeAlternativeCount != null) safeEvent.fipeAlternativeCount = event.fipeAlternativeCount;
  if (event.debtsStale != null) safeEvent.debtsStale = event.debtsStale;
  if (event.ownerPlaceholderCount != null) safeEvent.ownerPlaceholderCount = event.ownerPlaceholderCount;

  // Use structured logging (JSON)
  console.info(`[vehicle-lookup] ${JSON.stringify(safeEvent)}`);
}
