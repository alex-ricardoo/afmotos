# Contract: Annual Accountant Report API

**File**: `specs/037-vehicle-history-financial-accountant-reports/contracts/annual-accountant-report-api.md`  
**Domain**: Informe Anual e Demonstrativo Contábil de Histórico Veicular  

---

## 1. Consulta do Demonstrativo Anual

### `getVehicleHistoryAnnualReport`

Gera o relatório gerencial e demonstrativo analítico de um ano-calendário completo (ex.: 2026), agrupando métricas anuais e distribuição mês a mês para suporte à contabilidade e fechamento fiscal.

#### Assinatura
```typescript
export async function getVehicleHistoryAnnualReport(
  params: AnnualReportParams
): Promise<AnnualReportResult>;
```

#### Input (`AnnualReportParams`)
```typescript
export interface AnnualReportParams {
  year: number;                    // Ex: 2026
  includeMockTests?: boolean;      // Default: false (estritamente excluídos por padrão)
}
```

#### Output (`AnnualReportResult`)
```typescript
export interface AnnualReportResult {
  metadata: {
    reportYear: number;
    generatedAt: string;          // ISO 8601
    timezone: 'America/Sao_Paulo';
    generatedByAdminId: string;
    generatedByAdminName: string;
    isMockIncluded: boolean;
    disclaimer: string;
  };

  // Consolidação Anual Geral
  annualSummary: {
    grossGatewayRevenueCents: number;       // Receita bruta Mercado Pago aprovada
    confirmedRefundsCents: number;          // (-) Estornos confirmados
    netGatewayRevenueCents: number;          // (=) Receita líquida Mercado Pago
    
    externalPackagesRevenueCents: number;   // Receitas comerciais informadas de pacotes
    totalEstimatedRevenueCents: number;     // netGatewayRevenueCents + externalPackagesRevenueCents
    
    totalApiBrasilCostCents: number;        // Custo total live incorrido
    estimatedGrossMarginCents: number;      // totalEstimatedRevenueCents - totalApiBrasilCostCents
    
    totalCompletedConsultations: number;
    totalLiveChargedConsultations: number;
    totalCacheConsultations: number;
    averageCostPerLiveLookupCents: number;
    
    // Créditos B2B no Ano
    creditsGrantedAnnual: number;
    creditsConsumedAnnual: number;
    creditsReleasedAnnual: number;
    outstandingCreditBalanceYearEnd: number;
    
    pendingRefundsYearEndCount: number;
    pendingRefundsYearEndAmountCents: number;
  };

  // Grade Mensal (Janeiro a Dezembro)
  monthlyBreakdown: AnnualReportMonthItem[];
}

export interface AnnualReportMonthItem {
  month: number;                  // 1 a 12
  monthLabel: string;             // 'Janeiro', 'Fevereiro', etc.
  grossRevenueCents: number;
  confirmedRefundsCents: number;
  netRevenueCents: number;
  packageRevenueCents: number;
  apiBrasilCostCents: number;
  estimatedMarginCents: number;
  totalConsultations: number;
  liveCallsCount: number;
  cacheHitsCount: number;
  creditsConsumed: number;
}
```

---

## 2. Disclaimer Mandatório do Documento Contábil

Todo informe anual, seja renderizado em tela, impresso ou exportado em PDF/CSV, deve conter obrigatoriamente a seguinte declaração:

> **AVISO LEGAL DE APOIO GERENCIAL**:  
> Este documento é um relatório gerencial de apoio à organização financeira e contábil da AF Motos.  
> Não substitui notas fiscais (NFS-e), livros fiscais, extratos bancários de conta corrente, conciliação financeira bancária ou declaração tributária oficial perante os órgãos fazendários.  
> Não constitui apuração fiscal de impostos nem orientação jurídica.  
> Valide toda a escrituração e apuração de tributos diretamente com seu contador responsável.
