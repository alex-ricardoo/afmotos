# Data Model: Reimplementação do Pagamento Mercado Pago no padrão Moura’s Pizzas

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**Status**: Complete  

---

## 1. Tabelas do Banco de Dados (Supabase / PostgreSQL)

### 1.1 `payment_transactions`

Armazena o histórico auditável de cada transação de pagamento iniciada no sistema.

| Coluna | Tipo | Nulo | Descrição |
|---|---|---|---|
| `id` | `uuid` | Não | Chave primária (gerada via `gen_random_uuid()`) |
| `consultation_id` | `uuid` | Não | Chave estrangeira para `customer_plate_consultations.id` |
| `user_id` | `uuid` | Não | Chave estrangeira para `auth.users.id` |
| `provider` | `text` | Não | Provedor de pagamento (`'mercadopago'`) |
| `provider_adapter` | `text` | Sim | Adapter utilizado no processamento (`'v2'` ou `'v3'`) |
| `mp_payment_id` | `text` | Sim | ID numérico retornado pelo Mercado Pago (ex.: `'1234567890'`) |
| `amount` | `numeric(10,2)` | Não | Valor cobrado em Reais (ex.: `49.99`) |
| `currency` | `text` | Não | Moeda da transação (`'BRL'`) |
| `payment_method` | `text` | Não | Método de pagamento (`'credit_card'`, `'pix'`, etc.) |
| `payment_method_id` | `text` | Sim | Bandeira ou canal (`'master'`, `'visa'`, `'pix'`) |
| `installments` | `integer` | Não | Número de parcelas (padrão: `1`) |
| `status` | `text` | Não | Status interno da transação (ver máquina de estados abaixo) |
| `status_detail` | `text` | Sim | Detalhe retornado pelo Mercado Pago (ex.: `'accredited'`, `'cc_rejected_call_for_authorize'`) |
| `idempotency_key` | `uuid` | Não | Chave de idempotência única enviada ao Mercado Pago |
| `issuer_id` | `integer` | Sim | ID do emissor bancário retornado pelo Brick (se houver) |
| `metadata` | `jsonb` | Sim | Metadados não sensíveis (IDs de rastreamento, clientObservability) |
| `error_message` | `text` | Sim | Mensagem de erro amigável/higienizada em caso de falha |
| `created_at` | `timestamptz` | Não | Timestamp de criação do registro |
| `updated_at` | `timestamptz` | Não | Timestamp da última atualização de status |

#### Estados Válidos (`status`):
- `pending`: Transação iniciada antes da resposta do provedor.
- `approved`: Pagamento aprovado e capturado com sucesso pelo Mercado Pago.
- `authorized`: Pagamento pré-autorizado pela adquirente.
- `in_process`: Pagamento em análise manual ou aguardando compensação.
- `in_mediation`: Transação em disputa/mediação.
- `rejected`: Pagamento recusado pela operadora do cartão ou antifraude.
- `cancelled`: Transação cancelada pelo usuário ou sistema.
- `refunded`: Transação estornada com sucesso no provedor.
- `charged_back`: Transação objeto de chargeback pelo titular do cartão.
- `provider_error`: Falha técnica do Mercado Pago (ex.: HTTP 500, timeout).
- `pending_reconciliation`: Estado ambíguo aguardando validação por webhook ou job.

---

### 1.2 `customer_plate_consultations`

Representa a consulta de placa veicular solicitada pelo cliente.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | Chave primária da consulta |
| `user_id` | `uuid` | Chave estrangeira para o cliente autenticado |
| `plate` | `text` | Placa veicular consultada (ex.: `'BRA2E19'`) |
| `status` | `text` | Status da consulta (`'pending_payment'`, `'completed'`, `'failed'`) |
| `payment_status` | `text` | Status financeiro espelhado (`'pending'`, `'paid'`, `'refunded'`, `'failed'`) |
| `amount` | `numeric(10,2)` | Preço acordado na criação da consulta |
| `vehicle_data` | `jsonb` | Dados técnicos retornados pela API Brasil (preenchido após aprovação) |
| `created_at` | `timestamptz` | Criação da consulta |
| `updated_at` | `timestamptz` | Atualização da consulta |

---

## 2. Tipos e Contratos em Memória (TypeScript)

