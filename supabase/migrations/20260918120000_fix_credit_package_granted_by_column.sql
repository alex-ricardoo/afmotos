-- ==============================================================================
-- Migration: 20260918120000_fix_credit_package_granted_by_column.sql
-- Description: Hotfix crítico para corrigir o uso da coluna inexistente 'created_by'
--              em 'customer_credit_packages' dentro da RPC public.grant_credit_package.
--              A tabela public.customer_credit_packages utiliza as colunas
--              'granted_by' e 'granted_at'.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.grant_credit_package(
    p_user_id UUID,
    p_package_name TEXT,
    p_package_type TEXT,
    p_credits_granted INTEGER,
    p_payment_channel TEXT,
    p_idempotency_key TEXT,
    p_external_payment_reference TEXT DEFAULT NULL,
    p_unit_price_cents INTEGER DEFAULT NULL,
    p_total_paid_cents INTEGER DEFAULT NULL,
    p_sales_note TEXT DEFAULT NULL,
    p_admin_note TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id UUID;
    v_package_id UUID;
    v_avail INTEGER;
    v_res INTEGER;
    v_cons INTEGER;
BEGIN
    -- 1. Validate caller is active admin or backend service_role
    IF NOT (public.is_active_admin() OR (auth.jwt() ->> 'role') = 'service_role' OR current_setting('role', true) = 'service_role') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message_safe', 'Apenas administradores ativos podem conceder pacotes de créditos.'
        );
    END IF;

    v_admin_id := auth.uid();

    -- 2. Parameter validations
    IF p_credits_granted IS NULL OR p_credits_granted <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_CREDIT_AMOUNT',
            'message_safe', 'A quantidade de créditos concedidos deve ser maior que zero.'
        );
    END IF;

    IF p_package_type NOT IN ('manual_negotiated', 'agency', 'reseller', 'promotional', 'partner', 'test') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PACKAGE_TYPE',
            'message_safe', 'Tipo de pacote inválido.'
        );
    END IF;

    IF p_payment_channel NOT IN ('pix', 'bank_transfer', 'credit_card', 'cash', 'courtesy', 'partnership', 'test', 'whatsapp') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_PAYMENT_CHANNEL',
            'message_safe', 'Canal de pagamento inválido.'
        );
    END IF;

    -- 3. Idempotency Check on Ledger
    IF EXISTS (SELECT 1 FROM public.customer_credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
        SELECT available_credits, reserved_credits, consumed_credits
        INTO v_avail, v_res, v_cons
        FROM public.customer_credit_balances
        WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'code', 'GRANT_IDEMPOTENT_SUCCESS',
            'message_safe', 'Concessão de pacote já executada com esta chave de idempotência.',
            'available_credits', COALESCE(v_avail, 0),
            'reserved_credits', COALESCE(v_res, 0),
            'consumed_credits', COALESCE(v_cons, 0)
        );
    END IF;

    -- 4. Create Package Batch (usando as colunas canônicas granted_by e granted_at)
    INSERT INTO public.customer_credit_packages (
        user_id,
        package_name,
        package_type,
        credits_granted,
        credits_remaining,
        unit_price_cents,
        total_paid_cents,
        payment_channel,
        external_payment_reference,
        sales_note,
        admin_note,
        status,
        expires_at,
        granted_by,
        granted_at
    ) VALUES (
        p_user_id,
        p_package_name,
        p_package_type,
        p_credits_granted,
        p_credits_granted,
        p_unit_price_cents,
        p_total_paid_cents,
        p_payment_channel,
        p_external_payment_reference,
        p_sales_note,
        p_admin_note,
        'active',
        p_expires_at,
        COALESCE(v_admin_id, p_user_id),
        timezone('utc', now())
    ) RETURNING id INTO v_package_id;

    -- 5. Insert Accounting Ledger Entry (customer_credit_ledger usa created_by)
    INSERT INTO public.customer_credit_ledger (
        user_id,
        package_id,
        entry_type,
        quantity,
        available_effect,
        reserved_effect,
        consumed_effect,
        reason_code,
        reason_note,
        created_by,
        actor_type,
        idempotency_key,
        metadata
    ) VALUES (
        p_user_id,
        v_package_id,
        'grant',
        p_credits_granted,
        p_credits_granted,
        0,
        0,
        'ADMIN_GRANT',
        COALESCE(p_admin_note, 'Concessão de pacote de créditos'),
        v_admin_id,
        'admin',
        p_idempotency_key,
        jsonb_build_object(
            'package_name', p_package_name,
            'package_type', p_package_type,
            'payment_channel', p_payment_channel,
            'credits_granted', p_credits_granted
        )
    );

    -- 6. Upsert Aggregated Balance
    INSERT INTO public.customer_credit_balances (
        user_id,
        available_credits,
        reserved_credits,
        consumed_credits,
        updated_at
    ) VALUES (
        p_user_id,
        p_credits_granted,
        0,
        0,
        timezone('utc', now())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET available_credits = customer_credit_balances.available_credits + p_credits_granted,
        updated_at = timezone('utc', now())
    RETURNING available_credits, reserved_credits, consumed_credits
    INTO v_avail, v_res, v_cons;

    -- 7. Audit Log (actor_type: admin, event: credit_package_granted)
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        transaction_id,
        actor_id,
        actor_type,
        event,
        details
    ) VALUES (
        NULL,
        NULL,
        v_admin_id,
        'admin',
        'credit_package_granted',
        jsonb_build_object(
            'user_id', p_user_id,
            'package_id', v_package_id,
            'package_name', p_package_name,
            'credits_granted', p_credits_granted,
            'idempotency_key', p_idempotency_key
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'GRANT_SUCCESS',
        'message_safe', 'Pacote de créditos concedido com sucesso.',
        'package_id', v_package_id,
        'user_id', p_user_id,
        'credits_granted', p_credits_granted,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- Permissões explícitas da função
REVOKE ALL ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO authenticated, service_role;
