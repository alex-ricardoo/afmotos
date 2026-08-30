import type { VehicleLookupMode } from './types.ts';

export interface VehicleLookupConfig {
  mode: VehicleLookupMode;
  apiBrasilToken: string | null;
  apiBrasilBaseUrl: string;
  timeoutMs: number;
  estimatedCostPerLookup: number;
}

export function getVehicleLookupConfig(): VehicleLookupConfig {
  const modeEnv = (process.env.VEHICLE_LOOKUP_MODE || 'mock').toLowerCase().trim();
  const mode: VehicleLookupMode = modeEnv === 'live' ? 'live' : 'mock';

  return {
    mode,
    apiBrasilToken: process.env.APIBRASIL_TOKEN || null,
    apiBrasilBaseUrl: process.env.APIBRASIL_BASE_URL || 'https://gateway.apibrasil.com.br/api/v2',
    timeoutMs: 15000,
    estimatedCostPerLookup: 30.0,
  };
}
