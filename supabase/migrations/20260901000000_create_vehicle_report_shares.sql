-- Migration: 20260901000000_create_vehicle_report_shares.sql
-- Description: Tabelas de compartilhamento público seguro de laudos veiculares, índices estratégicos, RLS e auditoria de acessos.

CREATE TABLE IF NOT EXISTS public.vehicle_report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vínculo com a Consulta Veicular
  consultation_id uuid NOT NULL 
    REFERENCES public.vehicle_plate_consultations(id) 
    ON DELETE CASCADE,

  -- Token de Acesso Seguro (Hash Criptográfico SHA-256)
  token_hash text NOT NULL UNIQUE,

  -- Status e Ciclo de Vida do Compartilhamento
  status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'revoked', 'expired', 'disabled')),

  -- Auditoria de Criação
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Auditoria de Revogação
  revoked_at timestamptz NULL,
  revoked_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason text NULL,

  -- Suporte à Expiração Futura (Opcional no MVP, padrão NULL = sem expiração)
  expires_at timestamptz NULL,

  -- Métricas Agregadas de Consumo Público
  last_accessed_at timestamptz NULL,
  access_count integer NOT NULL DEFAULT 0,

  last_pdf_download_at timestamptz NULL,
  pdf_download_count integer NOT NULL DEFAULT 0,

  last_print_at timestamptz NULL,
  print_count integer NOT NULL DEFAULT 0,

  -- Metadados Extensíveis
  metadata jsonb NULL DEFAULT '{}'::jsonb,

  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comentários da Tabela e Colunas
COMMENT ON TABLE public.vehicle_report_shares IS 'Links públicos de compartilhamento de laudos veiculares protegidos por token hash de alta entropia.';
COMMENT ON COLUMN public.vehicle_report_shares.token_hash IS 'Hash SHA-256 (64 caracteres hexadecimais) do token de compartilhamento. O token puro nunca é persistido.';
COMMENT ON COLUMN public.vehicle_report_shares.status IS 'Estado atual do link: active (válido), revoked (cancelado pelo admin), expired (expirado).';
COMMENT ON COLUMN public.vehicle_report_shares.access_count IS 'Total de visualizações da página pública pelo cliente.';
COMMENT ON COLUMN public.vehicle_report_shares.pdf_download_count IS 'Total de downloads do laudo em formato PDF.';

-- Trigger para updated_at automático
DROP TRIGGER IF EXISTS update_vehicle_report_shares_updated_at ON public.vehicle_report_shares;
CREATE TRIGGER update_vehicle_report_shares_updated_at
  BEFORE UPDATE ON public.vehicle_report_shares
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Índices B-Tree Estratégicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_vrs_token_hash 
  ON public.vehicle_report_shares (token_hash);

CREATE INDEX IF NOT EXISTS idx_vrs_consultation_id 
  ON public.vehicle_report_shares (consultation_id);

CREATE INDEX IF NOT EXISTS idx_vrs_status_created_at 
  ON public.vehicle_report_shares (status, created_at DESC);

-- Índice Único Parcial: Garante no máximo 1 link ativo por consulta no MVP
CREATE UNIQUE INDEX IF NOT EXISTS idx_vrs_one_active_per_consultation 
  ON public.vehicle_report_shares (consultation_id) 
  WHERE (status = 'active');

-- Tabela de Eventos de Auditoria
CREATE TABLE IF NOT EXISTS public.vehicle_report_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NULL 
    REFERENCES public.vehicle_report_shares(id) 
    ON DELETE CASCADE,
  consultation_id uuid NOT NULL 
    REFERENCES public.vehicle_plate_consultations(id) 
    ON DELETE CASCADE,

  event_type text NOT NULL CHECK (
    event_type IN (
      'SHARE_CREATED',
      'SHARE_OPENED',
      'SHARE_PDF_REQUESTED',
      'SHARE_PRINT_REQUESTED',
      'SHARE_REVOKED',
      'SHARE_INVALID_ATTEMPT'
    )
  ),

  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text NULL,                               -- SHA-256 saltado do IP para conformidade LGPD
  user_agent_category text NULL DEFAULT 'OTHER',  -- 'MOBILE' | 'DESKTOP' | 'BOT' | 'OTHER'
  is_success boolean NOT NULL DEFAULT true,
  event_data jsonb NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_vrse_share_id 
  ON public.vehicle_report_share_events (share_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vrse_consultation_id 
  ON public.vehicle_report_share_events (consultation_id, created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicle_report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_report_share_events ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Administradores Autenticados
DROP POLICY IF EXISTS "Admins can view report shares" ON public.vehicle_report_shares;
CREATE POLICY "Admins can view report shares"
  ON public.vehicle_report_shares
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert report shares" ON public.vehicle_report_shares;
CREATE POLICY "Admins can insert report shares"
  ON public.vehicle_report_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() 
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update report shares" ON public.vehicle_report_shares;
CREATE POLICY "Admins can update report shares"
  ON public.vehicle_report_shares
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete report shares" ON public.vehicle_report_shares;
CREATE POLICY "Admins can delete report shares"
  ON public.vehicle_report_shares
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Políticas para vehicle_report_share_events
DROP POLICY IF EXISTS "Admins can view share events" ON public.vehicle_report_share_events;
CREATE POLICY "Admins can view share events"
  ON public.vehicle_report_share_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Anyone can insert share events" ON public.vehicle_report_share_events;
CREATE POLICY "Anyone can insert share events"
  ON public.vehicle_report_share_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Políticas de Leitura Pública para Links Ativos
DROP POLICY IF EXISTS "Public can view active report shares" ON public.vehicle_report_shares;
CREATE POLICY "Public can view active report shares"
  ON public.vehicle_report_shares
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Public can view consultations with active share" ON public.vehicle_plate_consultations;
CREATE POLICY "Public can view consultations with active share"
  ON public.vehicle_plate_consultations
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicle_report_shares
      WHERE vehicle_report_shares.consultation_id = vehicle_plate_consultations.id
        AND vehicle_report_shares.status = 'active'
    )
  );

