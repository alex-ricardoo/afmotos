# Data Model: Webhook Mercado Pago, Reconciliação e Idempotência

**Feature**: `029-mercadopago-webhook-real-signature`  
**Date**: 2026-09-13  
**Status**: Draft  

---

## 1. Entidades Existentes no Supabase

### 1.1. `public.payment_transactions`
Tabela central de liquidação financeira das consultas veiculares.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identificador interno da transação (usado como `external_reference`). |
| `consultation_id` | `UUID` | `NOT NULL, REFERENCES customer_plate_consultations(id)` | Consulta veicular atrelada ao pagamento. |
| `user_id` | `UUID` | `NOT NULL, REFERENCES auth.users(id)` | Cliente proprietário da transação. |
| `mp_payment_id` | `TEXT` | `UNIQUE` | ID numérico oficial do pagamento no Mercado Pago (ex.: `177857907601`). |
| `mp_preference_id` | `TEXT` | Nullable | ID da preferência criada no Checkout Pro. |
| `status` | `TEXT` | `NOT NULL, CHECK (status IN (...))` | Status: `pending`, `approved`, `authorized`, `in_process`, `in_mediation`, `rejected`, `cancelled`, `refunded`, `charged_back`, `provider_error`, `pending_reconciliation`. |
| `status_detail` | `TEXT` | Nullable | Detalhe textual fornecido pelo provedor (ex.: `accredited`, `waiting_transfer`). |
| `payment_method_id` | `TEXT` | Nullable | Método utilizado (ex.: `pix`, `master`, `visa`). |
| `payment_type_id` | `TEXT` | Nullable | Tipo do método (ex.: `credit_card`, `bank_transfer`). |
| `transaction_amount` | `NUMERIC(10,2)` | `NOT NULL, CHECK (transaction_amount >= 0)` | Valor monetário em BRL. |
| `net_received_amount` | `NUMERIC(10,2)` | Nullable | Valor líquido creditado após taxas. |
| `installments` | `INTEGER` | `NOT NULL, DEFAULT 1` | Número de parcelas selecionado pelo cliente. |
| `payer_email` | `TEXT` | Nullable | E-mail do pagador informado ao provedor. |
| `idempotency_key` | `UUID` | `UNIQUE, DEFAULT gen_random_uuid()` | Chave única para chamadas com tolerância a falhas. |
| `failure_code` | `TEXT` | Nullable | Código de erro seguro se rejeitado pelo provedor. |
| `failure_message_safe` | `TEXT` | Nullable | Mensagem amigável para exibição ao usuário. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Data de criação do registro. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Data da última alteração de estado. |

---

### 1.2. `public.webhook_events`
Tabela de auditoria e controle de idempotência das notificações recebidas.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identificador interno do registro de auditoria. |
| `event_id` | `TEXT` | `UNIQUE` | Identificador do evento enviado pelo provedor (`body.id` ou derivado). |
| `event_type` | `TEXT` | `NOT NULL` | Tipo do evento (`payment`, `payment.created`, `payment.updated`). |
| `action` | `TEXT` | Nullable | Ação detalhada (`payment.created`, `payment.updated`). |
| `mp_resource_id` | `TEXT` | Nullable | ID do recurso informado na notificação (`data.id`). |
| `signature_valid` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Indica se a assinatura HMAC-SHA256 foi autenticada. |
| `processing_status` | `TEXT` | `NOT NULL, DEFAULT 'pending'` | `pending`, `processed`, `ignored`, `failed`. |
| `processing_error` | `TEXT` | Nullable | Descrição sanitizada de erro caso o processamento falhe. |
| `payload` | `JSONB` | `NOT NULL` | Payload JSON recebido na notificação. |
| `headers` | `JSONB` | Nullable | Metadados de cabeçalhos (`x-request-id`, `ts`). |
| `processed_at` | `TIMESTAMPTZ` | Nullable | Timestamp de conclusão do processamento. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Timestamp de recebimento da notificação. |

---

### 1.3. `public.customer_plate_consultations`
Tabela da consulta veicular, atualizada atomicamente após a confirmação do pagamento.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identificador da consulta. |
| `plate` | `TEXT` | `NOT NULL` | Placa veicular consultada. |
| `status` | `TEXT` | `NOT NULL` | Ciclo de vida: `pending`, `processing`, `completed`, `failed`. |
| `payment_status` | `TEXT` | `NOT NULL` | Estado do pagamento: `unpaid`, `paid`, `refunded`. |
| `latest_payment_transaction_id` | `UUID` | `REFERENCES payment_transactions(id)` | Transação que liquidou a consulta. |
| `vehicle_data` | `JSONB` | Nullable | Dados completos do laudo retornados pela API Brasil. |

---

### 1.4. `public.consultation_audit_logs`
Trilha de auditoria imutável de eventos operacionais.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Identificador único do log. |
| `consultation_id` | `UUID` | `NOT NULL, REFERENCES customer_plate_consultations(id)` | Consulta auditada. |
| `transaction_id` | `UUID` | `REFERENCES payment_transactions(id)` | Transação vinculada. |
| `actor_id` | `UUID` | Nullable | Usuário autenticado ou nulo para chamadas de sistema/webhook. |
| `actor_type` | `TEXT` | `CHECK (actor_type IN ('customer', 'system', 'admin', 'webhook'))` | Tipo de ator executor. |
| `event` | `TEXT` | `NOT NULL` | Nome do evento auditado (ex.: `webhook_payment_approved`, `reconciliation_payment_approved`). |
| `details` | `JSONB` | Nullable | Metadados estruturados higienizados. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Timestamp do evento. |

---

## 2. Máquina de Estados e Regras de Transição

```text
               ┌───────────────┐
               │    pending    │
               └───────┬───────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌──────────────┐ ┌───────────┐ ┌───────────────┐
│  in_process  │ │  rejected │ │   cancelled   │
└──────┬───────┘ └───────────┘ └───────────────┘
       │
       ▼
┌──────────────┐
│   approved   │ ──> [Executa liberação da consulta exatamente 1x]
└──────┬───────┘
       │
       ├────────────────────────┐
       ▼                        ▼
┌──────────────┐         ┌───────────────┐
│   refunded   │         │  charged_back │
└──────────────┘         └───────────────┘
```

### Regras Mandatórias de Validação de Transição:
1. **Sem Downgrade**: Uma vez que `status === 'approved'`, é terminantemente proibido regredir para `pending`, `in_process`, `rejected` ou `cancelled`.
2. **Atomicidade da Liberação**: A consulta (`customer_plate_consultations`) transita de `unpaid` para `paid` através de trava otimista condicional (`.eq('payment_status', 'unpaid')`), impedindo disparos concorrentes de chamadas veiculares.
3. **Idempotência de Webhook**: Eventos com mesmo `event_id` ou para pagamentos já reconciliados são marcados como `processed` ou `ignored` sem reexecutar mutações de negócio.
