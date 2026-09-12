-- ============================================================
-- Migration: 20260912180000_add_provider_error_status_to_payment_transactions
-- Description: Expand check constraint on payment_transactions.status
--              to include technical provider failure states ('provider_error', 'pending_reconciliation').
-- ============================================================

ALTER TABLE public.payment_transactions
    DROP CONSTRAINT IF EXISTS payment_transactions_status_check;

ALTER TABLE public.payment_transactions
    ADD CONSTRAINT payment_transactions_status_check
    CHECK (status IN (
        'pending',
        'approved',
        'authorized',
        'in_process',
        'in_mediation',
        'rejected',
        'cancelled',
        'refunded',
        'charged_back',
        'provider_error',
        'pending_reconciliation'
    ));
