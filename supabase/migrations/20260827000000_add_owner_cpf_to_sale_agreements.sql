ALTER TABLE public.sale_agreements
  ADD COLUMN IF NOT EXISTS owner_cpf text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sale_agreements_owner_cpf_check'
      AND conrelid = 'public.sale_agreements'::regclass
  ) THEN
    ALTER TABLE public.sale_agreements
      ADD CONSTRAINT sale_agreements_owner_cpf_check
      CHECK (owner_cpf IS NULL OR owner_cpf ~ '^[0-9]{11}$');
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
