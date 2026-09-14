-- ============================================================
-- Migration: 20260914150000_allow_credit_delivery_jobs
-- Description: Allow consultation_delivery_jobs.transaction_id to be NULL
--              for consultations covered by platform credits (B2B).
--              Ensures delivery jobs can run cleanly without pseudo-transactions
--              in payment_transactions.
-- ============================================================

ALTER TABLE public.consultation_delivery_jobs
  ALTER COLUMN transaction_id DROP NOT NULL;

COMMENT ON COLUMN public.consultation_delivery_jobs.transaction_id IS
  'Foreign key to payment_transactions for Mercado Pago payments. NULL for platform_credit consultations.';
