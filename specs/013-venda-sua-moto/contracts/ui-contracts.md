# UI & Component Contracts: Venda sua Moto

**Feature**: `013-venda-sua-moto`  
**Date**: 2026-08-23  
**Status**: Ready

## 1. Estrutura de Componentes da Página `/venda-sua-moto`

```text
app/(public)/venda-sua-moto/
└── page.tsx                         # Server Component com SEO Metadata, Hero, Stepper Container, Trust Bar
components/forms/venda-moto-form/
├── index.tsx                        # Client Component: Wizard Root, React Hook Form Provider, Navigation State
├── steps/
│   ├── step-1-motorcycle-data.tsx   # Etapa 1: Marca, Modelo, Ano, Km, Cor, Placa Opcional
│   ├── step-2-fipe-simulator.tsx    # Etapa 2: Consulta FIPE, Seletor Percentual (70-100%), Cálculo, Expectativa
│   ├── step-3-owner-contact.tsx     # Etapa 3: Nome, WhatsApp, E-mail, Município (PE), Observações
│   ├── step-4-photos-upload.tsx     # Etapa 4: Drag & Drop, Miniaturas, Validação 5MB, Progresso
│   └── step-5-review-submit.tsx     # Etapa 5: Resumo Completo, Checkbox de Consentimento, Botão de Envio
├── venda-moto-stepper.tsx           # Stepper responsivo (Mobile compacto / Desktop numerado)
├── venda-moto-summary-card.tsx      # Card lateral Desktop (Sticky) com atualização dinâmica de valores
└── venda-moto-success-view.tsx      # Feedback de sucesso pós-envio com protocolo e CTA de WhatsApp
```

---

## 2. Contratos de Propriedades e Eventos

### `VendaMotoSimulatorProps`

```typescript
export interface VendaMotoSimulatorProps {
  fipePrice: number | null;
  fipeReferencePeriod: string | null;
  fipeCode: string | null;
  selectedPercentage: number; // default: 85 ou 90
  onPercentageChange: (percentage: number) => void;
  desiredPrice?: number | null;
  onDesiredPriceChange: (price: number | null) => void;
  isLoadingFipe: boolean;
  onManualModeToggle?: () => void;
}
```

### `VendaMotoSummaryCardProps`

```typescript
export interface VendaMotoSummaryCardProps {
  brand?: string;
  model?: string;
  yearModel?: number;
  mileage?: number;
  city?: string;
  fipePrice?: number | null;
  offerPercentage?: number;
  estimatedOffer?: number | null;
  desiredPrice?: number | null;
  currentStep: number;
  photosCount: number;
}
```

---

## 3. Estados Visuais e Design System

- **Paleta de Cores**:
  - Fundo principal: `#050505` / `zinc-950`
  - Cards e superfícies: `zinc-900/70` com backdrop blur e bordas `zinc-800/80`
  - Destaques e badges primários: Dourado AF Motos (`#c9a44c`, `#e3c56c`, `amber-400`, `amber-500`)
  - Ações WhatsApp: Verde oficial (`#25D366`, `emerald-500`)
  - Alertas informativos: `amber-500/10` com borda `amber-500/30` e texto `amber-400`
- **Tipografia**:
  - Títulos: `font-heading font-black tracking-tight text-white`
  - Textos de suporte: `text-zinc-400 text-sm leading-relaxed`
  - Valores monetários: `font-mono` ou `font-extrabold text-amber-400`
