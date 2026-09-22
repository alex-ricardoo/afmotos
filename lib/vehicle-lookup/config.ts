import type { VehicleLookupMode } from './types.ts';

export interface VehicleLookupConfig {
  mode: VehicleLookupMode;
  apiBrasilToken: string | null;
  apiBrasilBaseUrl: string;
  /** Timeout in milliseconds for each individual HTTP request to the API Brasil. */
  timeoutMs: number;
  estimatedCostPerLookup: number;
}

/**
 * Minimum allowed timeout (ms). Values below this are likely misconfiguration.
 */
const TIMEOUT_MIN_MS = 3_000;

/**
 * Maximum allowed timeout (ms). Values above this risk holding serverless functions
 * past their execution budget.
 */
const TIMEOUT_MAX_MS = 30_000;

/**
 * Default timeout when APIBRASIL_REQUEST_TIMEOUT_MS is not set or invalid.
 * 15 s is tolerant enough for the API Brasil gateway while keeping 2 attempts
 * well within Vercel's 60 s execution limit (~31 s total budget).
 */
const TIMEOUT_DEFAULT_MS = 15_000;

/**
 * Parses and validates the APIBRASIL_REQUEST_TIMEOUT_MS environment variable.
 * Returns a safe integer within [TIMEOUT_MIN_MS, TIMEOUT_MAX_MS] or the default.
 */
function parseRequestTimeoutMs(): number {
  const raw = process.env.APIBRASIL_REQUEST_TIMEOUT_MS;
  if (!raw) return TIMEOUT_DEFAULT_MS;

  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[VehicleLookupConfig] APIBRASIL_REQUEST_TIMEOUT_MS="${raw}" is not a valid positive integer. Using default ${TIMEOUT_DEFAULT_MS}ms.`,
    );
    return TIMEOUT_DEFAULT_MS;
  }

  if (parsed < TIMEOUT_MIN_MS || parsed > TIMEOUT_MAX_MS) {
    console.warn(
      `[VehicleLookupConfig] APIBRASIL_REQUEST_TIMEOUT_MS=${parsed}ms is outside the allowed range [${TIMEOUT_MIN_MS}, ${TIMEOUT_MAX_MS}]. Clamping to range.`,
    );
    return Math.max(TIMEOUT_MIN_MS, Math.min(parsed, TIMEOUT_MAX_MS));
  }

  return parsed;
}

export function getVehicleLookupConfig(overriddenCost?: number | null): VehicleLookupConfig {
  const token =
    process.env.APIBRASIL_TOKEN ||
    process.env.API_BRASIL_TOKEN ||
    process.env.VEHICLE_LOOKUP_API_KEY ||
    null;

  const modeEnv = (process.env.VEHICLE_LOOKUP_MODE || (token ? 'live' : 'mock'))
    .toLowerCase()
    .trim();
  const mode: VehicleLookupMode = modeEnv === 'mock' ? 'mock' : 'live';

  const defaultCost =
    typeof overriddenCost === 'number' && overriddenCost >= 0
      ? overriddenCost
      : parseFloat(process.env.VEHICLE_LOOKUP_ESTIMATED_COST || '') || 30.0;

  return {
    mode,
    apiBrasilToken: token,
    apiBrasilBaseUrl:
      process.env.APIBRASIL_BASE_URL ||
      'https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits',
    timeoutMs: parseRequestTimeoutMs(),
    estimatedCostPerLookup: defaultCost,
  };
}
