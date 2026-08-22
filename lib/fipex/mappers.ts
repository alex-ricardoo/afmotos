import {
  FipeVehicleType,
  FipeBrand,
  FipeModel,
  FipeModelDetail,
  FipeYearOption,
  FipeFuel,
  FipeReferencePeriod,
  FipePriceResult,
  FipeExpandedResult,
  FipeAnalytics,
  FipePriceSnapshot,
  FipeQuote,
  RawVehicleType,
  RawMake,
  RawModel,
  RawModelDetail,
  RawReferencePeriod,
  RawFuel,
  RawPriceData,
  RawExpandedPriceData,
  RawPreludeData,
} from './types';

export function mapVehicleType(raw: RawVehicleType): FipeVehicleType {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
  };
}

export function mapBrand(raw: RawMake): FipeBrand {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
  };
}

export function mapModel(raw: RawModel): FipeModel {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    makeId: raw.make_id,
  };
}

export function mapFuel(raw: RawFuel): FipeFuel {
  return {
    id: raw.id,
    name: raw.name,
    acronym: raw.acronym,
  };
}

export function mapReferencePeriod(raw: RawReferencePeriod): FipeReferencePeriod {
  return {
    id: raw.id,
    month: raw.month,
    monthName: raw.month_name,
    year: raw.year,
    label: `${raw.month_name} de ${raw.year}`,
  };
}

export function mapModelDetail(raw: RawModelDetail): FipeModelDetail {
  const make = raw.make ? mapBrand(raw.make) : { id: '', name: '', slug: '' };
  const type = raw.type ? mapVehicleType(raw.type) : { id: '', name: '', slug: '' };

  const yearFuels = (raw.year_fuels || []).map((yf) => ({
    year: yf.model_year ?? null,
    isZeroKm: yf.model_year === 0 || yf.model_year === null,
    fuels: (yf.fuels || []).map(mapFuel),
  }));

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    make,
    type,
    yearFuels,
  };
}

export function mapPriceData(raw: RawPriceData): FipePriceResult {
  const priceReais = Number((raw.price_cents / 100).toFixed(2));
  const isZeroKm = raw.model_year === 0 || raw.model_year === null;

  return {
    priceCents: raw.price_cents,
    priceFormatted: raw.formatted_price,
    priceReais,
    modelYear: raw.model_year ?? null,
    isZeroKm,
    make: raw.make ? mapBrand(raw.make) : { id: '', name: '', slug: '' },
    model: raw.model
      ? { id: raw.model.id, name: raw.model.name, slug: raw.model.slug }
      : { id: '', name: '', slug: '' },
    fuel: raw.fuel ? mapFuel(raw.fuel) : { id: '', name: 'Não informado', acronym: '' },
    type: raw.type
      ? mapVehicleType(raw.type)
      : { id: '', name: 'Motocicletas', slug: 'motocicletas' },
    reference: raw.reference
      ? mapReferencePeriod(raw.reference)
      : {
          id: '',
          month: 1,
          monthName: '',
          year: new Date().getFullYear(),
          label: '',
        },
    fipeCode: raw.fipe_code ?? null,
    queryDate: raw.created_at || new Date().toISOString(),
  };
}

export function mapExpandedPrice(raw: RawExpandedPriceData): FipeExpandedResult {
  const price = mapPriceData(raw.price);

  let analytics: FipeAnalytics | null = null;
  if (raw.analytics) {
    analytics = {
      changeFromPreviousMonthPct: raw.analytics.change_from_previous_month_pct ?? null,
      changeFromLaunchPct: raw.analytics.change_from_launch_pct ?? null,
      peakToNowPctChange: raw.analytics.peak_to_now_pct_change ?? null,
      priceVolatility: raw.analytics.price_volatility ?? null,
      valueRetentionPct: raw.analytics.value_retention_pct ?? null,
      annualDepreciationRate: raw.analytics.annual_depreciation_rate ?? null,
      lifecycleStatus: raw.analytics.lifecycle_status ?? null,
    };
  }

  const history: FipePriceSnapshot[] = (raw.history || []).map((h) => ({
    year: h.year,
    month: h.month,
    priceCents: h.market_price_cents,
    priceFormatted: h.formatted_price,
  }));

  const availableYears: FipeYearOption[] = (raw.available_years || []).map((y) => {
    const isZeroKm = y.is_zero_km || y.value === 'zero' || y.value === '0';
    const yearNumber = isZeroKm ? null : parseInt(y.value, 10);
    return {
      value: y.value,
      label: isZeroKm ? '0km (Novo)' : y.value,
      year: isNaN(yearNumber as number) ? null : yearNumber,
      isZeroKm,
    };
  });

  return {
    price,
    analytics,
    history,
    availableYears,
  };
}

export function buildFipeQuote(
  expanded: FipeExpandedResult,
  queryPayload: Record<string, unknown>,
  rawResponse: unknown,
): FipeQuote {
  const p = expanded.price;
  const brandName = p.make.name || (queryPayload.brand_name as string) || 'Marca';
  const modelName = p.model.name || (queryPayload.model_name as string) || 'Modelo';
  const vehicleTypeId = p.type.id || (queryPayload.type_id as string) || 'motocicletas';
  const vehicleTypeLabel = p.type.name || (queryPayload.type_name as string) || 'Motocicletas';
  const brandId = p.make.id || (queryPayload.make_id as string) || '';
  const modelId = p.model.id || (queryPayload.model_id as string) || '';
  const fuelId = p.fuel.id || (queryPayload.fuel_id as string) || '';
  const fuelName =
    p.fuel.name !== 'Não informado'
      ? p.fuel.name
      : (queryPayload.fuel_name as string) || 'Gasolina';

  return {
    provider: 'fipex',
    providerLabel: 'fipeX',
    vehicleTypeId,
    vehicleTypeLabel,
    brandId,
    brandName,
    modelId,
    modelName,
    modelSlug: p.model.slug || '',
    versionName: null,
    year: p.modelYear,
    isZeroKm: p.isZeroKm,
    fuelId,
    fuelName,
    fuelAcronym: p.fuel.acronym || 'g',
    referencePeriodId: p.reference.id,
    referenceMonth: p.reference.month || 1,
    referenceYear: p.reference.year || new Date().getFullYear(),
    referenceLabel: p.reference.label || `${new Date().getFullYear()}`,
    fipeCode: p.fipeCode,
    priceReais: p.priceReais,
    currency: 'BRL',
    rawResponse,
  };
}

export function mapPrelude(raw: RawPreludeData): {
  vehicleTypes: FipeVehicleType[];
  fuels: FipeFuel[];
  periods: FipeReferencePeriod[];
} {
  return {
    vehicleTypes: (raw.types || []).map(mapVehicleType),
    fuels: (raw.fuels || []).map(mapFuel),
    periods: (raw.periods || []).map(mapReferencePeriod),
  };
}
