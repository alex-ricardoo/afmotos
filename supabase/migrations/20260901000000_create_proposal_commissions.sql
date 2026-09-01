-- Migration: Create Proposal Commissions and Commission Audit Logs
-- Feature: 022-registro-comissoes-propostas
-- Date: 2026-09-01

-- 1. Create proposal_commissions table
CREATE TABLE IF NOT EXISTS public.proposal_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys to central domain entities
  proposal_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sell_request_id uuid REFERENCES public.sell_requests(id) ON DELETE SET NULL,
  sale_agreement_id uuid REFERENCES public.sale_agreements(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  motorcycle_id uuid REFERENCES public.motorcycles(id) ON DELETE SET NULL,

  -- CRM Customers
  owner_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  buyer_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,

  -- Commission parameters
  commission_type text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_percentage numeric(5,2) NULL CHECK (commission_percentage IS NULL OR (commission_percentage >= 0 AND commission_percentage <= 100)),
  commission_fixed_value numeric(12,2) NULL CHECK (commission_fixed_value IS NULL OR commission_fixed_value >= 0),

  -- Reference vehicle prices
  expected_sale_value numeric(12,2) NULL CHECK (expected_sale_value IS NULL OR expected_sale_value >= 0),
  final_sale_value numeric(12,2) NULL CHECK (final_sale_value IS NULL OR final_sale_value >= 0),

  -- Commission financial values
  commission_expected_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (commission_expected_value >= 0),
  commission_confirmed_value numeric(12,2) NULL CHECK (commission_confirmed_value IS NULL OR commission_confirmed_value >= 0),
  commission_received_value numeric(12,2) NULL CHECK (commission_received_value IS NULL OR commission_received_value >= 0),

  -- State machine
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'proposed', 'confirmed', 'receivable', 'received', 'cancelled', 'voided')
  ),

  -- Reports eligibility
  eligible_for_reports boolean NOT NULL DEFAULT false,
  eligible_at timestamptz NULL,

  -- Confirmation (Competence)
  confirmed_at timestamptz NULL,
  confirmed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Receipt (Cash)
  received_at timestamptz NULL,
  received_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  received_payment_method text NULL,
  received_reference text NULL,

  -- Cancellation & Void
  cancelled_at timestamptz NULL,
  cancelled_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason text NULL,

  -- Notes & metadata
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Create proposal_commission_audit_logs table
CREATE TABLE IF NOT EXISTS public.proposal_commission_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.proposal_commissions(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (
    action IN (
      'created',
      'updated',
      'confirmed',
      'received',
      'cancelled',
      'voided',
      'reopened',
      'report_eligibility_changed'
    )
  ),
  previous_snapshot jsonb NULL,
  new_snapshot jsonb NOT NULL,
  reason text NULL,
  changed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_prop_comm_proposal_id ON public.proposal_commissions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_prop_comm_sell_request_id ON public.proposal_commissions(sell_request_id) WHERE sell_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_comm_sale_agreement_id ON public.proposal_commissions(sale_agreement_id) WHERE sale_agreement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_comm_sale_id ON public.proposal_commissions(sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_comm_motorcycle_id ON public.proposal_commissions(motorcycle_id) WHERE motorcycle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_comm_status ON public.proposal_commissions(status);
CREATE INDEX IF NOT EXISTS idx_prop_comm_reports_eligible ON public.proposal_commissions(eligible_for_reports, confirmed_at, received_at) WHERE eligible_for_reports = true;
CREATE INDEX IF NOT EXISTS idx_prop_comm_created_at ON public.proposal_commissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prop_comm_audit_commission_id ON public.proposal_commission_audit_logs(commission_id, changed_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.proposal_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_commission_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins full access on proposal_commissions" ON public.proposal_commissions;
  DROP POLICY IF EXISTS "Admins full access on proposal_commission_audit_logs" ON public.proposal_commission_audit_logs;
END $$;

CREATE POLICY "Admins full access on proposal_commissions"
  ON public.proposal_commissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins full access on proposal_commission_audit_logs"
  ON public.proposal_commission_audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Safe Backfill from existing sale_agreements
DO $$
BEGIN
  -- Insert missing proposal_commissions rows for existing sale_agreements linked to sell_requests
  INSERT INTO public.proposal_commissions (
    proposal_id,
    sell_request_id,
    sale_agreement_id,
    sale_id,
    commission_type,
    commission_percentage,
    expected_sale_value,
    commission_expected_value,
    commission_confirmed_value,
    status,
    eligible_for_reports,
    eligible_at,
    confirmed_at,
    created_at,
    created_by
  )
  SELECT
    COALESCE(sr.lead_id, sa.sell_request_id) AS proposal_id,
    sa.sell_request_id,
    sa.id AS sale_agreement_id,
    sa.sale_id,
    'percentage' AS commission_type,
    sa.commission_percentage,
    sa.expected_sale_value,
    sa.commission_value AS commission_expected_value,
    CASE WHEN sa.sale_id IS NOT NULL THEN sa.commission_value ELSE NULL END AS commission_confirmed_value,
    CASE 
      WHEN sa.sale_id IS NOT NULL THEN 'confirmed'
      WHEN sa.status = 'signed' THEN 'proposed'
      ELSE 'draft'
    END AS status,
    (sa.sale_id IS NOT NULL) AS eligible_for_reports,
    CASE WHEN sa.sale_id IS NOT NULL THEN sa.created_at ELSE NULL END AS eligible_at,
    CASE WHEN sa.sale_id IS NOT NULL THEN sa.created_at ELSE NULL END AS confirmed_at,
    sa.created_at,
    sa.created_by
  FROM public.sale_agreements sa
  LEFT JOIN public.sell_requests sr ON sr.id = sa.sell_request_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.proposal_commissions pc
    WHERE pc.sale_agreement_id = sa.id OR (pc.sell_request_id IS NOT NULL AND pc.sell_request_id = sa.sell_request_id)
  )
  AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = COALESCE(sr.lead_id, sa.sell_request_id));
EXCEPTION WHEN OTHERS THEN
  -- Fallback if legacy tables have unexpected nulls during backfill
  RAISE NOTICE 'Notice: Backfill skipped or partial due to: %', SQLERRM;
END $$;

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
