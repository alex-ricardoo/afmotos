-- ============================================================
-- Migration: 20260922100000_evolve_admin_payments_view_for_packages
-- Description: Evolve public.admin_payment_consultations_view to support
--              both vehicle plate consultations and credit package orders
--              in a single unified administrative view with LEFT JOINs.
-- ============================================================

-- 1. Composite & Performance Indexes for Package Orders and Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_purpose_created
  ON public.payment_transactions (purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_credit_package_order
  ON public.payment_transactions (credit_package_order_id)
  WHERE (credit_package_order_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_credit_package_orders_status_created
  ON public.credit_package_orders (status, created_at DESC);

-- 1.1 Evolução em payment_refunds para suportar estornos de pacotes
ALTER TABLE public.payment_refunds
    ALTER COLUMN consultation_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'payment_refunds'
          AND column_name = 'credit_package_order_id'
    ) THEN
        ALTER TABLE public.payment_refunds
            ADD COLUMN credit_package_order_id UUID
            REFERENCES public.credit_package_orders(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_refunds_package_order
  ON public.payment_refunds (credit_package_order_id)
  WHERE (credit_package_order_id IS NOT NULL);

-- 2. Drop and Recreate Unified Administrative View
CREATE OR REPLACE VIEW public.admin_payment_consultations_view AS
SELECT
    pt.id AS transaction_id,
    pt.created_at AS payment_created_at,
    pt.updated_at AS payment_updated_at,
    pt.status AS payment_status,
    pt.status_detail AS payment_status_detail,
    pt.transaction_amount AS amount,
    pt.payment_method_id,
    pt.payment_type_id,
    pt.mp_payment_id,
    pt.mp_preference_id,
    COALESCE(pt.purpose, 'vehicle_consultation') AS purpose,
    
    -- Dados da Consulta Veicular (quando purpose = 'vehicle_consultation')
    cpc.id AS consultation_id,
    cpc.plate,
    cpc.plate_normalized,
    cpc.status AS consultation_status,
    cpc.payment_status AS consultation_payment_status,
    (cpc.vehicle_data IS NOT NULL) AS has_report_data,
    cpc.processed_at AS consultation_processed_at,
    cpc.lookup_error_message,
    
    -- Dados do Pacote de Créditos (quando purpose = 'credit_package')
    cpo.id AS package_order_id,
    cpo.offer_name_snapshot AS package_offer_name,
    cpo.credits_quantity AS package_credits_quantity,
    cpo.unit_price_cents AS package_unit_price_cents,
    cpo.status AS package_order_status,
    cpo.paid_at AS package_paid_at,
    cpo.granted_at AS package_granted_at,
    ccp.id AS customer_credit_package_id,
    ccp.credits_remaining AS package_credits_remaining,
    ccp.credits_granted AS package_credits_granted,
    ccp.status AS package_status,
    (cpo.granted_at IS NOT NULL OR ccp.id IS NOT NULL) AS is_package_granted,
    
    -- Dados do Cliente (resolução unificada)
    COALESCE(cpc.user_id, cpo.user_id, pt.user_id) AS customer_id,
    COALESCE(cp.full_name, 'Cliente AF Veículos') AS customer_name,
    COALESCE(cp.email, pt.payer_email, '') AS customer_email,
    cp.phone AS customer_phone,
    
    -- Dados do Job de Entrega
    cdj.id AS delivery_job_id,
    cdj.status AS delivery_status,
    cdj.attempt_count AS delivery_attempt_count,
    cdj.max_attempts AS delivery_max_attempts,
    cdj.next_retry_at AS delivery_next_retry_at,
    cdj.last_error_code AS delivery_last_error_code,
    cdj.last_error_message_safe AS delivery_last_error_message_safe,
    cdj.last_http_status AS delivery_last_http_status,
    cdj.last_failure_class AS delivery_last_failure_class,
    cdj.provider AS delivery_provider,
    
    -- Dados do Refund
    pr.id AS refund_id,
    COALESCE(pr.status, pt.refund_status, 'none') AS refund_status,
    pr.provider_refund_id,
    pr.reason_code AS refund_reason_code,
    pr.reason_safe AS refund_reason_safe,
    pr.requested_at AS refund_requested_at,
    pr.confirmed_at AS refund_confirmed_at,
    pr.last_error_code AS refund_last_error_code,
    pr.last_error_safe AS refund_last_error_safe,
    
    -- Indicadores Operacionais Computados (Consultas)
    CASE
      WHEN cdj.last_error_code = 'APIBRASIL_INSUFFICIENT_CREDITS' 
           OR cdj.last_http_status = 402 THEN TRUE
      ELSE FALSE
    END AS is_insufficient_credits,
    
    CASE
      WHEN pt.purpose = 'credit_package' THEN FALSE
      WHEN pt.status = 'approved' 
           AND (cpc.status != 'completed' OR cpc.vehicle_data IS NULL)
           AND COALESCE(pr.status, pt.refund_status, 'none') NOT IN ('requested', 'pending', 'confirmed')
           AND pt.status != 'refunded'
           AND pt.mp_payment_id IS NOT NULL THEN TRUE
      ELSE FALSE
    END AS is_refund_eligible,

    CASE
      WHEN pt.purpose = 'credit_package' THEN FALSE
      WHEN pt.status = 'approved' 
           AND (cpc.status != 'completed' OR cpc.vehicle_data IS NULL)
           AND COALESCE(pr.status, pt.refund_status, 'none') NOT IN ('requested', 'pending', 'confirmed')
           AND (cdj.status IS NULL OR cdj.status != 'processing') THEN TRUE
      ELSE FALSE
    END AS is_reprocess_eligible,

    -- Indicador Operacional de Estorno de Pacote
    CASE
      WHEN pt.purpose = 'credit_package'
           AND pt.status = 'approved'
           AND cpo.status = 'paid'
           AND ccp.id IS NOT NULL
           AND ccp.credits_remaining = ccp.credits_granted
           AND COALESCE(pr.status, pt.refund_status, 'none') NOT IN ('requested', 'pending', 'confirmed')
           AND pt.status != 'refunded'
           AND pt.mp_payment_id IS NOT NULL THEN TRUE
      ELSE FALSE
    END AS is_package_refund_eligible

FROM public.payment_transactions pt
LEFT JOIN public.customer_plate_consultations cpc ON cpc.id = pt.consultation_id
LEFT JOIN public.credit_package_orders cpo ON cpo.id = pt.credit_package_order_id
LEFT JOIN public.customer_credit_packages ccp ON ccp.purchase_order_id = cpo.id
LEFT JOIN public.customer_profiles cp ON cp.id = COALESCE(cpc.user_id, cpo.user_id, pt.user_id)
LEFT JOIN LATERAL (
    SELECT * FROM public.consultation_delivery_jobs
    WHERE consultation_id = cpc.id
    ORDER BY created_at DESC
    LIMIT 1
) cdj ON TRUE
LEFT JOIN LATERAL (
    SELECT * FROM public.payment_refunds
    WHERE transaction_id = pt.id
    ORDER BY created_at DESC
    LIMIT 1
) pr ON TRUE;

-- 3. Concessão de Permissões
GRANT SELECT ON public.admin_payment_consultations_view TO authenticated;
GRANT SELECT ON public.admin_payment_consultations_view TO service_role;

NOTIFY pgrst, 'reload schema';
