# Data Model & Migrations: Resilient Delivery & Refunds

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Date**: 2026-09-13

---

## 1. Mapeamento de Entidades Existentes

### 1.1 `payment_transactions` (Reutilizada e Expandida)
- **Tabela existente**: `supabase/migrations/20260912110000_mercadopago_transactions_and_audit.sql`
- **Campos reutilizados**:
  - `id` (UUID, PK)
  - `consultation_id` (UUID, FK `customer_plate_consultations`)
  - `user_id` (UUID, FK `auth.users`)
  - `mp_payment_id` (TEXT, identificador autoritativo no Mercado Pago)
  - `status` (TEXT, status normalizado: `pending`, `approved`, `refunded`, etc.)
  - `transaction_amount` (NUMERIC(10,2))
  - `idempotency_key` (UUID)
  - `refund_status` (TEXT: `none`, `pending`, `refunded`, `failed`)
  - `refund_amount` (NUMERIC(10,2))
  - `refunded_at` (TIMESTAMPTZ)
  - `refund_reason` (TEXT)
  - `mp_refund_id` (TEXT)

### 1.2 `customer_plate_consultations` (Reutilizada e Expandida)
- **Tabela existente**: `supabase/migrations/20260911000000_create_customer_area.sql`
- **Campos reutilizados**:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK `customer_profiles`)
  - `plate` (TEXT)
  - `plate_normalized` (TEXT)
  - `vehicle_data` (JSONB, laudo estruturado persistido)
  - `status` (TEXT: ciclo de vida da consulta)
  - `payment_status` (TEXT: `unpaid`, `paid`, `refunded`)
  - `latest_payment_transaction_id` (UUID)
  - `source_consultation_id` (UUID, FK `vehicle_plate_consultations`)
  - `lookup_error_message` (TEXT)
  - `auto_refund_attempted` (BOOLEAN)

---

## 2. Novas Estruturas & Migrations Necessárias

### Migration 1: `20260913180000_expand_consultation_status_constraints.sql`
Expande os valores permitidos para os estados de entrega em `customer_plate_consultations.status`:

```sql
-- Expande status da consulta para contemplar o ciclo completo de entrega e estorno
ALTER TABLE public.customer_plate_consultations
  DROP CONSTRAINT IF EXISTS customer_plate_consultations_status_check;

ALTER TABLE public.customer_plate_consultations
  ADD CONSTRAINT customer_plate_consultations_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'processing',
    'completed',
    'retry_scheduled',
    'failed',
    'failed_permanent',
    'refund_pending',
    'refunded',
    'manual_review'
  ));
```

---

### Migration 2: `20260913190000_create_consultation_delivery_jobs.sql`
Cria a tabela de fila de entrega persistida, índices parciais e RPC de claim atômico:

```sql
CREATE TABLE IF NOT EXISTS public.consultation_delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'vehicle_report_delivery',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'retry_scheduled', 'failed_permanent')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ NULL,
  locked_by TEXT NULL,
  lock_expires_at TIMESTAMPTZ NULL,
  provider TEXT NOT NULL DEFAULT 'apibrasil',
  last_error_code TEXT NULL,
  last_error_message_safe TEXT NULL,
  last_http_status INTEGER NULL,
  last_failure_class TEXT NULL CHECK (last_failure_class IS NULL OR last_failure_class IN ('transient', 'permanent', 'unknown')),
  last_attempt_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante no máximo 1 job ativo por consulta
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_delivery_job_per_consultation
  ON public.consultation_delivery_jobs (consultation_id)
  WHERE (status IN ('pending', 'processing', 'retry_scheduled'));

-- Índices de busca para worker/cron
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_polling
  ON public.consultation_delivery_jobs (status, next_retry_at)
  WHERE (status IN ('pending', 'retry_scheduled'));

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_locked
  ON public.consultation_delivery_jobs (locked_at)
  WHERE (status = 'processing');

-- Trigger de updated_at
DROP TRIGGER IF EXISTS update_consultation_delivery_jobs_updated_at ON public.consultation_delivery_jobs;
CREATE TRIGGER update_consultation_delivery_jobs_updated_at
  BEFORE UPDATE ON public.consultation_delivery_jobs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Habilita RLS (Acesso exclusivo service-role e admins)
ALTER TABLE public.consultation_delivery_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view delivery jobs"
  ON public.consultation_delivery_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.is_active = true
    )
  );

-- RPC: Atomic Job Claim (Lock Pessimista Concorrente)
CREATE OR REPLACE FUNCTION public.claim_next_delivery_jobs(
  p_worker_id TEXT,
  p_batch_size INTEGER DEFAULT 5,
  p_lock_duration_seconds INTEGER DEFAULT 300
)
RETURNS SETOF public.consultation_delivery_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires TIMESTAMPTZ := v_now + (p_lock_duration_seconds || ' seconds')::interval;
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT id
    FROM public.consultation_delivery_jobs
    WHERE
      (
        (status IN ('pending', 'retry_scheduled') AND next_retry_at <= v_now)
        OR
        (status = 'processing' AND lock_expires_at < v_now) -- Recupera job abandonado / lease expirado
      )
    ORDER BY next_retry_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.consultation_delivery_jobs j
  SET
    status = 'processing',
    locked_at = v_now,
    locked_by = p_worker_id,
    lock_expires_at = v_expires,
    last_attempt_at = v_now,
    attempt_count = j.attempt_count + 1,
    updated_at = v_now
  FROM claimable
  WHERE j.id = claimable.id
  RETURNING j.*;
END;
$$;
```

---

### Migration 3: `20260913200000_create_payment_refunds.sql`
Cria a tabela imutável de rastreamento de estornos e suas regras:

```sql
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  provider_payment_id TEXT NOT NULL,
  provider_refund_id TEXT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'pending', 'confirmed', 'failed', 'manual_review')),
  reason_code TEXT NOT NULL,
  reason_safe TEXT NOT NULL,
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  request_attempts INTEGER NOT NULL DEFAULT 0,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  last_error_code TEXT NULL,
  last_error_safe TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Impede mais de um refund ativo ou aprovado para a mesma transação
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_refund_per_transaction
  ON public.payment_refunds (transaction_id)
  WHERE (status IN ('requested', 'pending', 'confirmed'));

CREATE INDEX IF NOT EXISTS idx_payment_refunds_provider_payment
  ON public.payment_refunds (provider_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_status
  ON public.payment_refunds (status);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS update_payment_refunds_updated_at ON public.payment_refunds;
CREATE TRIGGER update_payment_refunds_updated_at
  BEFORE UPDATE ON public.payment_refunds
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- RLS para payment_refunds (Exclusivo Admins / Service Role)
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment refunds"
  ON public.payment_refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.is_active = true
    )
  );
```
