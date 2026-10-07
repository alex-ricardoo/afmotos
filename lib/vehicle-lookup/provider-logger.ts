export type ProviderEventType =
  | 'provider_attempt_created'
  | 'provider_lock_acquired'
  | 'provider_lock_unavailable'
  | 'provider_lock_renewed'
  | 'provider_lock_renewal_failed'
  | 'provider_request_sent'
  | 'provider_response_received'
  | 'provider_response_persistence_failed'
  | 'provider_timeout_charge_unknown'
  | 'provider_duplicate_blocked'
  | 'provider_retry_blocked'
  | 'provider_ambiguous_attempt_guard_blocked'
  | 'provider_manual_reprocess_requested'
  | 'provider_manual_reprocess_confirmed'
  | 'provider_manual_reprocess_authorized'
  | 'provider_manual_reprocess_denied'
  | 'provider_429_charge_unknown';

export type ProviderSource = 'admin_panel' | 'customer_flow' | 'cron' | 'worker';

export interface ProviderLogPayload {
  event: ProviderEventType;
  provider: string;
  operation: string;
  placa_normalizada: string;
  logical_request_id: string;
  physical_request_id: string;
  attempt_number: number;
  timeout_ms: number;
  duration_ms: number;
  status: string;
  charge_status: string;
  http_status?: number | null;
  deployment_id?: string | null;
  origem: ProviderSource;
  extra?: Record<string, unknown>;
}

/**
 * Sanitizes arbitrary values to prevent sensitive data leaks.
 * Strictly guarantees tokens, authorization headers, cookies, chassis,
 * renavam, customer PII or raw payloads are never output to logs.
 */
export function sanitizeValue(key: string, val: unknown): unknown {
  const lower = key.toLowerCase();
  if (
    lower.includes('token') ||
    lower.includes('auth') ||
    lower.includes('cookie') ||
    lower.includes('secret') ||
    lower.includes('password') ||
    lower.includes('key') ||
    lower.includes('chassi') ||
    lower.includes('renavam') ||
    lower.includes('cpf') ||
    lower.includes('email') ||
    lower.includes('delete_url') ||
    lower.includes('raw_payload') ||
    lower.includes('raw_response')
  ) {
    return '[REDACTED]';
  }
  return val;
}

export function redactSensitiveInfo(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    result[key] = sanitizeValue(key, val);
  }
  return result;
}

/**
 * Emits a structured JSON log adhering to the strict observability standard.
 */
export function logProviderEvent(payload: ProviderLogPayload): void {
  const deploymentId =
    payload.deployment_id ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    null;

  const sanitizedExtra: Record<string, unknown> = {};
  if (payload.extra) {
    for (const [k, v] of Object.entries(payload.extra)) {
      sanitizedExtra[k] = sanitizeValue(k, v);
    }
  }

  const structuredLog = {
    tag: '[API_BRASIL_PROVIDER]',
    timestamp: new Date().toISOString(),
    event: payload.event,
    provider: payload.provider,
    operation: payload.operation,
    placa_normalizada: payload.placa_normalizada,
    logical_request_id: payload.logical_request_id,
    physical_request_id: payload.physical_request_id,
    attempt_number: payload.attempt_number,
    timeout_ms: payload.timeout_ms,
    duration_ms: payload.duration_ms,
    status: payload.status,
    charge_status: payload.charge_status,
    http_status: payload.http_status ?? null,
    deployment_id: deploymentId,
    origem: payload.origem,
    ...(Object.keys(sanitizedExtra).length > 0 ? { extra: sanitizedExtra } : {}),
  };

  // Output JSON string
  const jsonOutput = JSON.stringify(structuredLog);

  if (
    payload.event === 'provider_timeout_charge_unknown' ||
    payload.event === 'provider_duplicate_blocked' ||
    payload.event === 'provider_retry_blocked' ||
    payload.event === 'provider_lock_unavailable' ||
    payload.event === 'provider_lock_renewal_failed' ||
    payload.event === 'provider_response_persistence_failed' ||
    payload.event === 'provider_ambiguous_attempt_guard_blocked' ||
    payload.event === 'provider_manual_reprocess_denied' ||
    payload.event === 'provider_429_charge_unknown'
  ) {
    console.warn(jsonOutput);
  } else {
    console.log(jsonOutput);
  }
}
