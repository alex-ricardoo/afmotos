CREATE TABLE IF NOT EXISTS public.motorcycle_technical_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id UUID NOT NULL REFERENCES public.motorcycles(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  sheet_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED')),
  source_summary JSONB,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  pdf_storage_path TEXT,
  pdf_generated_at TIMESTAMPTZ,
  pdf_version INTEGER NOT NULL DEFAULT 1 CHECK (pdf_version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motorcycle_technical_sheets_motorcycle_id
  ON public.motorcycle_technical_sheets(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_motorcycle_technical_sheets_status
  ON public.motorcycle_technical_sheets(status);
CREATE INDEX IF NOT EXISTS idx_motorcycle_technical_sheets_approved_at
  ON public.motorcycle_technical_sheets(approved_at);

CREATE TABLE IF NOT EXISTS public.motorcycle_technical_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_sheet_id UUID NOT NULL REFERENCES public.motorcycle_technical_sheets(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('FABRICANTE', 'MANUAL', 'CATALOGO', 'ADMIN', 'CADASTRO')),
  title TEXT NOT NULL,
  source_url TEXT,
  source_file_path TEXT,
  manufacturer TEXT,
  model_reference TEXT,
  model_year INTEGER,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT motorcycle_technical_sources_https_url CHECK (source_url IS NULL OR source_url ~ '^https://')
);

CREATE INDEX IF NOT EXISTS idx_motorcycle_technical_sources_sheet_id
  ON public.motorcycle_technical_sources(technical_sheet_id);

DROP TRIGGER IF EXISTS update_motorcycle_technical_sheets_updated_at ON public.motorcycle_technical_sheets;
CREATE TRIGGER update_motorcycle_technical_sheets_updated_at
  BEFORE UPDATE ON public.motorcycle_technical_sheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycle_technical_sources_updated_at ON public.motorcycle_technical_sources;
CREATE TRIGGER update_motorcycle_technical_sources_updated_at
  BEFORE UPDATE ON public.motorcycle_technical_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.motorcycle_technical_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycle_technical_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage motorcycle technical sheets" ON public.motorcycle_technical_sheets;
CREATE POLICY "Admins manage motorcycle technical sheets"
  ON public.motorcycle_technical_sheets FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage motorcycle technical sources" ON public.motorcycle_technical_sources;
CREATE POLICY "Admins manage motorcycle technical sources"
  ON public.motorcycle_technical_sources FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
