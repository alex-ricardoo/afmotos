-- Migration: 20260830100000_create_vehicle_plate_consultations.sql
-- Description: Criação da tabela híbrida de consultas veiculares com snapshot JSONB, colunas resumidas, índices e RLS.

CREATE TABLE IF NOT EXISTS public.vehicle_plate_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação e Cache
  plate_normalized text NOT NULL,                                -- Ex: 'ABC1234' ou 'BRA2E19' (sem hífens ou espaços)
  plate_display text NOT NULL,                                   -- Ex: 'ABC-1234' ou 'BRA2E19'
  consultation_type text NOT NULL DEFAULT 'veiculos-total',      -- Tipo da consulta (ex: 'veiculos-total', 'fipe-placa')
  provider text NOT NULL DEFAULT 'apibrasil',                    -- Provedor da API ('apibrasil')

  -- Snapshot Imutável da Resposta
  raw_response jsonb NOT NULL,                                   -- Payload integral e bruto recebido do provedor
  response_schema_version text NOT NULL DEFAULT '1.0',           -- Versão do schema retornado pelo provedor

  -- Estado e Auditoria da Execução
  status text NOT NULL CHECK (status IN ('PENDING_CONFIRMATION', 'PROCESSING', 'COMPLETED', 'FAILED', 'CHARGE_STATUS_UNKNOWN')),
  provider_status_code integer NULL,                             -- Código HTTP retornado pelo provedor
  provider_error boolean NOT NULL DEFAULT false,                 -- Flag de erro lógico retornado no payload
  provider_message text NULL,                                    -- Mensagem de status ou erro do provedor

  -- Controle de Ambiente, Custo e Saldo
  mode text NOT NULL CHECK (mode IN ('mock', 'live')),           -- Modo de execução ('mock' ou 'live')
  is_mock boolean NOT NULL DEFAULT true,                         -- True se executado com fixture de teste
  is_chargeable boolean NOT NULL DEFAULT false,                  -- True se a consulta consumiu crédito financeiro
  charged_amount numeric(12,2) NOT NULL DEFAULT 0.00,            -- Valor tarifado em Reais (BRL)
  provider_balance_before numeric(14,3) NULL,                    -- Saldo retornado antes da chamada
  provider_balance_after numeric(14,3) NULL,                     -- Saldo retornado após a chamada
  provider_tax numeric(14,3) NULL,                               -- Taxa específica informada no retorno

  -- Colunas Resumidas para Busca Rápida, Filtros e Badges (Indexáveis)
  vehicle_type text NULL,                                        -- Ex: 'MOTO', 'AUTOMOVEL', 'CAMINHAO'
  brand text NULL,                                               -- Ex: 'HONDA', 'YAMAHA', 'BMW'
  model text NULL,                                               -- Ex: 'CB 600F HORNET', 'MT-07'
  vehicle_description text NULL,                                 -- Descrição completa retornada no cadastro
  year_manufacture integer NULL,                                 -- Ano de fabricação (ex: 2021)
  year_model integer NULL,                                       -- Ano do modelo (ex: 2022)
  color text NULL,                                               -- Cor predominante
  state text NULL,                                               -- UF de emplacamento (ex: 'SP', 'PE')
  city text NULL,                                                -- Município de emplacamento
  chassis_masked text NULL,                                      -- Chassi mascarado para listagem rápida
  renavam_masked text NULL,                                      -- Renavam mascarado para listagem rápida

  -- Matriz de Riscos e Indicadores Críticos
  risk_level text NULL CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  risk_index integer NULL CHECK (risk_index IS NULL OR (risk_index >= 0 AND risk_index <= 100)),
  has_active_theft_robbery boolean NULL,                         -- Alerta ativo de roubo/furto
  has_judicial_restriction boolean NULL,                        -- Bloqueio Renajud ou restrição judicial
  has_financial_restriction boolean NULL,                       -- Alienação fiduciária / gravame ativo
  has_active_gravamen boolean NULL,                              -- Gravame ativo na base nacional
  has_auction_record boolean NULL,                               -- Histórico de passagem por leilão
  has_accident_indication boolean NULL,                          -- Indicação ou registro de sinistro/monta
  has_debts boolean NULL,                                        -- Débitos estaduais pendentes (multas/IPVA)
  debts_total_amount numeric(12,2) NULL DEFAULT 0.00,            -- Soma total dos débitos apurados

  -- Auditoria de Confirmação Explícita de Custo
  confirmation_at timestamptz NULL,                              -- Timestamp do clique de confirmação
  confirmed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin que confirmou o débito
  confirmation_plate text NULL,                                  -- Placa exatamente como digitada no modal
  confirmation_message_version text NULL,                        -- Versão do termo exibido no modal

  -- Vínculos com o Ecossistema AF Motos (Opcionais)
  motorcycle_id uuid NULL REFERENCES public.motorcycles(id) ON DELETE SET NULL,
  sell_request_id uuid NULL REFERENCES public.sell_requests(id) ON DELETE SET NULL,
  consignment_id uuid NULL REFERENCES public.consignments(id) ON DELETE SET NULL,
  lead_id uuid NULL REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Auditoria Operacional e PDF
  consulted_at timestamptz NOT NULL DEFAULT now(),               -- Data/hora da execução da consulta
  consulted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT, -- Admin solicitante
  pdf_generated_at timestamptz NULL,                             -- Data do último PDF gerado
  pdf_generation_count integer NOT NULL DEFAULT 0,               -- Total de PDFs gerados a partir do snapshot

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comentários da Tabela e Colunas Críticas
COMMENT ON TABLE public.vehicle_plate_consultations IS 'Histórico e snapshots imutáveis de consultas veiculares por placa com modelo híbrido (JSONB + resumo indexado).';
COMMENT ON COLUMN public.vehicle_plate_consultations.raw_response IS 'Payload bruto integral retornado pela API externa para auditoria e renderização de PDF.';
COMMENT ON COLUMN public.vehicle_plate_consultations.plate_normalized IS 'Placa alfanumérica normalizada sem pontuação para indexação e cache de custo zero.';
COMMENT ON COLUMN public.vehicle_plate_consultations.risk_level IS 'Classificação de risco calculada pelo adapter (LOW, MEDIUM, HIGH, CRITICAL).';

