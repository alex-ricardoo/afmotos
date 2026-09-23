-- ============================================================
-- Migration: 20260923100000_hotfix_credit_package_grant_and_admin_view
-- Description: Self-contained, idempotent hotfix migration for:
--              1. Adding 'standard' package_type check constraint.
--              2. Evolving payment_refunds (nullable consultation_id, 
--                 credit_package_order_id, index, and XOR preflight constraint).
--              3. Atomic transactional RPC grant_credit_package_from_paid_order.
--              4. Recreating admin_payment_consultations_view with LEFT JOINs,
--                 exposing package_id (and customer_credit_package_id fallback),
--                 and supporting package refund eligibility.
-- ============================================================

-- 1. Performance Indexes for Package Orders and Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_purpose_created
  ON public.payment_transactions (purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_credit_package_order
  ON public.payment_transactions (credit_package_order_id)
  WHERE (credit_package_order_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_credit_package_orders_status_created
  ON public.credit_package_orders (status, created_at DESC);

-- 2. Allow 'standard' in customer_credit_packages.package_type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customer_credit_packages_package_type_check'
          AND conrelid = 'public.customer_credit_packages'::regclass
    ) THEN
        ALTER TABLE public.customer_credit_packages
            DROP CONSTRAINT customer_credit_packages_package_type_check;
    END IF;

    ALTER TABLE public.customer_credit_packages
        ADD CONSTRAINT customer_credit_packages_package_type_check
        CHECK (package_type IN (
            'standard',
            'manual_negotiated',
            'agency',
            'reseller',
            'promotional',
            'partner',
            'test'
        ));
END $$;

-- 3. Evolve payment_refunds for credit package refunds
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

-- Preflight validation and XOR constraint for payment_refunds origin
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM public.payment_refunds
    WHERE (consultation_id IS NULL AND credit_package_order_id IS NULL)
       OR (consultation_id IS NOT NULL AND credit_package_order_id IS NOT NULL);

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Preflight validation failed for payment_refunds XOR constraint: % record(s) found with both or neither consultation_id and credit_package_order_id populated.', v_invalid_count;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payment_refunds_target_xor_check'
          AND conrelid = 'public.payment_refunds'::regclass
    ) THEN
        ALTER TABLE public.payment_refunds
            ADD CONSTRAINT payment_refunds_target_xor_check
            CHECK (
                (consultation_id IS NOT NULL AND credit_package_order_id IS NULL) OR
                (consultation_id IS NULL AND credit_package_order_id IS NOT NULL)
            );
    END IF;
END $$;

-- 4. Atomic Transactional RPC: grant_credit_package_from_paid_order
-- Note: Does NOT suppress database exceptions with EXCEPTION handler,
-- ensuring full transactional rollback on failure and bubbling errors up.
CREATE OR REPLACE FUNCTION public.grant_credit_package_from_paid_order(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_order RECORD;
    v_existing_package_id UUID;
    v_package_id UUID;
    v_offer_name TEXT;
    v_idempotency_key TEXT;
BEGIN
    -- 1. Lock pessimista da ordem
    SELECT * INTO v_order
    FROM public.credit_package_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'ORDER_NOT_FOUND', 
            'message', 'Pedido não encontrado.'
        );
    END IF;

    IF v_order.status <> 'paid' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'ORDER_NOT_PAID', 
            'message', 'O pedido ainda não está com status pago.'
        );
    END IF;

    -- 2. Verificação de idempotência (já concedido?)
    SELECT id INTO v_existing_package_id
    FROM public.customer_credit_packages
    WHERE purchase_order_id = p_order_id;

    IF v_existing_package_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true, 
            'code', 'ALREADY_GRANTED', 
            'message', 'Os créditos deste pedido já foram liberados anteriormente.',
            'package_id', v_existing_package_id,
            'credits_granted', v_order.credits_quantity
        );
    END IF;

    -- 3. Identifica nome da oferta
    SELECT name INTO v_offer_name
    FROM public.credit_package_offers
    WHERE id = v_order.offer_id;

    v_package_id := gen_random_uuid();
    v_idempotency_key := 'package-grant:' || p_order_id::text;

    -- 4. Criação do pacote concedido
    INSERT INTO public.customer_credit_packages (
        id,
        user_id,
        offer_id,
        package_name,
        package_type,
        credits_granted,
        credits_remaining,
        status,
        payment_channel,
        external_payment_reference,
        unit_price_cents,
        total_paid_cents,
        currency,
        source,
        purchase_order_id,
        purchase_price_cents,
        purchase_currency,
        purchased_at,
        granted_by,
        granted_at,
        created_at,
        updated_at
    ) VALUES (
        v_package_id,
        v_order.user_id,
        v_order.offer_id,
        COALESCE(v_offer_name, v_order.offer_name_snapshot, 'Pacote de Consultas Mercado Pago'),
        'standard',
        v_order.credits_quantity,
        v_order.credits_quantity,
        'active',
        'other',
        v_order.mp_payment_id,
        v_order.unit_price_cents,
        v_order.price_cents,
        v_order.currency,
        'mercadopago_package',
        v_order.id,
        v_order.price_cents,
        v_order.currency,
        COALESCE(v_order.paid_at, timezone('utc', now())),
        v_order.user_id,
        timezone('utc', now()),
        timezone('utc', now()),
        timezone('utc', now())
    );

    -- 5. Lançamento no livro razão (ledger)
    INSERT INTO public.customer_credit_ledger (
        id,
        user_id,
        package_id,
        entry_type,
        quantity,
        available_effect,
        reserved_effect,
        consumed_effect,
        reason_code,
        reason_note,
        actor_type,
        idempotency_key,
        metadata,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_order.user_id,
        v_package_id,
        'grant',
        v_order.credits_quantity,
        v_order.credits_quantity,
        0,
        0,
        'PACKAGE_PURCHASE_APPROVED',
        'Créditos liberados automaticamente via Mercado Pago Checkout Pro',
        'system',
        v_idempotency_key,
        jsonb_build_object(
            'order_id', v_order.id, 
            'mp_payment_id', v_order.mp_payment_id, 
            'price_cents', v_order.price_cents,
            'credits_quantity', v_order.credits_quantity
        ),
        timezone('utc', now())
    );

    -- 6. Atualização atômica do saldo agregado em customer_credit_balances
    INSERT INTO public.customer_credit_balances (
        user_id,
        available_credits,
        reserved_credits,
        consumed_credits,
        updated_at
    ) VALUES (
        v_order.user_id,
        v_order.credits_quantity,
        0,
        0,
        timezone('utc', now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        available_credits = public.customer_credit_balances.available_credits + v_order.credits_quantity,
        updated_at = timezone('utc', now());

    -- 7. Marca carimbo de concessão na ordem
    UPDATE public.credit_package_orders
    SET granted_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CREDITS_GRANTED',
        'message', 'Créditos concedidos com sucesso.',
        'package_id', v_package_id,
        'credits_granted', v_order.credits_quantity
    );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_credit_package_from_paid_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credit_package_from_paid_order(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_credit_package_from_paid_order(UUID) TO authenticated;

-- 5. Recreate Unified Administrative View with LEFT JOINs and package_id contract
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
    ccp.id AS package_id,
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

GRANT SELECT ON public.admin_payment_consultations_view TO authenticated;
GRANT SELECT ON public.admin_payment_consultations_view TO service_role;

NOTIFY pgrst, 'reload schema';
