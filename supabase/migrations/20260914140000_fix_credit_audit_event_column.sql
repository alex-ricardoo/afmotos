-- ==============================================================================
-- Migration: 20260914140000_fix_credit_audit_event_column.sql
-- Description: Hotfix crítico para alinhar as funções RPC de crédito com o
--              schema canônico da tabela public.consultation_audit_logs.
--              - Corrige o uso da coluna 'event' (obrigatória NOT NULL) e 'details'
--                em vez de 'event_name' e 'metadata'.
--              - Permite que consultation_id seja NULL para acomodar auditorias
--                de pacotes em lote (grant e adjust) sem consulta veicular associada.
--              - Mantém atomicidade transacional e rollback total.
--              - Mantém SECURITY DEFINER com search_path = '' e validações canônicas.
-- ==============================================================================

-- 1. Permitir consultation_id nulo para eventos a nível de conta/pacote
ALTER TABLE public.consultation_audit_logs 
  ALTER COLUMN consultation_id DROP NOT NULL;

-- 2. Atualizar RPC: reserve_credit_for_consultation
CREATE OR REPLACE FUNCTION public.reserve_credit_for_consultation(
    p_consultation_id UUID,
    p_idempotency_key TEXT,
    p_override_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID;
    v_consultation_user_id UUID;
    v_consultation_status TEXT;
    v_existing_res_id UUID;
    v_existing_res_status TEXT;
    v_package_id UUID;
    v_reservation_id UUID;
    v_avail INTEGER;
    v_res INTEGER;
    v_cons INTEGER;
BEGIN
    -- 1. Identify active user
    IF auth.uid() IS NOT NULL THEN
        v_user_id := auth.uid();
    ELSIF p_override_user_id IS NOT NULL THEN
        v_user_id := p_override_user_id;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHENTICATED',
            'message_safe', 'Usuário não autenticado.'
        );
    END IF;

    -- 2. Validate Consultation Ownership & Status
    SELECT user_id, status
    INTO v_consultation_user_id, v_consultation_status
    FROM public.customer_plate_consultations
    WHERE id = p_consultation_id;

    IF v_consultation_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONSULTATION_NOT_FOUND',
            'message_safe', 'Consulta veicular não encontrada.'
        );
    END IF;

    IF v_consultation_user_id != v_user_id AND NOT public.is_admin() THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'FORBIDDEN',
            'message_safe', 'Você não tem permissão para reservar créditos para esta consulta.'
        );
    END IF;

    -- 3. Mutex: Reject if consultation has approved Mercado Pago payment
    IF EXISTS (
        SELECT 1 FROM public.payment_transactions 
        WHERE consultation_id = p_consultation_id 
          AND status IN ('approved', 'in_process')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'PAYMENT_CONFLICT',
            'message_safe', 'Esta consulta já possui transação de pagamento ativa no Mercado Pago.'
        );
    END IF;

    -- 4. Check for existing reservation (idempotency or conflict)
    SELECT id, status INTO v_existing_res_id, v_existing_res_status
    FROM public.customer_credit_reservations
    WHERE consultation_id = p_consultation_id;

    IF v_existing_res_id IS NOT NULL THEN
        IF v_existing_res_status = 'reserved' THEN
            SELECT available_credits, reserved_credits, consumed_credits
            INTO v_avail, v_res, v_cons
            FROM public.customer_credit_balances
            WHERE user_id = v_user_id;

            RETURN jsonb_build_object(
                'success', true,
                'code', 'RESERVATION_ALREADY_EXISTS',
                'message_safe', 'Crédito já reservado para esta consulta.',
                'reservation_id', v_existing_res_id,
                'available_credits', COALESCE(v_avail, 0),
                'reserved_credits', COALESCE(v_res, 0),
                'consumed_credits', COALESCE(v_cons, 0)
            );
        ELSIF v_existing_res_status = 'consumed' THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'ALREADY_CONSUMED',
                'message_safe', 'O crédito desta consulta já foi consumido anteriormente.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'code', 'RESERVATION_CLOSED',
                'message_safe', 'Esta consulta já possui um ciclo de reserva encerrado.'
            );
        END IF;
    END IF;

    -- 5. Lock Aggregated Balance (Pessimistic Lock)
    SELECT available_credits, reserved_credits, consumed_credits
    INTO v_avail, v_res, v_cons
    FROM public.customer_credit_balances
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_avail IS NULL OR v_avail < 1 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INSUFFICIENT_CREDITS',
            'message_safe', 'Saldo de créditos insuficiente para realizar a consulta.'
        );
    END IF;

    -- 6. Select and Lock Active Package (FIFO by nearest expiration)
    SELECT id INTO v_package_id
    FROM public.customer_credit_packages
    WHERE user_id = v_user_id
      AND status = 'active'
      AND credits_remaining > 0
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()))
    ORDER BY expires_at ASC NULLS LAST, created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF v_package_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NO_ACTIVE_PACKAGE',
            'message_safe', 'Nenhum pacote ativo com créditos válidos encontrado.'
        );
    END IF;

    -- 7. Insert Reservation
    INSERT INTO public.customer_credit_reservations (
        user_id,
        package_id,
        consultation_id,
        status,
        quantity,
        reservation_idempotency_key,
        reserved_at
    ) VALUES (
        v_user_id,
        v_package_id,
        p_consultation_id,
        'reserved',
        1,
        p_idempotency_key,
        timezone('utc', now())
    ) RETURNING id INTO v_reservation_id;

    -- 8. Deduct from Package remaining credits
    UPDATE public.customer_credit_packages
    SET credits_remaining = credits_remaining - 1,
        status = CASE WHEN credits_remaining - 1 = 0 THEN 'exhausted' ELSE status END,
        updated_at = timezone('utc', now())
    WHERE id = v_package_id;

    -- 9. Update Aggregated Balance
    UPDATE public.customer_credit_balances
    SET available_credits = available_credits - 1,
        reserved_credits = reserved_credits + 1,
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING available_credits, reserved_credits, consumed_credits
    INTO v_avail, v_res, v_cons;

    -- 10. Insert Ledger Entry
    INSERT INTO public.customer_credit_ledger (
        user_id,
        package_id,
        consultation_id,
        reservation_id,
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
        v_user_id,
        v_package_id,
        p_consultation_id,
        v_reservation_id,
        'reserve',
        1,
        -1,
        1,
        0,
        'CONSULTATION_RESERVED',
        'Reserva de 1 crédito para consulta veicular',
        v_user_id,
        'customer',
        p_idempotency_key,
        jsonb_build_object(
            'consultation_id', p_consultation_id,
            'package_id', v_package_id,
            'reservation_id', v_reservation_id
        )
    );

    -- 11. Update Consultation Record
    UPDATE public.customer_plate_consultations
    SET payment_coverage_type = 'platform_credit',
        credit_package_id = v_package_id,
        credit_reservation_id = v_reservation_id,
        credit_status = 'reserved'
    WHERE id = p_consultation_id;

    -- 12. Audit Log (Usando colunas canônicas 'event' e 'details')
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        transaction_id,
        actor_id,
        actor_type,
        event,
        details
    ) VALUES (
        p_consultation_id,
        NULL,
        COALESCE(auth.uid(), v_user_id),
        'customer',
        'credit_reserved',
        jsonb_build_object(
            'package_id', v_package_id,
            'reservation_id', v_reservation_id,
            'quantity', 1,
            'coverage_type', 'platform_credit',
            'idempotency_key', p_idempotency_key
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CREDIT_RESERVED',
        'message_safe', '1 crédito reservado com sucesso.',
        'reservation_id', v_reservation_id,
        'package_id', v_package_id,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- 3. Atualizar RPC: consume_reserved_credit
CREATE OR REPLACE FUNCTION public.consume_reserved_credit(
    p_consultation_id UUID,
    p_reservation_id UUID DEFAULT NULL,
    p_is_mock_delivery BOOLEAN DEFAULT FALSE,
    p_environment TEXT DEFAULT 'production'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_res_id UUID;
    v_user_id UUID;
    v_package_id UUID;
    v_status TEXT;
    v_avail INTEGER;
    v_res INTEGER;
    v_cons INTEGER;
    v_idempotency_key TEXT;
BEGIN
    -- 1. Mock Guard in Production
    IF p_environment = 'production' AND p_is_mock_delivery = TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MOCK_IN_PRODUCTION_BLOCKED',
            'message_safe', 'Laudos simulados (mock) não podem consumir créditos reais em ambiente de produção.'
        );
    END IF;

    -- 2. Lock and Locate Reservation
    SELECT id, user_id, package_id, status
    INTO v_res_id, v_user_id, v_package_id, v_status
    FROM public.customer_credit_reservations
    WHERE consultation_id = p_consultation_id
    FOR UPDATE;

    IF v_res_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'RESERVATION_NOT_FOUND',
            'message_safe', 'Nenhuma reserva encontrada para esta consulta.'
        );
    END IF;

    -- 3. Idempotent Success if already consumed
    IF v_status = 'consumed' THEN
        SELECT available_credits, reserved_credits, consumed_credits
        INTO v_avail, v_res, v_cons
        FROM public.customer_credit_balances
        WHERE user_id = v_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'code', 'ALREADY_CONSUMED_IDEMPOTENT',
            'message_safe', 'Reserva já consumida anteriormente.',
            'reservation_id', v_res_id,
            'available_credits', COALESCE(v_avail, 0),
            'reserved_credits', COALESCE(v_res, 0),
            'consumed_credits', COALESCE(v_cons, 0)
        );
    END IF;

    IF v_status != 'reserved' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_RESERVATION_STATUS',
            'message_safe', 'Apenas reservas com status reserved podem ser consumidas.'
        );
    END IF;

    -- 4. Update Reservation Status
    UPDATE public.customer_credit_reservations
    SET status = 'consumed',
        consumed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = v_res_id;

    -- 5. Lock and Update Aggregated Balance
    UPDATE public.customer_credit_balances
    SET reserved_credits = GREATEST(0, reserved_credits - 1),
        consumed_credits = consumed_credits + 1,
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING available_credits, reserved_credits, consumed_credits
    INTO v_avail, v_res, v_cons;

    -- 6. Insert Ledger Entry
    v_idempotency_key := 'consume_' || v_res_id::text;
    INSERT INTO public.customer_credit_ledger (
        user_id,
        package_id,
        consultation_id,
        reservation_id,
        entry_type,
        quantity,
        available_effect,
        reserved_effect,
        consumed_effect,
        reason_code,
        reason_note,
        actor_type,
        idempotency_key,
        metadata
    ) VALUES (
        v_user_id,
        v_package_id,
        p_consultation_id,
        v_res_id,
        'consume',
        1,
        0,
        -1,
        1,
        'REPORT_DELIVERED',
        'Consumo de crédito confirmado após entrega do laudo veicular',
        'delivery_worker',
        v_idempotency_key,
        jsonb_build_object(
            'is_mock', p_is_mock_delivery,
            'environment', p_environment
        )
    );

    -- 7. Update Consultation Status
    UPDATE public.customer_plate_consultations
    SET credit_status = 'consumed'
    WHERE id = p_consultation_id;

    -- 8. Audit Log (Usando actor_type 'system', event 'credit_consumed' e coluna 'details')
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        transaction_id,
        actor_id,
        actor_type,
        event,
        details
    ) VALUES (
        p_consultation_id,
        NULL,
        auth.uid(),
        'system',
        'credit_consumed',
        jsonb_build_object(
            'reservation_id', v_res_id,
            'package_id', v_package_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CONSUMED_SUCCESS',
        'message_safe', 'Crédito consumido com sucesso após entrega do laudo.',
        'reservation_id', v_res_id,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- 4. Atualizar RPC: release_reserved_credit
CREATE OR REPLACE FUNCTION public.release_reserved_credit(
    p_consultation_id UUID,
    p_reason_code TEXT,
    p_reason_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_res_id UUID;
    v_user_id UUID;
    v_package_id UUID;
    v_status TEXT;
    v_avail INTEGER;
    v_res INTEGER;
    v_cons INTEGER;
    v_idempotency_key TEXT;
BEGIN
    -- 1. Lock and Locate Reservation
    SELECT id, user_id, package_id, status
    INTO v_res_id, v_user_id, v_package_id, v_status
    FROM public.customer_credit_reservations
    WHERE consultation_id = p_consultation_id
    FOR UPDATE;

    IF v_res_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'RESERVATION_NOT_FOUND',
            'message_safe', 'Nenhuma reserva encontrada para esta consulta.'
        );
    END IF;

    -- 2. Idempotent Success if already released
    IF v_status = 'released' THEN
        SELECT available_credits, reserved_credits, consumed_credits
        INTO v_avail, v_res, v_cons
        FROM public.customer_credit_balances
        WHERE user_id = v_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'code', 'ALREADY_RELEASED_IDEMPOTENT',
            'message_safe', 'Reserva já liberada anteriormente.',
            'reservation_id', v_res_id,
            'available_credits', COALESCE(v_avail, 0),
            'reserved_credits', COALESCE(v_res, 0),
            'consumed_credits', COALESCE(v_cons, 0)
        );
    END IF;

    -- 3. Strict Guard: Never release an already consumed credit
    IF v_status = 'consumed' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CANNOT_RELEASE_CONSUMED_CREDIT',
            'message_safe', 'Crédito já foi consumido e laudo entregue; liberação não permitida.'
        );
    END IF;

    -- 4. Update Reservation Status
    UPDATE public.customer_credit_reservations
    SET status = 'released',
        released_at = timezone('utc', now()),
        release_reason_code = p_reason_code,
        release_reason_note = p_reason_note,
        updated_at = timezone('utc', now())
    WHERE id = v_res_id;

    -- 5. Restore credits in customer_credit_packages (unless package was cancelled)
    UPDATE public.customer_credit_packages
    SET credits_remaining = credits_remaining + 1,
        status = 'active',
        updated_at = timezone('utc', now())
    WHERE id = v_package_id
      AND status != 'cancelled';

    -- 6. Update Aggregated Balance
    UPDATE public.customer_credit_balances
    SET reserved_credits = GREATEST(0, reserved_credits - 1),
        available_credits = available_credits + 1,
        updated_at = timezone('utc', now())
    WHERE user_id = v_user_id
    RETURNING available_credits, reserved_credits, consumed_credits
    INTO v_avail, v_res, v_cons;

    -- 7. Insert Ledger Entry
    v_idempotency_key := 'release_' || v_res_id::text;
    INSERT INTO public.customer_credit_ledger (
        user_id,
        package_id,
        consultation_id,
        reservation_id,
        entry_type,
        quantity,
        available_effect,
        reserved_effect,
        consumed_effect,
        reason_code,
        reason_note,
        actor_type,
        idempotency_key,
        metadata
    ) VALUES (
        v_user_id,
        v_package_id,
        p_consultation_id,
        v_res_id,
        'release',
        1,
        1,
        -1,
        0,
        p_reason_code,
        COALESCE(p_reason_note, 'Crédito liberado após falha ou cancelamento'),
        'system',
        v_idempotency_key,
        jsonb_build_object(
            'reason_code', p_reason_code,
            'reason_note', p_reason_note
        )
    );

    -- 8. Update Consultation Status
    UPDATE public.customer_plate_consultations
    SET credit_status = 'released'
    WHERE id = p_consultation_id;

    -- 9. Audit Log (Usando actor_type 'system', event 'credit_released' e coluna 'details')
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        transaction_id,
        actor_id,
        actor_type,
        event,
        details
    ) VALUES (
        p_consultation_id,
        NULL,
        auth.uid(),
        'system',
        'credit_released',
        jsonb_build_object(
            'reservation_id', v_res_id,
            'package_id', v_package_id,
            'reason_code', p_reason_code,
            'reason_note', p_reason_note
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'RELEASED_SUCCESS',
        'message_safe', 'Crédito liberado e devolvido ao saldo disponível do usuário.',
        'reservation_id', v_res_id,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- 5. Atualizar RPC: grant_credit_package
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

    -- 4. Create Package Batch
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
        created_by
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
        v_admin_id
    ) RETURNING id INTO v_package_id;

    -- 5. Insert Accounting Ledger Entry
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

    -- 7. Audit Log (Usando actor_type 'admin', event 'credit_package_granted' e coluna 'details')
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

-- 6. Atualizar RPC: adjust_credit_package
CREATE OR REPLACE FUNCTION public.adjust_credit_package(
    p_package_id UUID,
    p_adjustment_type TEXT, -- 'add' | 'remove'
    p_quantity INTEGER,
    p_reason_code TEXT,
    p_admin_note TEXT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id UUID;
    v_user_id UUID;
    v_pkg_rem INTEGER;
    v_pkg_status TEXT;
    v_avail INTEGER;
    v_res INTEGER;
    v_cons INTEGER;
    v_entry_type TEXT;
    v_avail_effect INTEGER;
BEGIN
    -- 1. Validate Admin
    IF NOT (public.is_active_admin() OR (auth.jwt() ->> 'role') = 'service_role' OR current_setting('role', true) = 'service_role') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message_safe', 'Apenas administradores podem realizar ajustes manuais de crédito.'
        );
    END IF;

    v_admin_id := auth.uid();

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_QUANTITY',
            'message_safe', 'A quantidade ajustada deve ser maior que zero.'
        );
    END IF;

    IF p_admin_note IS NULL OR length(trim(p_admin_note)) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOTE_REQUIRED',
            'message_safe', 'Uma nota administrativa é obrigatória para qualquer ajuste de créditos.'
        );
    END IF;

    -- 2. Idempotency Check
    IF EXISTS (SELECT 1 FROM public.customer_credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
        RETURN jsonb_build_object(
            'success', true,
            'code', 'ADJUSTMENT_IDEMPOTENT_SUCCESS',
            'message_safe', 'Ajuste já executado com esta chave de idempotência.'
        );
    END IF;

    -- 3. Lock Package and Balance
    SELECT user_id, credits_remaining, status
    INTO v_user_id, v_pkg_rem, v_pkg_status
    FROM public.customer_credit_packages
    WHERE id = p_package_id
    FOR UPDATE;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'PACKAGE_NOT_FOUND',
            'message_safe', 'Pacote de créditos não encontrado.'
        );
    END IF;

    SELECT available_credits, reserved_credits, consumed_credits
    INTO v_avail, v_res, v_cons
    FROM public.customer_credit_balances
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF p_adjustment_type = 'remove' THEN
        IF v_pkg_rem < p_quantity OR v_avail < p_quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'INSUFFICIENT_AVAILABLE_CREDITS',
                'message_safe', 'Não é possível remover créditos; o saldo disponível restante do pacote ou usuário é insuficiente.'
            );
        END IF;

        v_entry_type := 'adjustment_remove';
        v_avail_effect := -p_quantity;

        UPDATE public.customer_credit_packages
        SET credits_remaining = credits_remaining - p_quantity,
            status = CASE WHEN credits_remaining - p_quantity = 0 THEN 'exhausted' ELSE status END,
            updated_at = timezone('utc', now())
        WHERE id = p_package_id;

        UPDATE public.customer_credit_balances
        SET available_credits = available_credits - p_quantity,
            updated_at = timezone('utc', now())
        WHERE user_id = v_user_id
        RETURNING available_credits, reserved_credits, consumed_credits
        INTO v_avail, v_res, v_cons;

    ELSIF p_adjustment_type = 'add' THEN
        v_entry_type := 'adjustment_add';
        v_avail_effect := p_quantity;

        UPDATE public.customer_credit_packages
        SET credits_granted = credits_granted + p_quantity,
            credits_remaining = credits_remaining + p_quantity,
            status = 'active',
            updated_at = timezone('utc', now())
        WHERE id = p_package_id;

        UPDATE public.customer_credit_balances
        SET available_credits = available_credits + p_quantity,
            updated_at = timezone('utc', now())
        WHERE user_id = v_user_id
        RETURNING available_credits, reserved_credits, consumed_credits
        INTO v_avail, v_res, v_cons;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_ADJUSTMENT_TYPE',
            'message_safe', 'Tipo de ajuste inválido (esperado: add ou remove).'
        );
    END IF;

    -- 4. Ledger Entry
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
        v_user_id,
        p_package_id,
        v_entry_type,
        p_quantity,
        v_avail_effect,
        0,
        0,
        p_reason_code,
        p_admin_note,
        v_admin_id,
        'admin',
        p_idempotency_key,
        jsonb_build_object(
            'adjustment_type', p_adjustment_type,
            'quantity', p_quantity,
            'admin_id', v_admin_id
        )
    );

    -- 5. Audit Log (Usando actor_type 'admin', event 'credit_adjusted' e coluna 'details')
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
        'credit_adjusted',
        jsonb_build_object(
            'package_id', p_package_id,
            'adjustment_type', p_adjustment_type,
            'quantity', p_quantity,
            'reason_code', p_reason_code
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'ADJUSTMENT_SUCCESS',
        'message_safe', 'Ajuste de créditos processado com sucesso.',
        'package_id', p_package_id,
        'adjustment_type', p_adjustment_type,
        'quantity', p_quantity,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- 7. Permissões de Execução
REVOKE ALL ON FUNCTION public.reserve_credit_for_consultation(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_credit_for_consultation(UUID, TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consume_reserved_credit(UUID, UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_reserved_credit(UUID, UUID, BOOLEAN, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.release_reserved_credit(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_reserved_credit(UUID, TEXT, TEXT) TO service_role, authenticated;

REVOKE ALL ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.adjust_credit_package(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_credit_package(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) TO authenticated, service_role;
