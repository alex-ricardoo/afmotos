ALTER TABLE public.sell_requests
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_complement text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sell_requests_postal_code_pe_check'
      AND conrelid = 'public.sell_requests'::regclass
  ) THEN
    ALTER TABLE public.sell_requests
      ADD CONSTRAINT sell_requests_postal_code_pe_check
      CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{8}$');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
