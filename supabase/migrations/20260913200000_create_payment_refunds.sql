-- ============================================================
-- Migration: 20260913200000_create_payment_refunds
-- Description: Create payment_refunds table for immutable tracking
--              of Mercado Pago refund requests, statuses, and idempotency.
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_payment_refunds_consultation
  ON public.payment_refunds (consultation_id);

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

DROP POLICY IF EXISTS "Admins can view payment refunds" ON public.payment_refunds;
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
