# Data Model: Consulta de Placa com Snapshot JSONB e Cache

**Feature**: `018-consulta-placa-historico-veicular`  
**Date**: 2026-08-30  
**Target Schema**: `public`  

---

## 1. Mapeamento e Auditoria de Tabelas Existentes

A modelagem da tabela `vehicle_plate_consultations` respeita estritamente o schema existente do banco de dados do Supabase da AF Motos:

| Tabela Relacionada | Chave Primária | Papel no Domínio | Tipo de Relacionamento / Ação ON DELETE |
|---|---|---|---|
| `auth.users` | `id` (uuid) | Usuário autenticado que realizou ou confirmou a consulta | `ON DELETE RESTRICT` (auditoria obrigatória) |
| `public.motorcycles` | `id` (uuid) | Motocicleta cadastrada no inventário | `ON DELETE SET NULL` (vínculo opcional) |
| `public.sell_requests` | `id` (uuid) | Solicitação pública de "Venda sua Moto" | `ON DELETE SET NULL` (vínculo opcional) |
| `public.consignments` | `id` (uuid) | Contrato de consignação ativo | `ON DELETE SET NULL` (vínculo opcional) |
| `public.consignment_requests` | `id` (uuid) | Solicitação pública de consignação (se ativa) | `ON DELETE SET NULL` (vínculo opcional) |
| `public.leads` | `id` (uuid) | Registro de lead ou proposta de interesse comercial | `ON DELETE SET NULL` (vínculo opcional) |

---

## 2. Proposta de Migração DDL: `public.vehicle_plate_consultations`

```sql
-- Migration: 20260830100000_create_vehicle_plate_consultations.sql
-- Description: Criação da tabela híbrida de consultas veiculares com snapshot JSONB, colunas resumidas e RLS.

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
```

---

## 3. Tipos TypeScript de Domínio e DTOs

```typescript
// types/vehicle-lookup.ts

export type VehicleLookupMode = 'mock' | 'live';
export type VehicleConsultationStatus = 
  | 'PENDING_CONFIRMATION' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CHARGE_STATUS_UNKNOWN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VehicleConsultationRecord {
  id: string;
  plate_normalized: string;
  plate_display: string;
  consultation_type: string;
  provider: string;
  raw_response: Record<string, unknown>;
  response_schema_version: string;
  status: VehicleConsultationStatus;
  provider_status_code: number | null;
  provider_error: boolean;
  provider_message: string | null;
  mode: VehicleLookupMode;
  is_mock: boolean;
  is_chargeable: boolean;
  charged_amount: number;
  provider_balance_before: number | null;
  provider_balance_after: number | null;
  provider_tax: number | null;
  vehicle_type: string | null;
  brand: string | null;
  model: string | null;
  vehicle_description: string | null;
  year_manufacture: number | null;
  year_model: number | null;
  color: string | null;
  state: string | null;
  city: string | null;
  chassis_masked: string | null;
  renavam_masked: string | null;
  risk_level: RiskLevel | null;
  risk_index: number | null;
  has_active_theft_robbery: boolean | null;
  has_judicial_restriction: boolean | null;
  has_financial_restriction: boolean | null;
  has_active_gravamen: boolean | null;
  has_auction_record: boolean | null;
  has_accident_indication: boolean | null;
  has_debts: boolean | null;
  debts_total_amount: number | null;
  confirmation_at: string | null;
  confirmed_by: string | null;
  confirmation_plate: string | null;
  confirmation_message_version: string | null;
  motorcycle_id: string | null;
  sell_request_id: string | null;
  consignment_id: string | null;
  lead_id: string | null;
  consulted_at: string;
  consulted_by: string;
  pdf_generated_at: string | null;
  pdf_generation_count: number;
  created_at: string;
  updated_at: string;
}

/** DTO leve para listagem no painel administrativo sem carregar o JSON pesado */
export interface VehicleConsultationSummaryDto {
  id: string;
  plate_display: string;
  plate_normalized: string;
  brand: string;
  model: string;
  year_manufacture: number | null;
  year_model: number | null;
  state: string | null;
  city: string | null;
  risk_level: RiskLevel;
  has_active_theft_robbery: boolean;
  has_judicial_restriction: boolean;
  has_active_gravamen: boolean;
  has_auction_record: boolean;
  has_debts: boolean;
  debts_total_amount: number;
  mode: VehicleLookupMode;
  is_mock: boolean;
  charged_amount: number;
  status: VehicleConsultationStatus;
  consulted_at: string;
  motorcycle_id: string | null;
}

/** DTO seguro de cliente para o Relatório / Laudo PDF */
export interface CustomerVehicleReportDto {
  consultation_id: string;
  consulted_at: string;
  plate_display: string;
  brand: string;
  model: string;
  vehicle_type: string;
  year_manufacture: number;
  year_model: number;
  color: string;
  fuel: string;
  engine_capacity: string;
  city_state: string;
  chassis_masked: string;
  renavam_masked: string;
  engine_masked: string;
  
  // Status de Procedência
  procedural_verdict: 'APPROVED' | 'ATTENTION' | 'RESTRICTED';
  risk_summary: {
    theft_robbery_clear: boolean;
    judicial_clear: boolean;
    financial_clear: boolean;
    auction_clear: boolean;
    accident_clear: boolean;
    recall_clear: boolean;
    debts_clear: boolean;
  };
  
  // FIPE
  fipe_reference?: {
    code: string;
    model: string;
    price: number;
    reference_month: string;
  };
  
  // Débitos Consolidados
  debts_summary?: {
    total_debts: number;
    ipva_pending: number;
    licensing_pending: number;
    fines_pending: number;
  };
  
  // Disclaimer Legal Institucional
  disclaimer: string;
  issuer: {
    company_name: string;
    cnpj: string;
    city: string;
  };
}
```
