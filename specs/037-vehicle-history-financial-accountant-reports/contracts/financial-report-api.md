# Contract: Financial & Operational Report API

**File**: `specs/037-vehicle-history-financial-accountant-reports/contracts/financial-report-api.md`  
**Domain**: Central de Relatórios Financeiros e Operacionais de Histórico Veicular  

---

## 1. Consulta dos Dados Consolidados da Central

### `getVehicleHistoryReportData`

Função server-side responsável por agregar os dados do período para os cards de topo e tabelas da aba `historico-veicular`.

#### Assinatura
```typescript
export async function getVehicleHistoryReportData(
  filters: VehicleHistoryReportFilters
): Promise<VehicleHistoryReportResult>;
```

#### Filtros de Consulta (`VehicleHistoryReportFilters`)
```typescript
export interface VehicleHistoryReportFilters {
  startDate: string;              // ISO String ou YYYY-MM-DD (America/Sao_Paulo)
  endDate: string;                // ISO String ou YYYY-MM-DD (America/Sao_Paulo)
  coverageType?: 'all' | 'mercadopago' | 'platform_credit' | 'free';
  reportOrigin?: 'all' | 'live' | 'cache' | 'mock';
  consultationStatus?: 'all' | 'completed' | 'processing' | 'failed';
  paymentStatus?: 'all' | 'approved' | 'pending' | 'rejected' | 'refunded';
  refundStatus?: 'all' | 'none' | 'pending' | 'confirmed';
  customerId?: string;
  plate?: string;
  page?: number;
  pageSize?: number;
}
```

#### Resposta Consolidada (`VehicleHistoryReportResult`)
```typescript
export interface VehicleHistoryReportResult {
  dateRange: {
    startDate: string;
    endDate: string;
    timezone: 'America/Sao_Paulo';
  };
  
  // Cards Superiores (KPIs do Período)
  summary: {
    grossRevenueCents: number;          // Soma de pagamentos Mercado Pago com status = 'approved'
    confirmedRefundsCents: number;      // Soma de payment_refunds com status = 'confirmed'
    netRevenueCents: number;            // grossRevenueCents - confirmedRefundsCents
    totalApiBrasilCostCents: number;    // Soma de custos live cobrados (actual_cost_cents)
    estimatedGrossMarginCents: number;  // netRevenueCents - totalApiBrasilCostCents
    marginPercentage: number;
    
    totalConsultationsStarted: number;
    totalConsultationsCompleted: number;
    totalLiveChargedCalls: number;
    totalCacheHits: number;
    totalCreditConsultations: number;
    totalCreditsConsumed: number;
    totalCreditsReturned: number;
    totalPermanentFailures: number;
    totalPendingRefundsCount: number;
    totalPendingRefundsAmountCents: number;
    
    // Indicadores Operacionais
    completionRatePercentage: number;
    cacheHitRatePercentage: number;
    averageTicketCents: number;
    averageLiveCostCents: number;
  };

  // Linhas Detalhadas Paginadas (Aba 1: Consultas e Custos)
  consultations: {
    items: VehicleHistoryConsultationRow[];
    total: number;
    page: number;
    pageSize: number;
  };

  // Linhas Detalhadas Paginadas (Aba 2: Pagamentos e Estornos)
  payments: {
    items: VehicleHistoryPaymentRow[];
    total: number;
    page: number;
    pageSize: number;
  };

  // Linhas Detalhadas Paginadas (Aba 3: Pacotes e Créditos)
  creditPackages: {
    items: VehicleHistoryCreditPackageRow[];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

---

## 2. Tipos das Linhas das Tabelas

### Aba 1: Consultas e Custo (`VehicleHistoryConsultationRow`)
```typescript
export interface VehicleHistoryConsultationRow {
  consultationId: string;
  shortId: string;
  consultedAt: string;
  plate: string;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  coverageType: 'mercadopago' | 'platform_credit' | 'free' | 'legacy_unknown';
  consultationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  reportOrigin: 'live' | 'cache' | 'mock';
  providerHttpStatus: number | null;
  costSnapshotCents: number;
  actualCostCents: number;
  costStatus: 'not_applicable' | 'pending' | 'incurred' | 'not_incurred' | 'unknown' | 'reversed';
  publicPriceSnapshotCents: number;
  estimatedMarginCents: number | null;
  deliveryAttempts: number;
  hasReportData: boolean;
}
```

### Aba 2: Pagamentos e Estornos (`VehicleHistoryPaymentRow`)
```typescript
export interface VehicleHistoryPaymentRow {
  transactionId: string;
  shortId: string;
  paymentCreatedAt: string;
  mpPaymentIdMasked: string | null;
  customerName: string;
  customerEmail: string;
  plate: string;
  grossAmountCents: number;
  paymentStatus: string;
  refundStatus: 'none' | 'requested' | 'pending' | 'confirmed' | 'failed';
  refundAmountCents: number;
  netRevenueCents: number;
  refundReasonSafe: string | null;
  coverageType: string;
}
```

### Aba 3: Pacotes e Créditos (`VehicleHistoryCreditPackageRow`)
```typescript
export interface VehicleHistoryCreditPackageRow {
  packageId: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  packageType: string;
  grantedAt: string;
  paymentChannel: string;
  totalPaidCents: number | null;
  creditsGranted: number;
  creditsRemaining: number;
  creditsReserved: number;
  creditsConsumed: number;
  creditsReleased: number;
  status: 'active' | 'exhausted' | 'expired' | 'suspended' | 'cancelled';
  totalProviderCostCents: number;
  estimatedPackageMarginCents: number | null;
}
```
