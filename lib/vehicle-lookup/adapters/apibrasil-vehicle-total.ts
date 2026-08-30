import {
  ApiBrasilVehicleResponseSchema,
  type ApiBrasilVehicleResponse,
} from '../schema.ts';

export function parseApiBrasilVehicleResponse(raw: unknown): ApiBrasilVehicleResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      error: true,
      message: 'Payload inválido ou vazio recebido do provedor.',
      status_code: 500,
      data: null,
      dados: null,
    };
  }

  const parseResult = ApiBrasilVehicleResponseSchema.safeParse(raw);
  if (parseResult.success) {
    const d = parseResult.data;
    // Harmonize so that either .data or .dados can be used
    const mainData = d.data || d.dados || null;
    return {
      ...d,
      data: mainData,
      dados: mainData,
    };
  }

  const rawObj = raw as Record<string, unknown>;
  const mainData = (rawObj.data || rawObj.dados || null) as any;
  return {
    error: Boolean(rawObj.error),
    message: typeof rawObj.message === 'string' ? rawObj.message : 'Sucesso',
    status_code: typeof rawObj.status_code === 'number' ? rawObj.status_code : 200,
    balance: rawObj.balance as any,
    tax: rawObj.tax as any,
    data: mainData,
    dados: mainData,
  };
}

/**
 * Helper to parse Brazilian currency strings like "125000.00" or "195,23" or numbers into a float
 */
export function parseBrazilianNumber(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val || typeof val !== 'string') return 0;
  const clean = val.trim().replace('R$', '').trim();
  if (!clean) return 0;
  // If format like 1.250,50
  if (clean.includes(',') && clean.includes('.')) {
    const formatted = clean.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(formatted);
    return isNaN(n) ? 0 : n;
  }
  // If format like 195,23
  if (clean.includes(',')) {
    const formatted = clean.replace(',', '.');
    const n = parseFloat(formatted);
    return isNaN(n) ? 0 : n;
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}
