-- Migration: 20260823000000_add_offer_simulation_to_sell_requests.sql
-- Objetivo: Adicionar colunas tipadas offer_percentage e estimated_offer em public.sell_requests com constraints seguras

ALTER TABLE public.sell_requests
  ADD COLUMN IF NOT EXISTS offer_percentage numeric(5, 2),
  ADD COLUMN IF NOT EXISTS estimated_offer numeric(12, 2);

-- Adicionar constraint de range para offer_percentage (0% a 100%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sell_requests_offer_percentage_range'
  ) THEN
    ALTER TABLE public.sell_requests
      ADD CONSTRAINT sell_requests_offer_percentage_range
      CHECK (offer_percentage IS NULL OR (offer_percentage >= 0 AND offer_percentage <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sell_requests_estimated_offer_nonnegative'
  ) THEN
    ALTER TABLE public.sell_requests
      ADD CONSTRAINT sell_requests_estimated_offer_nonnegative
      CHECK (estimated_offer IS NULL OR estimated_offer >= 0);
  END IF;
END $$;
