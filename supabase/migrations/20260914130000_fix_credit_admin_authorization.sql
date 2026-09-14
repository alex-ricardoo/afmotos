-- ==============================================================================
-- Migration: 20260914130000_fix_credit_admin_authorization.sql
-- Description: Corrige validações e policies administrativas para relacionar
--              a sessão autenticada com admin_profiles.auth_user_id = auth.uid()
--              (e não admin_profiles.id = auth.uid()).
--              Garante validação estrita de is_active = true e role in ('admin', 'super_admin').
-- ==============================================================================

-- 1. Helper canônico SQL para validação de administrador ativo
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles AS ap
    WHERE ap.auth_user_id = auth.uid()
      AND ap.is_active = true
      AND ap.role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated, service_role;

-- 2. Atualizar public.is_admin() para delegar à validação canônica de admin ativo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_active_admin();
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 3. Atualizar RPC: public.grant_credit_package
-- Permite execução para administradores ativos (com JWT do usuário) ou service_role backend
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

    -- 3. Idempotency Check
    IF EXISTS (SELECT 1 FROM public.customer_credit_ledger WHERE idempotency_key = p_idempotency_key) THEN
        SELECT p.id, b.available_credits, b.reserved_credits, b.consumed_credits
        INTO v_package_id, v_avail, v_res, v_cons
        FROM public.customer_credit_packages p
        JOIN public.customer_credit_balances b ON b.user_id = p.user_id
        WHERE p.user_id = p_user_id
        ORDER BY p.created_at DESC
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'code', 'GRANT_IDEMPOTENT_SUCCESS',
            'message_safe', 'Pacote já concedido anteriormente com esta chave de idempotência.',
            'package_id', v_package_id,
            'user_id', p_user_id,
            'available_credits', COALESCE(v_avail, 0),
            'reserved_credits', COALESCE(v_res, 0),
            'consumed_credits', COALESCE(v_cons, 0)
        );
    END IF;

    -- 4. Insert Package
    INSERT INTO public.customer_credit_packages (
        user_id,
        package_name,
        package_type,
        credits_granted,
        credits_remaining,
        status,
        payment_channel,
        external_payment_reference,
        unit_price_cents,
        total_paid_cents,
        sales_note,
        admin_note,
        granted_by,
        expires_at
    ) VALUES (
        p_user_id,
        p_package_name,
        p_package_type,
        p_credits_granted,
        p_credits_granted,
        'active',
        p_payment_channel,
        p_external_payment_reference,
        p_unit_price_cents,
        p_total_paid_cents,
        p_sales_note,
        p_admin_note,
        v_admin_id,
        p_expires_at
    ) RETURNING id INTO v_package_id;

    -- 5. Insert Ledger Entry
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

    -- 7. Audit Log
    INSERT INTO public.consultation_audit_logs (
        actor_id,
        actor_type,
        event_name,
        metadata
    ) VALUES (
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

REVOKE ALL ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO authenticated, service_role;

-- 4. Atualizar RPC: public.adjust_credit_package
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
    -- 1. Validate Admin (active admin with JWT or authorized backend service_role)
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

    -- 5. Audit Log
    INSERT INTO public.consultation_audit_logs (
        actor_id,
        actor_type,
        event_name,
        metadata
    ) VALUES (
        v_admin_id,
        'admin',
        'credit_package_adjusted',
        jsonb_build_object(
            'package_id', p_package_id,
            'adjustment_type', p_adjustment_type,
            'quantity', p_quantity,
            'idempotency_key', p_idempotency_key
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

REVOKE ALL ON FUNCTION public.adjust_credit_package(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_credit_package(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 5. Corrigir policies existentes que usavam admin_profiles.id = auth.uid()
-- Substituindo por admin_profiles.auth_user_id = auth.uid() e is_active = true e role in ('admin', 'super_admin')

-- 5.1 public.payment_refunds
DROP POLICY IF EXISTS "Admins can view payment refunds" ON public.payment_refunds;
CREATE POLICY "Admins can view payment refunds"
  ON public.payment_refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles AS ap
      WHERE ap.auth_user_id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('admin', 'super_admin')
    )
  );

-- 5.2 public.consultation_delivery_jobs
DROP POLICY IF EXISTS "Admins can view delivery jobs" ON public.consultation_delivery_jobs;
CREATE POLICY "Admins can view delivery jobs"
  ON public.consultation_delivery_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles AS ap
      WHERE ap.auth_user_id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('admin', 'super_admin')
    )
  );

-- 5.3 public.payment_transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles AS ap
      WHERE ap.auth_user_id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('admin', 'super_admin')
    )
  );

-- 5.4 public.webhook_events
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;
CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles AS ap
      WHERE ap.auth_user_id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('admin', 'super_admin')
    )
  );

-- 5.5 public.consultation_audit_logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.consultation_audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON public.consultation_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles AS ap
      WHERE ap.auth_user_id = auth.uid()
        AND ap.is_active = true
        AND ap.role IN ('admin', 'super_admin')
    )
  );
