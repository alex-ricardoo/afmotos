# Data Model: Mercado Pago Checkout Pro

**Feature**: `028-mercadopago-checkout-pro`  
**Date**: 2026-09-12  
**Status**: Ready  

---

## 1. Visão Geral e Governança de Dados

A arquitetura de dados do Checkout Pro foi desenhada para **reaproveitar integralmente a estrutura prévia não destrutiva** criada nas migrações do Supabase, sem necessidade de recriação de tabelas e sem risco de perda de registros de auditoria financeira.

Tabelas do ecossistema:
1. `public.payment_transactions` (registros de transações financeiras e preferências)
2. `public.webhook_events` (auditoria, assinatura e idempotência de eventos)
3. `public.consultation_audit_logs` (trilha imutável de ciclo de vida das consultas)
4. `public.customer_plate_consultations` (entidade de negócio da consulta veicular)

---

## 2. Esquema Detalhado das Entidades

### 2.1 `public.payment_transactions`

Armazena cada tentativa e ciclo de vida do pagamento.

| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave primária da transação |
| `consultation_id` | `UUID` | NÃO | - | FK para `customer_plate_consultations(id)` ON DELETE CASCADE |
| `user_id` | `UUID` | NÃO | - | FK para `auth.users(id)` ON DELETE CASCADE |
| `mp_preference_id` | `TEXT` | SIM | NULL | ID da preferência Checkout Pro retornada pelo Mercado Pago |
| `mp_payment_id` | `TEXT` | SIM | NULL | ID definitivo do pagamento liquidado no Mercado Pago (UNIQUE) |
| `status` | `TEXT` | NÃO | `'pending'` | Estado da transação (conforme check constraint) |
| `status_detail` | `TEXT` | SIM | NULL | Detalhe textual do status fornecido pelo provedor ou sistema |
| `payment_method_id` | `TEXT` | SIM | `'checkout_pro'` | Identificador do método (ex.: `pix`, `master`, `visa`) |
| `payment_type_id` | `TEXT` | SIM | `'checkout_pro'` | Tipo do pagamento (ex.: `credit_card`, `bank_transfer`) |
| `transaction_amount` | `NUMERIC(10,2)` | NÃO | - | Valor canônico cobrado da consulta (em BRL, >= 0) |
| `net_received_amount` | `NUMERIC(10,2)` | SIM | NULL | Valor líquido recebido após taxas do provedor |
| `installments` | `INTEGER` | NÃO | 1 | Quantidade de parcelas escolhida pelo cliente |
| `payer_email` | `TEXT` | SIM | NULL | E-mail do pagador registrado no provedor |
| `idempotency_key` | `UUID` | NÃO | `gen_random_uuid()` | Chave única de idempotência da tentativa (UNIQUE) |
| `failure_code` | `TEXT` | SIM | NULL | Código de falha normalizado em caso de rejeição/erro |
| `failure_message_safe` | `TEXT` | SIM | NULL | Mensagem amigável de erro para exibição segura ao usuário |
| `refund_status` | `TEXT` | NÃO | `'none'` | Status de estorno (`none`, `pending`, `refunded`, `failed`) |
| `refund_amount` | `NUMERIC(10,2)` | SIM | NULL | Valor estornado |
| `refunded_at` | `TIMESTAMPTZ` | SIM | NULL | Data/hora da confirmação do estorno |
| `mp_refund_id` | `TEXT` | SIM | NULL | ID do estorno no Mercado Pago |
| `raw_response` | `JSONB` | SIM | NULL | Cópia higienizada da resposta do provedor (sem segredos) |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Timestamp de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Timestamp de última atualização |

**Check Constraints**:
- `status IN ('pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back', 'provider_error', 'pending_reconciliation')`
- `transaction_amount >= 0`
- `refund_status IN ('none', 'pending', 'refunded', 'failed')`

**Índices**:
- `idx_payment_transactions_consultation` em `(consultation_id)`
- `idx_payment_transactions_user` em `(user_id)`
- `idx_payment_transactions_status` em `(status)`
- `idx_payment_transactions_mp_payment` em `(mp_payment_id)`
- `idx_payment_transactions_idempotency_key` em `(idempotency_key)`
- `idx_payment_transactions_created_at` em `(created_at DESC)`

---

### 2.2 `public.webhook_events`

Registra o histórico assíncrono de notificações para auditoria forense e garantia de processamento idempotente.

| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave primária do evento |
| `event_id` | `TEXT` | SIM | NULL | Identificador único do evento (UNIQUE) |
| `event_type` | `TEXT` | NÃO | - | Tipo de notificação (ex.: `payment`, `payment.updated`) |
| `action` | `TEXT` | SIM | NULL | Ação associada ao evento |
| `mp_resource_id` | `TEXT` | SIM | NULL | ID do recurso referenciado pelo provedor |
| `signature_valid` | `BOOLEAN` | NÃO | `FALSE` | Indicador se a assinatura HMAC-SHA256 foi validada |
| `processing_status` | `TEXT` | NÃO | `'pending'` | Status do processamento (`pending`, `processed`, `ignored`, `failed`) |
| `processing_error` | `TEXT` | SIM | NULL | Resumo do erro caso o processamento falhe |
| `payload` | `JSONB` | NÃO | - | Payload da notificação recebida |
| `headers` | `JSONB` | SIM | NULL | Cabeçalhos relevantes recebidos (sem dados confidenciais) |
| `processed_at` | `TIMESTAMPTZ` | SIM | NULL | Data/hora em que o processamento foi finalizado |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Timestamp de recebimento |

**Índices**:
- `idx_webhook_events_resource` em `(mp_resource_id)`
- `idx_webhook_events_status` em `(processing_status)`
- `idx_webhook_events_created_at` em `(created_at DESC)`

---

### 2.3 `public.consultation_audit_logs`

Trilha de auditoria imutável que documenta quem executou cada mudança e o respectivo evento financeiro ou operacional.

| Coluna | Tipo | Nulo | Default | Descrição |
|---|---|---|---|---|
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave primária do log |
| `consultation_id` | `UUID` | NÃO | - | FK para `customer_plate_consultations(id)` ON DELETE CASCADE |
| `transaction_id` | `UUID` | SIM | NULL | FK para `payment_transactions(id)` ON DELETE SET NULL |
| `actor_id` | `UUID` | SIM | NULL | ID do usuário que desencadeou o evento (se aplicável) |
| `actor_type` | `TEXT` | NÃO | - | Origem da ação: `customer`, `system`, `admin`, `webhook` |
| `event` | `TEXT` | NÃO | - | Nome padronizado do evento (ex.: `preference_created`, `payment_approved`, `report_unlocked`) |
| `details` | `JSONB` | SIM | NULL | Metadados complementares sanitizados |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data/hora do evento |

---

### 2.4 Extensões em `public.customer_plate_consultations`

Campos utilizados para vincular o ciclo de vida da consulta com o pagamento:
- `latest_payment_transaction_id`: `UUID` referenciando `payment_transactions.id`.
- `payment_status`: `'unpaid' | 'paid' | 'refunded'`.
- `status`: `'pending' | 'paid' | 'processing' | 'completed' | 'failed'`.
- `payment_method`: `'pix' | 'credit_card' | 'boleto' | 'checkout_pro'`.
- `payment_date`: `TIMESTAMPTZ`.
- `processed_at`: `TIMESTAMPTZ`.
- `lookup_error_message`: `TEXT`.

---

## 3. Políticas de Segurança em Nível de Linha (RLS)

1. **`payment_transactions`**:
   - `SELECT (auth.uid() = user_id)`: Clientes autenticados podem consultar apenas suas próprias transações.
   - `SELECT (is_admin())`: Administradores autenticados e ativos podem visualizar todas as transações.
   - `INSERT / UPDATE / DELETE`: Bloqueado para usuários anônimos e clientes via API REST pública; inserções e atualizações são restritas ao contexto do servidor via `createAdminClient` (service role) autenticado.

2. **`webhook_events`**:
   - RLS habilitado: restrito exclusivamente a administradores para leitura e service role para escrita.

3. **`consultation_audit_logs`**:
   - `SELECT`: Dono da consulta correspondente ou administradores.
   - `INSERT`: Restrito ao servidor (`service_role`).

---

## 4. Avaliação de Migrações: Necessárias vs Não-Necessárias

### Conclusão de Análise:
**Nenhuma nova migração SQL destrutiva ou de criação de tabelas é necessária.** As tabelas e colunas necessárias já foram aplicadas e validadas através das migrações:
- `20260912110000_mercadopago_transactions_and_audit.sql`
- `20260912170000_add_idempotency_key_to_payment_transactions.sql`
- `20260912180000_add_provider_error_status_to_payment_transactions.sql`

O schema atual possui compatibilidade de 100% com os requisitos do Checkout Pro.