### 2.1 Requisição ao Endpoint (`POST /api/mp/process-payment`)

```typescript
export interface ProcessPaymentRequestBody {
  consultationId: string;
  token: string;
  paymentMethodId: string;
  issuerId?: string | number;
  installments: number;
  payer: {
    identification: {
      type: 'CPF';
      number: string;
    };
  };
  clientObservability?: {
    tokenCreatedAt: number;
    tokenHashTruncated: string;
    submitAttemptNumber: number;
  };
}
```

### 2.2 Respostas do Endpoint (`POST /api/mp/process-payment`)

#### Sucesso (200 OK):
```typescript
export interface ProcessPaymentSuccessResponse {
  success: true;
  transactionId: string;
  paymentId: string;
  status: 'approved';
  statusDetail: string;
  consultationStatus: 'completed';
}
```

#### Pendência (200 OK):
```typescript
export interface ProcessPaymentPendingResponse {
  success: false;
  pending: true;
  transactionId: string;
  paymentId?: string;
  status: 'pending' | 'in_process';
  message: string;
}
```

#### Recusa do Cartão (400 Bad Request):
```typescript
export interface ProcessPaymentRejectedResponse {
  success: false;
  retryable: true;
  transactionId: string;
  status: 'rejected';
  statusDetail?: string;
  message: string;
}
```

#### Erro do Provedor (502 / 500):
```typescript
export interface ProcessPaymentProviderErrorResponse {
  success: false;
  retryable: true;
  transactionId: string;
  status: 'provider_error';
  message: string;
}
```

---

### 2.3 Interface do Provedor de Pagamento (`MercadoPagoPaymentProvider`)

```typescript
export interface CreateCardPaymentInput {
  transactionAmount: number;
  token: string;
  description: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: number;
  payerEmail: string;
  payerCpf: string;
  externalReference: string;
  notificationUrl?: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface CreateCardPaymentResult {
  success: boolean;
  paymentId?: string;
  status: string;
  statusDetail?: string;
  rawStatus?: number;
  error?: {
    type: 'MPServerError' | 'MPClientError' | 'NetworkError' | 'Unknown';
    statusCode?: number;
    message: string;
  };
}

export interface MercadoPagoPaymentProvider {
  readonly version: 'v2' | 'v3';
  createCardPayment(input: CreateCardPaymentInput): Promise<CreateCardPaymentResult>;
  getPayment(paymentId: string): Promise<Record<string, unknown>>;
}
```

---

### 2.4 Snapshot Sanitizado de Auditoria Técnica

```typescript
export interface MercadoPagoPaymentRequestSnapshot {
  snapshotId: string;
  timestamp: string;
  flowId: string;
  route: '/api/mp/process-payment';
  providerAdapter: 'v2' | 'v3';
  sdkVersion: string;
  environment: {
    nodeEnv: string;
    vercelEnv: string;
  };
  credentials: {
    mode: 'test' | 'production' | 'invalid';
    publicKeyFingerprint: string;
    accessTokenFingerprint: string;
  };
  request: {
    transaction_amount: {
      type: 'number';
      value: number;
    };
    token: {
      present: boolean;
      length: number;
      hashTruncated: string;
      ageMs: number;
    };
    payment_method_id: string;
    installments: {
      type: 'number';
      value: number;
    };
    issuer: {
      present: boolean;
      type?: string;
      maskedValue?: string;
      origin?: 'brick';
    };
    payer: {
      email: {
        present: boolean;
        domainOrHash?: string;
      };
      identification: {
        type: 'CPF';
        digitCount: number;
      };
      address: {
        present: boolean;
        keysPresent: string[];
      };
    };
    description: {
      present: boolean;
      length?: number;
    };
    external_reference: {
      present: boolean;
      length?: number;
      hashTruncated?: string;
    };
    metadata: {
      present: boolean;
      keysAndTypes: Array<{ key: string; type: string }>;
    };
    notification_url: {
      present: boolean;
      originAndPath?: string | null;
    };
    nullPaths: string[];
    undefinedPaths: string[];
    bodyKeys: string[];
    requestOptionsKeys: string[];
    idempotency: {
      present: boolean;
      hashTruncated?: string;
      fieldUsed: string;
    };
  };
}
```
