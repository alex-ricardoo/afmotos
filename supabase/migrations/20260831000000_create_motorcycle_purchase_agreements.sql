-- Migration: 20260831000000_create_motorcycle_purchase_agreements.sql
-- Description: Criação da tabela de Contratos de Compra de Motocicleta pela AF Motos

CREATE TABLE IF NOT EXISTS public.motorcycle_purchase_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid REFERENCES public.motorcycles(id) ON DELETE SET NULL,
  seller_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  sell_request_id uuid REFERENCES public.sell_requests(id) ON DELETE SET NULL,
  vehicle_consultation_id uuid REFERENCES public.vehicle_plate_consultations(id) ON DELETE SET NULL,
  
  agreement_number text NOT NULL UNIQUE,
  agreement_version integer NOT NULL DEFAULT 1 CHECK (agreement_version >= 1),
  previous_agreement_id uuid REFERENCES public.motorcycle_purchase_agreements(id) ON DELETE SET NULL,
  replacement_reason text,

  purchase_amount numeric(12,2) NOT NULL CHECK (purchase_amount > 0),
  paid_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
  payment_status text NOT NULL DEFAULT 'PAID_FULL' CHECK (payment_status IN ('PAID_FULL', 'PAID_PARTIAL', 'PENDING')),
  payment_method text NOT NULL DEFAULT 'PIX',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  
  delivery_datetime timestamptz NOT NULL DEFAULT now(),
  delivery_km integer CHECK (delivery_km >= 0),
  keys_count integer NOT NULL DEFAULT 1 CHECK (keys_count >= 1),
  has_manual boolean NOT NULL DEFAULT false,
  has_spare_key boolean NOT NULL DEFAULT false,
  documents_delivered text[] DEFAULT '{}'::text[],
  accessories_delivered text[] DEFAULT '{}'::text[],
  apparent_condition_notes text,
  
  transfer_status text NOT NULL DEFAULT 'PENDING' CHECK (transfer_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXEMPT')),
  transfer_deadline_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  transfer_notes text,

  vehicle_condition_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  seller_declarations jsonb NOT NULL DEFAULT '{}'::jsonb,
  contract_snapshot jsonb NOT NULL,
  pdf_storage_path text NOT NULL,

  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'signed', 'cancelled', 'superseded')),
  signed_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para otimização de consultas administrativas
CREATE INDEX IF NOT EXISTS idx_purchase_agreements_motorcycle_id ON public.motorcycle_purchase_agreements(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_purchase_agreements_seller_id ON public.motorcycle_purchase_agreements(seller_customer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_agreements_sell_request_id ON public.motorcycle_purchase_agreements(sell_request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_agreements_status ON public.motorcycle_purchase_agreements(status);
CREATE INDEX IF NOT EXISTS idx_purchase_agreements_created_at ON public.motorcycle_purchase_agreements(created_at DESC);

-- Colunas opcionais na tabela de motocicletas para rastreabilidade de aquisição
ALTER TABLE public.motorcycles
  ADD COLUMN IF NOT EXISTS purchase_amount numeric(12,2) CHECK (purchase_amount >= 0),
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS seller_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acquisition_agreement_id uuid REFERENCES public.motorcycle_purchase_agreements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_motorcycles_seller_customer_id ON public.motorcycles(seller_customer_id);

-- Habilitação de RLS
ALTER TABLE public.motorcycle_purchase_agreements ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS exclusivas para administradores
CREATE POLICY "Admins have full access to motorcycle purchase agreements"
ON public.motorcycle_purchase_agreements
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
