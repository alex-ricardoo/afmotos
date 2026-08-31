import type { VehicleLookupMode } from './types.ts';

export interface VehicleLookupConfig {
  mode: VehicleLookupMode;
  apiBrasilToken: string | null;
  apiBrasilBaseUrl: string;
  timeoutMs: number;
  estimatedCostPerLookup: number;
}

export function getVehicleLookupConfig(): VehicleLookupConfig {
  const token =
    process.env.APIBRASIL_TOKEN ||
    process.env.API_BRASIL_TOKEN ||
    process.env.VEHICLE_LOOKUP_API_KEY ||
    null;

  const modeEnv = (process.env.VEHICLE_LOOKUP_MODE || (token ? 'live' : 'mock')).toLowerCase().trim();
  const mode: VehicleLookupMode = modeEnv === 'mock' ? 'mock' : 'live';

  return {
    mode,
    apiBrasilToken: token,
    apiBrasilBaseUrl:
      process.env.APIBRASIL_BASE_URL ||
      'https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits',
    timeoutMs: 120_000, // 120s timeout matching cURL --max-time 120
    estimatedCostPerLookup: 30.0,
  };
}
