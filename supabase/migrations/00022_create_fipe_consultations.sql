-- Migration: 00022_create_fipe_consultations.sql
-- Description: Criação da tabela de snapshots de consultas FIPE e políticas de segurança RLS

CREATE TABLE IF NOT EXISTS public.fipe_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuário administrativo que executou a consulta
  created_by uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE RESTRICT,

  -- Vínculo opcional com uma motocicleta do inventário
  motorcycle_id uuid
    REFERENCES public.motorcycles(id)
    ON DELETE SET NULL,

  -- Informações do provedor
  provider text NOT NULL DEFAULT 'fipex',
  provider_label text NOT NULL DEFAULT 'fipeX',

  -- Tipo de veículo
  vehicle_type_id text NOT NULL,
  vehicle_type_label text,

  -- Marca
  brand_id text,
  brand_name text NOT NULL,

  -- Modelo
  model_id text,
  model_name text NOT NULL,
  version_name text,

  -- Ano do modelo
  model_year integer,
  is_zero_km boolean NOT NULL DEFAULT false,

  -- Combustível
  fuel_id text,
  fuel_name text,
  fuel_acronym text,

  -- Período de referência FIPE
  reference_period_id text,
  reference_month integer CHECK (reference_month IS NULL OR (reference_month >= 1 AND reference_month <= 12)),
  reference_year integer,
  reference_label text,

  -- Código e valor FIPE
  fipe_code text,
  fipe_price numeric(12, 2) CHECK (fipe_price IS NULL OR fipe_price >= 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),

  -- Snapshots de auditoria
  query_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Notas internas do admin
  notes text,

  -- Metadados temporais
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comentários explicativos
COMMENT ON TABLE public.fipe_consultations IS 'Snapshots de consultas de referência FIPE via fipeX para apoio à precificação e negociação.';
COMMENT ON COLUMN public.fipe_consultations.fipe_price IS 'Preço de referência em reais (convertido de centavos).';
COMMENT ON COLUMN public.fipe_consultations.query_payload IS 'Parâmetros utilizados na consulta para reconsulta.';
COMMENT ON COLUMN public.fipe_consultations.response_snapshot IS 'Snapshot completo da resposta da API externa para auditoria.';

-- Índices de consulta e performance
CREATE INDEX IF NOT EXISTS fipe_consultations_created_by_idx
  ON public.fipe_consultations (created_by);

CREATE INDEX IF NOT EXISTS fipe_consultations_motorcycle_id_idx
  ON public.fipe_consultations (motorcycle_id);

CREATE INDEX IF NOT EXISTS fipe_consultations_brand_model_idx
  ON public.fipe_consultations (brand_name, model_name);

CREATE INDEX IF NOT EXISTS fipe_consultations_created_at_idx
  ON public.fipe_consultations (created_at DESC);

-- Trigger para atualização automática de updated_at
DROP TRIGGER IF EXISTS update_fipe_consultations_updated_at ON public.fipe_consultations;
CREATE TRIGGER update_fipe_consultations_updated_at
  BEFORE UPDATE ON public.fipe_consultations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.fipe_consultations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS exclusivas para administradores
DROP POLICY IF EXISTS admin_select_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_select_fipe_consultations
  ON public.fipe_consultations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS admin_insert_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_insert_fipe_consultations
  ON public.fipe_consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS admin_update_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_update_fipe_consultations
  ON public.fipe_consultations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND created_by = auth.uid())
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS admin_delete_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_delete_fipe_consultations
  ON public.fipe_consultations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
