-- ============================================================
-- Migration: 20260912170000_add_idempotency_key_to_payment_transactions
-- Description: Add idempotency_key, failure_code, and failure_message_safe
--              to payment_transactions for safe Mercado Pago API calls and retries.
-- ============================================================

-- 1. Add columns to payment_transactions
ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS failure_code TEXT,
    ADD COLUMN IF NOT EXISTS failure_message_safe TEXT;

-- 2. Backfill existing records if any have null idempotency_key
UPDATE public.payment_transactions
SET idempotency_key = gen_random_uuid()
WHERE idempotency_key IS NULL;

-- 3. Create index for fast idempotency key lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_idempotency_key
    ON public.payment_transactions(idempotency_key);
