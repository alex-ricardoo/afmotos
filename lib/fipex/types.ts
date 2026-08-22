/**
 * Tipos TypeScript da API fipeX e tipos normalizados de domínio para a Tabela FIPE.
 */

// ==========================================
// 1. Tipos Normalizados Internos (Domínio)
// ==========================================

export type FipeVehicleType = {
  id: string; // UUID do tipo na fipeX
  name: string; // Ex: "Motocicletas", "Carros", "Caminhões"
  slug: string; // Ex: "motocicletas"
};

export type FipeBrand = {
  id: string; // UUID da marca
  name: string; // Ex: "Honda", "Yamaha"
  slug: string; // Ex: "honda"
};

export type FipeModel = {
  id: string; // UUID do modelo
  name: string; // Ex: "CG 160 Fan"
  slug: string; // Ex: "cg-160-fan"
  makeId?: string; // UUID da marca
};

export type FipeYearOption = {
  value: string; // Ex: "2022" ou "zero"
  label: string; // Ex: "2022" ou "0km (Novo)"
  year: number | null; // 2022 ou null
  isZeroKm: boolean;
};

export type FipeFuel = {
  id: string; // UUID do combustível
  name: string; // Ex: "Gasolina", "Flex"
  acronym: string; // Ex: "g", "f"
};

export type FipeModelDetail = {
  id: string;
  name: string;
  slug: string;
  make: FipeBrand;
  type: FipeVehicleType;
  yearFuels: Array<{
    year: number | null;
    isZeroKm: boolean;
    fuels: FipeFuel[];
  }>;
};

export type FipeReferencePeriod = {
  id: string;
  month: number;
  monthName: string;
  year: number;
  label: string; // Ex: "Agosto 2026"
};

export type FipePriceResult = {
  priceCents: number;
  priceFormatted: string;
  priceReais: number; // priceCents / 100
  modelYear: number | null;
  isZeroKm: boolean;
  make: FipeBrand;
  model: { id: string; name: string; slug: string };
  fuel: FipeFuel;
  type: FipeVehicleType;
  reference: FipeReferencePeriod;
  fipeCode: string | null;
  queryDate: string; // ISO 8601
};

export type FipeAnalytics = {
  changeFromPreviousMonthPct: number | null;
  changeFromLaunchPct: number | null;
  peakToNowPctChange: number | null;
  priceVolatility: number | null;
  valueRetentionPct: number | null;
  annualDepreciationRate: number | null;
  lifecycleStatus: string | null;
};

export type FipePriceSnapshot = {
  year: number;
  month: number;
  priceCents: number;
  priceFormatted: string;
};

export type FipeExpandedResult = {
  price: FipePriceResult;
  analytics: FipeAnalytics | null;
  history: FipePriceSnapshot[];
  availableYears: FipeYearOption[];
};

export type FipeQuote = {
  provider: 'fipex';
  providerLabel: 'fipeX';
  vehicleTypeId: string;
  vehicleTypeLabel: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  modelSlug: string;
  versionName: string | null;
  year: number | null;
  isZeroKm: boolean;
  fuelId: string;
  fuelName: string;
  fuelAcronym: string;
  referencePeriodId: string;
  referenceMonth: number;
  referenceYear: number;
  referenceLabel: string;
  fipeCode: string | null;
  priceReais: number;
  currency: 'BRL';
  rawResponse: unknown;
};

// ==========================================
// 2. Tipos Raw da API fipeX (OpenAPI spec)
// ==========================================

export type RawVehicleType = {
  id: string;
  name: string;
  slug: string;
};

export type RawMake = {
  id: string;
  name: string;
  slug: string;
};

export type RawModel = {
  id: string;
  name: string;
  slug: string;
  make_id?: string;
};

export type RawFuel = {
  id: string;
  acronym: string;
  name: string;
};

export type RawYearFuel = {
  model_year: number | null;
  fuels?: RawFuel[];
};

export type RawModelDetail = {
  id: string;
  name: string;
  slug: string;
  make?: RawMake;
  type?: RawVehicleType;
  year_fuels?: RawYearFuel[];
};

export type RawReferencePeriod = {
  id: string;
  month: number;
  month_name: string;
  year: number;
};

export type RawPriceData = {
  price_cents: number;
  formatted_price: string;
  model_year?: number | null;
  make?: RawMake;
  model?: RawModel;
  fuel?: RawFuel;
  type?: RawVehicleType;
  reference?: RawReferencePeriod;
  fipe_code?: string | null;
  created_at?: string;
};

export type RawPriceAnalytics = {
  change_from_previous_month_pct?: number | null;
  change_from_launch_pct?: number | null;
  peak_to_now_pct_change?: number | null;
  price_volatility?: number | null;
  value_retention_pct?: number | null;
  annual_depreciation_rate?: number | null;
  lifecycle_status?: string | null;
};

export type RawHistoryItem = {
  year: number;
  month: number;
  market_price_cents: number;
  formatted_price: string;
};

export type RawExpandedPriceData = {
  price: RawPriceData;
  analytics?: RawPriceAnalytics | null;
  history?: RawHistoryItem[];
  available_years?: Array<{
    value: string;
    is_zero_km?: boolean;
  }>;
};

export type RawApiResponse<T> = {
  data: T;
  pagination?: {
    total: number;
    limit: number;
    page: number;
    pages: number;
  };
};

export type RawPreludeData = {
  fuels: RawFuel[];
  types: RawVehicleType[];
  periods: RawReferencePeriod[];
  stats?: {
    total_prices?: string;
    total_models?: string;
  };
};
