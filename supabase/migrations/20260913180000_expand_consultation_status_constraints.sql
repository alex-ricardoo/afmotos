-- ============================================================
-- Migration: 20260913180000_expand_consultation_status_constraints
-- Description: Expand check constraints on customer_plate_consultations.status
--              to include resilient delivery lifecycle states:
--              'retry_scheduled', 'failed_permanent', 'refund_pending', 'manual_review'.
-- ============================================================

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
