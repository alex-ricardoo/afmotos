CREATE TABLE IF NOT EXISTS public.sale_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid,
  sell_request_id uuid NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
  owner_cpf text NOT NULL CHECK (owner_cpf ~ '^[0-9]{11}$'),
  commission_percentage numeric(5,2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  commission_value numeric(12,2) NOT NULL CHECK (commission_value >= 0),
  expected_sale_value numeric(12,2) NOT NULL CHECK (expected_sale_value > 0),
  pdf_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'signed'))
);

ALTER TABLE public.sale_agreements
  ADD COLUMN IF NOT EXISTS owner_cpf text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_agreements_owner_cpf_check'
  ) THEN
    ALTER TABLE public.sale_agreements
      ADD CONSTRAINT sale_agreements_owner_cpf_check CHECK (owner_cpf IS NULL OR owner_cpf ~ '^[0-9]{11}$');
  END IF;
END $$;

ALTER TABLE public.sell_requests
  ADD COLUMN IF NOT EXISTS request_kind text NOT NULL DEFAULT 'DIRECT_SALE'
  CHECK (request_kind IN ('ANNOUNCEMENT', 'DIRECT_SALE'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'proposals'
  ) THEN
    ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS status text;
  END IF;
END $$;

ALTER TABLE public.sale_agreements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS sale_agreements_sell_request_id_idx
  ON public.sale_agreements (sell_request_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'sale_agreements_sale_id_fkey'
    ) THEN
      ALTER TABLE public.sale_agreements
        ADD CONSTRAINT sale_agreements_sale_id_fkey
        FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE POLICY "Admins can manage sale agreements" ON public.sale_agreements
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read agreements bucket" ON storage.objects
FOR SELECT
USING (bucket_id = 'agreements' AND (public.is_admin() OR owner = auth.uid()));

CREATE POLICY "Admins can write agreements bucket" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'agreements' AND public.is_admin());

CREATE POLICY "Admins can update agreements bucket" ON storage.objects
FOR UPDATE
USING (bucket_id = 'agreements' AND public.is_admin())
WITH CHECK (bucket_id = 'agreements' AND public.is_admin());

CREATE POLICY "Admins can delete agreements bucket" ON storage.objects
FOR DELETE
USING (bucket_id = 'agreements' AND public.is_admin());

INSERT INTO storage.buckets (id, name, public)
SELECT 'agreements', 'agreements', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'agreements');
