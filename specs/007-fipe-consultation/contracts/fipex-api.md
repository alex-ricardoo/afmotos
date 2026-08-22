# Contract: fipeX API Integration

**Feature**: 007-fipe-consultation
**Date**: 2026-08-22

## Base URL

```
https://api.fipex.com.br
```

## Auth

Nenhuma. Todos os endpoints `/v1` são públicos.

## Rate Limits

10 req/s por IP, burst de 60. HTTP 429 se excedido.

## Content Type

`Accept: application/json` (padrão).

---

## Tipos Internos Normalizados

Tipos que a camada `lib/fipex/mappers.ts` produz a partir das respostas da API. A UI consome apenas estes tipos — nunca os tipos raw da API.

```typescript
// lib/fipex/types.ts (tipos internos)

export type FipeVehicleType = {
  id: string;       // UUID do tipo na fipeX
  name: string;     // "Motocicletas"
  slug: string;     // "motocicletas"
};

export type FipeBrand = {
  id: string;       // UUID da marca
  name: string;     // "Honda"
  slug: string;     // "honda"
};

export type FipeModel = {
  id: string;       // UUID do modelo
  name: string;     // "CG 160 Fan"
  slug: string;     // "cg-160-fan"
  makeId: string;   // UUID da marca
};

export type FipeYearOption = {
  value: string;       // "2022" ou "zero"
  label: string;       // "2022" ou "0km (Novo)"
  year: number | null; // 2022 ou null
  isZeroKm: boolean;
};

export type FipeFuel = {
  id: string;       // UUID do combustível
  name: string;     // "Gasolina"
  acronym: string;  // "g"
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
  label: string;     // "Agosto 2026"
};

export type FipePriceResult = {
  priceCents: number;
  priceFormatted: string;
  priceReais: number;         // priceCents / 100
  modelYear: number | null;
  isZeroKm: boolean;
  make: FipeBrand;
  model: { id: string; name: string; slug: string };
  fuel: FipeFuel;
  type: FipeVehicleType;
  reference: FipeReferencePeriod;
  fipeCode: string | null;
  queryDate: string;          // ISO 8601
};

export type FipeExpandedResult = {
  price: FipePriceResult;
  analytics: FipeAnalytics | null;
  history: FipePriceSnapshot[];
  availableYears: FipeYearOption[];
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

// Tipo final para salvar no banco
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
```

---

## Endpoints Consumidos

### 1. Prelude (inicialização)

```
GET /v1/prelude
```

**Response**:
```json
{
  "data": {
    "fuels": [{ "id": "uuid", "acronym": "g", "name": "Gasolina" }],
    "types": [{ "id": "uuid", "name": "Motocicletas", "slug": "motocicletas" }],
    "periods": [{ "id": "uuid", "month": 8, "month_name": "Agosto", "year": 2026, ... }],
    "stats": { "total_prices": "...", "total_models": "..." }
  }
}
```

**Mapper**: `mapPrelude(raw) → { vehicleTypes: FipeVehicleType[], fuels: FipeFuel[], periods: FipeReferencePeriod[] }`

---

### 2. Marcas

```
GET /v1/makes?type_id={typeId}&limit=50&page={page}&order_by=name
```

**Response**:
```json
{
  "data": [{ "id": "uuid", "name": "Honda", "slug": "honda" }],
  "pagination": { "total": 30, "limit": 50, "page": 1, "pages": 1 }
}
```

**Mapper**: `mapBrands(raw) → FipeBrand[]`

---

### 3. Modelos

```
GET /v1/models?make_id={makeId}&type_id={typeId}&limit=50&page={page}&order_by=name
```

**Response**:
```json
{
  "data": [{ "id": "uuid", "name": "CG 160 Fan", "slug": "cg-160-fan", "make_id": "uuid" }],
  "pagination": { ... }
}
```

**Mapper**: `mapModels(raw) → FipeModel[]`

---

### 4. Detalhe do Modelo (anos + combustíveis)

```
GET /v1/models/{modelId}
```

**Response**:
```json
{
  "data": {
    "id": "uuid",
    "name": "CG 160 Fan",
    "slug": "cg-160-fan",
    "make": { "id": "uuid", "name": "Honda", "slug": "honda" },
    "type": { "id": "uuid", "name": "Motocicletas", "slug": "motocicletas" },
    "year_fuels": [
      {
        "model_year": 2022,
        "fuels": [{ "id": "uuid", "acronym": "g", "name": "Gasolina" }]
      }
    ]
  }
}
```

**Mapper**: `mapModelDetail(raw) → FipeModelDetail`

---

### 5. Preço Expandido

```
GET /v1/prices/expanded?model_id={modelId}&fuel_id={fuelId}&year={year}
```

**Response**: `ExpandedPriceResponse` (ver OpenAPI spec)

**Mapper**: `mapExpandedPrice(raw) → FipeExpandedResult`

---

### 6. Histórico de Preços

```
GET /v1/prices/history?model_id={modelId}&fuel_id={fuelId}&year={year}
```

**Response**: `VehiclePriceHistoryResponse`

**Mapper**: `mapPriceHistory(raw) → FipePriceSnapshot[]`

---

## Error Contract

```typescript
// lib/fipex/errors.ts

export class FipexError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'RATE_LIMITED' | 'NOT_FOUND' | 'VALIDATION' | 'SERVER' | 'NETWORK' | 'PARSE',
    public readonly status?: number,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'FipexError';
  }
}

// User-facing messages
export const FIPEX_ERROR_MESSAGES: Record<FipexError['code'], string> = {
  TIMEOUT: 'O serviço de consulta está temporariamente indisponível.',
  RATE_LIMITED: 'Muitas consultas em sequência. Aguarde um momento.',
  NOT_FOUND: 'Veículo não encontrado para os parâmetros informados.',
  VALIDATION: 'Parâmetros de consulta inválidos.',
  SERVER: 'O serviço de consulta está temporariamente indisponível.',
  NETWORK: 'Verifique sua conexão com a internet.',
  PARSE: 'Não foi possível processar a resposta do serviço.',
};
```
