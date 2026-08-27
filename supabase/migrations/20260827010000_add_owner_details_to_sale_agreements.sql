ALTER TABLE public.sale_agreements
  ADD COLUMN IF NOT EXISTS owner_rg text,
  ADD COLUMN IF NOT EXISTS owner_address text,
  ADD COLUMN IF NOT EXISTS owner_phone text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sale_agreements_owner_phone_check'
      AND conrelid = 'public.sale_agreements'::regclass
  ) THEN
    ALTER TABLE public.sale_agreements
      ADD CONSTRAINT sale_agreements_owner_phone_check
      CHECK (owner_phone IS NULL OR owner_phone ~ '^[0-9]{10,11}$');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