-- Índices B-Tree Estratégicos
CREATE INDEX IF NOT EXISTS idx_vpc_plate_normalized 
  ON public.vehicle_plate_consultations (plate_normalized);

CREATE INDEX IF NOT EXISTS idx_vpc_consulted_at 
  ON public.vehicle_plate_consultations (consulted_at DESC);

CREATE INDEX IF NOT EXISTS idx_vpc_status 
  ON public.vehicle_plate_consultations (status);

CREATE INDEX IF NOT EXISTS idx_vpc_is_mock 
  ON public.vehicle_plate_consultations (is_mock);

CREATE INDEX IF NOT EXISTS idx_vpc_risk_level 
  ON public.vehicle_plate_consultations (risk_level);

CREATE INDEX IF NOT EXISTS idx_vpc_brand_model 
  ON public.vehicle_plate_consultations (brand, model);

CREATE INDEX IF NOT EXISTS idx_vpc_motorcycle_id 
  ON public.vehicle_plate_consultations (motorcycle_id);

CREATE INDEX IF NOT EXISTS idx_vpc_sell_request_id 
  ON public.vehicle_plate_consultations (sell_request_id);

-- Índice Único Parcial: Garante que só exista uma consulta live finalizada por placa
CREATE UNIQUE INDEX IF NOT EXISTS idx_vpc_live_unique 
  ON public.vehicle_plate_consultations (plate_normalized, consultation_type, provider) 
  WHERE (mode = 'live' AND status = 'COMPLETED');

-- Trigger de updated_at automático
DROP TRIGGER IF EXISTS update_vehicle_plate_consultations_updated_at ON public.vehicle_plate_consultations;
CREATE TRIGGER update_vehicle_plate_consultations_updated_at
  BEFORE UPDATE ON public.vehicle_plate_consultations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicle_plate_consultations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS Exclusivas para Administradores
DROP POLICY IF EXISTS "Admins can view vehicle consultations" ON public.vehicle_plate_consultations;
CREATE POLICY "Admins can view vehicle consultations"
  ON public.vehicle_plate_consultations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert vehicle consultations" ON public.vehicle_plate_consultations;
CREATE POLICY "Admins can insert vehicle consultations"
  ON public.vehicle_plate_consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND consulted_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update vehicle consultations" ON public.vehicle_plate_consultations;
CREATE POLICY "Admins can update vehicle consultations"
  ON public.vehicle_plate_consultations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete vehicle consultations" ON public.vehicle_plate_consultations;
CREATE POLICY "Admins can delete vehicle consultations"
  ON public.vehicle_plate_consultations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
