-- ============================================================
-- Migration: 20260913210000_create_admin_payments_view_and_indexes
-- Description: Composite indexes for admin queries and unified view
--              for vehicle plate consultations, payments, delivery jobs, and refunds.
-- ============================================================

-- 1. Performance Indexes for Administration and Filtering
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_status
  ON public.payment_transactions (created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_detail
  ON public.payment_transactions (status, status_detail);

CREATE INDEX IF NOT EXISTS idx_cpc_status_payment
  ON public.customer_plate_consultations (status, payment_status);

CREATE INDEX IF NOT EXISTS idx_consultation_delivery_jobs_error_code
  ON public.consultation_delivery_jobs (last_error_code)
  WHERE (last_error_code IS NOT NULL);

-- 2. Unified Administrative View
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
    
    -- Dados da Consulta
    cpc.id AS consultation_id,
    cpc.plate,
    cpc.plate_normalized,
    cpc.status AS consultation_status,
    cpc.payment_status AS consultation_payment_status,
    (cpc.vehicle_data IS NOT NULL) AS has_report_data,
    cpc.processed_at AS consultation_processed_at,
    cpc.lookup_error_message,
    
    -- Dados do Cliente
    cp.id AS customer_id,
    cp.full_name AS customer_name,
    cp.email AS customer_email,
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
    
    -- Indicadores Operacionais Computados
    CASE
      WHEN cdj.last_error_code = 'APIBRASIL_INSUFFICIENT_CREDITS' 
           OR cdj.last_http_status = 402 THEN TRUE
      ELSE FALSE
    END AS is_insufficient_credits,
    
    CASE
      WHEN pt.status = 'approved' 
           AND (cpc.status != 'completed' OR cpc.vehicle_data IS NULL)
           AND COALESCE(pr.status, 'none') NOT IN ('requested', 'pending', 'confirmed')
           AND pt.status != 'refunded'
           AND pt.mp_payment_id IS NOT NULL THEN TRUE
      ELSE FALSE
    END AS is_refund_eligible,

    CASE
      WHEN pt.status = 'approved' 
           AND (cpc.status != 'completed' OR cpc.vehicle_data IS NULL)
           AND COALESCE(pr.status, 'none') NOT IN ('requested', 'pending', 'confirmed')
           AND (cdj.status IS NULL OR cdj.status != 'processing') THEN TRUE
      ELSE FALSE
    END AS is_reprocess_eligible

FROM public.payment_transactions pt
JOIN public.customer_plate_consultations cpc ON cpc.id = pt.consultation_id
LEFT JOIN public.customer_profiles cp ON cp.id = cpc.user_id
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
