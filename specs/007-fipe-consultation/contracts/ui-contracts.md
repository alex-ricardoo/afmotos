# Contract: UI Components

**Feature**: 007-fipe-consultation
**Date**: 2026-08-22

## Page: `/admin/fipe`

### Server Component: `page.tsx`

```typescript
// app/admin/(protected)/fipe/page.tsx
export const metadata = {
  title: 'Consulta Tabela FIPE | AF Motos',
  robots: { index: false, follow: false },
};

// Renderiza FipePageClient
// Carrega lista inicial de motos para o linker (Server Component)
```

### Client Component: `FipePageClient`

**Props**: `{ motorcycles: MotorcycleForLinker[] }`

**Responsabilidades**:
- Orquestrar estado do formulário, resultado e histórico
- Layout responsivo: desktop (2 colunas) / mobile (vertical)

---

## Component: `FipeSearchForm`

**Props**:
```typescript
{
  onResult: (result: FipeExpandedResult, quote: FipeQuote) => void;
  onLoading: (loading: boolean) => void;
  onClear: () => void;
}
```

**Estado interno**:
```typescript
{
  vehicleTypes: FipeVehicleType[];      // do prelude
  brands: FipeBrand[];
  models: FipeModel[];
  modelDetail: FipeModelDetail | null;
  years: FipeYearOption[];
  fuels: FipeFuel[];

  selectedTypeId: string | null;
  selectedBrandId: string | null;
  selectedModelId: string | null;
  selectedYear: string | null;           // "2022" ou "zero"
  selectedFuelId: string | null;

  loadingStep: 'types' | 'brands' | 'models' | 'detail' | 'result' | null;
  error: string | null;
}
```

**Regras de cascata**:
- Trocar tipo → limpar brand, model, year, fuel
- Trocar brand → limpar model, year, fuel
- Trocar model → limpar year, fuel; carregar detalhe
- Trocar year → limpar fuel; filtrar combustíveis do year_fuels
- Trocar fuel → habilitar botão "Consultar"

**Labels (pt-BR)**:

| Campo | Label | Placeholder |
|---|---|---|
| Tipo | Tipo de veículo | Selecione o tipo |
| Marca | Marca | Selecione a marca |
| Modelo | Modelo | Selecione o modelo |
| Ano | Ano/modelo | Selecione o ano |
| Combustível | Combustível | Selecione o combustível |
| Submit | Consultar valor | — |
| Clear | Limpar formulário | — |

---

## Component: `FipeResultCard`

**Props**:
```typescript
{
  quote: FipeQuote;
  expanded: FipeExpandedResult | null;
  onSave: () => void;
  onLink: () => void;
  isSaving: boolean;
  isSaved: boolean;
}
```

**Exibição**:
```
┌──────────────────────────────────────┐
│ Honda CG 160 Fan                     │
│ Ano/modelo: 2022                     │
│ Combustível: Gasolina                │
│ Código FIPE: 811049-7                │
│                                      │
│ Valor de referência                  │
│ R$ XX.XXX,XX                         │
│                                      │
│ Referência: Agosto 2026              │
│ Consultado em: 22/08/2026 15:30      │
│                                      │
│ ⚠ O valor é apenas uma referência.  │
│ Fonte: fipeX                         │
│                                      │
│ [Salvar consulta] [Vincular moto]    │
└──────────────────────────────────────┘
```

---

## Component: `FipeMotorcycleLinker`

**Props**:
```typescript
{
  motorcycles: MotorcycleForLinker[];
  quote: FipeQuote;
  consultationId: string | null;
  onLinked: (motorcycleId: string) => void;
}

type MotorcycleForLinker = {
  id: string;
  brand: string;
  model: string;
  yearModel: number;
  price: number | null;
  mileage: number | null;
  status: string;
};
```

---

## Component: `FipePriceComparison`

**Props**:
```typescript
{
  advertisedPrice: number | null;
  fipePrice: number;
  motorcycleName: string;
}
```

**Exibição**:
```
Preço anunciado:        R$ XX.XXX,XX
Valor de referência:    R$ XX.XXX,XX
Diferença:              R$ X.XXX,XX (X% acima/abaixo da referência)
```

---

## Component: `FipeHistorySection`

**Props**:
```typescript
{
  onRequery: (consultation: FipeConsultation) => void;
  onOpen: (consultation: FipeConsultation) => void;
}
```

**Desktop**: Tabela com colunas: Data, Marca, Modelo, Ano, Valor, Moto vinculada, Ações
**Mobile**: Cards com Modelo, Ano, Valor, Data, botão "Ver detalhes"

---

## Component: `FipeSourceNotice`

Renderiza os avisos obrigatórios. Sem props. Estático.

```
⚠ O valor exibido é apenas uma referência. O preço real pode variar
  conforme conservação, quilometragem, documentação, região e estado
  da motocicleta.

Fonte de referência: fipeX. Consulta utilizada apenas como apoio à negociação.
```

---

## Server Actions

### `saveFipeConsultation`

```typescript
// lib/actions/fipe-consultations.ts
'use server'

async function saveFipeConsultation(input: {
  quote: FipeQuote;
  queryPayload: Record<string, unknown>;
  motorcycleId?: string;
  notes?: string;
}): Promise<{ data: FipeConsultation | null; error: string | null }>
```

### `updateFipeConsultationNotes`

```typescript
async function updateFipeConsultationNotes(
  id: string,
  notes: string | null
): Promise<{ error: string | null }>
```

### `linkFipeConsultationToMotorcycle`

```typescript
async function linkFipeConsultationToMotorcycle(
  consultationId: string,
  motorcycleId: string
): Promise<{ error: string | null }>
```

### `deleteFipeConsultation`

```typescript
async function deleteFipeConsultation(
  id: string
): Promise<{ error: string | null }>
```

---

## Pure Functions

### `calculatePriceDifference`

```typescript
// lib/domain/fipe-price.ts
function calculatePriceDifference(
  advertisedPrice: number | null,
  fipePrice: number | null
): {
  amount: number | null;
  percentage: number | null;
  direction: 'above' | 'below' | 'equal' | 'unknown';
  label: string;  // "Acima da referência", "Abaixo da referência", etc.
}
```

### `formatFipePrice`

```typescript
function formatFipePrice(valueInReais: number): string
// Usa Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
```

### `formatReferenceLabel`

```typescript
function formatReferenceLabel(month: number, year: number): string
// "Agosto 2026"
```
