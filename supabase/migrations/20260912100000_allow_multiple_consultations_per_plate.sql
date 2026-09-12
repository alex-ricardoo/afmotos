-- ============================================================
-- Migration: Allow multiple consultations per plate for customers
-- Allows customers to request fresh updated reports for the same vehicle
-- without overwriting or deleting historical consultation records.
-- ============================================================

ALTER TABLE public.customer_plate_consultations
  DROP CONSTRAINT IF EXISTS unique_customer_plate;

CREATE INDEX IF NOT EXISTS idx_cpc_user_plate_created
  ON public.customer_plate_consultations (user_id, plate_normalized, created_at DESC);
