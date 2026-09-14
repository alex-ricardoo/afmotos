-- ==============================================================================
-- Migration: 20260914120000_create_secure_b2b_credit_packages.sql
-- Description: B2B Pre-paid Credit Packages, Append-Only Ledger, Isolated
--              Reservations, Aggregated Balances Cache, RLS and Secure Updated_At Triggers.
-- Security: SECURITY DEFINER with empty search_path for all RPCs,
--           granular RLS policies, and immutable ledger trigger.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURE TRIGGER FUNCTION: updated_at
-- ------------------------------------------------------------------------------
-- Replaces non-existent public.moddatetime with a secure, zero-dependency PL/pgSQL function.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. TABLE: customer_credit_balances (Aggregated Materialized Cache)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_credit_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    available_credits INTEGER NOT NULL DEFAULT 0 CHECK (available_credits >= 0),
    reserved_credits INTEGER NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
    consumed_credits INTEGER NOT NULL DEFAULT 0 CHECK (consumed_credits >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS set_customer_credit_balances_updated_at ON public.customer_credit_balances;
CREATE TRIGGER set_customer_credit_balances_updated_at
    BEFORE UPDATE ON public.customer_credit_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customer_credit_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_credit_balances_select_own" ON public.customer_credit_balances;
CREATE POLICY "customer_credit_balances_select_own"
    ON public.customer_credit_balances
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_credit_balances_select_admin" ON public.customer_credit_balances;
CREATE POLICY "customer_credit_balances_select_admin"
    ON public.customer_credit_balances
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. TABLE: customer_credit_packages (Negotiated Commercial Batches)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    package_type TEXT NOT NULL CHECK (package_type IN ('manual_negotiated', 'agency', 'reseller', 'promotional', 'partner', 'test')),
    credits_granted INTEGER NOT NULL CHECK (credits_granted > 0),
    credits_remaining INTEGER NOT NULL CHECK (credits_remaining >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'suspended', 'cancelled')),
    payment_channel TEXT NOT NULL CHECK (payment_channel IN ('whatsapp', 'pix_manual', 'bank_transfer', 'cash', 'invoice', 'other')),
    external_payment_reference TEXT NULL,
    unit_price_cents INTEGER NULL CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0),
    total_paid_cents INTEGER NULL CHECK (total_paid_cents IS NULL OR total_paid_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    sales_note TEXT NULL,
    admin_note TEXT NULL,
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_credits_remaining_lte_granted CHECK (credits_remaining <= credits_granted)
);

CREATE INDEX IF NOT EXISTS idx_customer_credit_packages_user_status 
    ON public.customer_credit_packages (user_id, status);

CREATE INDEX IF NOT EXISTS idx_customer_credit_packages_expiry 
    ON public.customer_credit_packages (expires_at ASC NULLS LAST);

DROP TRIGGER IF EXISTS set_customer_credit_packages_updated_at ON public.customer_credit_packages;
CREATE TRIGGER set_customer_credit_packages_updated_at
    BEFORE UPDATE ON public.customer_credit_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customer_credit_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_credit_packages_select_own" ON public.customer_credit_packages;
CREATE POLICY "customer_credit_packages_select_own"
    ON public.customer_credit_packages
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_credit_packages_select_admin" ON public.customer_credit_packages;
CREATE POLICY "customer_credit_packages_select_admin"
    ON public.customer_credit_packages
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. TABLE: customer_credit_reservations (Isolated Reservation Lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_credit_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.customer_credit_packages(id) ON DELETE RESTRICT,
    consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'consumed', 'released', 'expired', 'revoked', 'manual_review')),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity = 1),
    reservation_idempotency_key TEXT NOT NULL UNIQUE,
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    consumed_at TIMESTAMPTZ NULL,
    released_at TIMESTAMPTZ NULL,
    expired_at TIMESTAMPTZ NULL,
    release_reason_code TEXT NULL,
    release_reason_note TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_reservation_consultation UNIQUE (consultation_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_credit_reservations_user 
    ON public.customer_credit_reservations (user_id);

CREATE INDEX IF NOT EXISTS idx_customer_credit_reservations_status 
    ON public.customer_credit_reservations (status);

DROP TRIGGER IF EXISTS set_customer_credit_reservations_updated_at ON public.customer_credit_reservations;
CREATE TRIGGER set_customer_credit_reservations_updated_at
    BEFORE UPDATE ON public.customer_credit_reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customer_credit_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_credit_reservations_select_own" ON public.customer_credit_reservations;
CREATE POLICY "customer_credit_reservations_select_own"
    ON public.customer_credit_reservations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_credit_reservations_select_admin" ON public.customer_credit_reservations;
CREATE POLICY "customer_credit_reservations_select_admin"
    ON public.customer_credit_reservations
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. TABLE: customer_credit_ledger (Append-Only Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NULL REFERENCES public.customer_credit_packages(id) ON DELETE RESTRICT,
    consultation_id UUID NULL REFERENCES public.customer_plate_consultations(id) ON DELETE RESTRICT,
    reservation_id UUID NULL REFERENCES public.customer_credit_reservations(id) ON DELETE RESTRICT,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('grant', 'reserve', 'consume', 'release', 'expire', 'adjustment_add', 'adjustment_remove', 'revoke')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    available_effect INTEGER NOT NULL DEFAULT 0,
    reserved_effect INTEGER NOT NULL DEFAULT 0,
    consumed_effect INTEGER NOT NULL DEFAULT 0,
    reason_code TEXT NOT NULL,
    reason_note TEXT NULL,
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'customer', 'system', 'delivery_worker')),
    idempotency_key TEXT NOT NULL UNIQUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_customer_credit_ledger_user_id 
    ON public.customer_credit_ledger (user_id);

CREATE INDEX IF NOT EXISTS idx_customer_credit_ledger_entry_type 
    ON public.customer_credit_ledger (entry_type);

CREATE INDEX IF NOT EXISTS idx_customer_credit_ledger_consultation_id 
    ON public.customer_credit_ledger (consultation_id);

-- Enforce strictly append-only behavior (no UPDATE or DELETE allowed)
CREATE OR REPLACE FUNCTION public.prevent_customer_credit_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'customer_credit_ledger is strictly append-only and records cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_customer_credit_ledger_mutation ON public.customer_credit_ledger;
CREATE TRIGGER trg_prevent_customer_credit_ledger_mutation
    BEFORE UPDATE OR DELETE ON public.customer_credit_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_customer_credit_ledger_mutation();

ALTER TABLE public.customer_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_credit_ledger_select_own" ON public.customer_credit_ledger;
CREATE POLICY "customer_credit_ledger_select_own"
    ON public.customer_credit_ledger
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_credit_ledger_select_admin" ON public.customer_credit_ledger;
CREATE POLICY "customer_credit_ledger_select_admin"
    ON public.customer_credit_ledger
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. EXTEND: customer_plate_consultations (Payment Coverage Columns & Safe Backfill)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_plate_consultations' 
          AND column_name = 'payment_coverage_type'
    ) THEN
        ALTER TABLE public.customer_plate_consultations 
            ADD COLUMN payment_coverage_type TEXT CHECK (payment_coverage_type IN ('mercadopago', 'platform_credit', 'free', 'legacy_unknown'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_plate_consultations' 
          AND column_name = 'credit_package_id'
    ) THEN
        ALTER TABLE public.customer_plate_consultations 
            ADD COLUMN credit_package_id UUID REFERENCES public.customer_credit_packages(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_plate_consultations' 
          AND column_name = 'credit_reservation_id'
    ) THEN
        ALTER TABLE public.customer_plate_consultations 
            ADD COLUMN credit_reservation_id UUID REFERENCES public.customer_credit_reservations(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_plate_consultations' 
          AND column_name = 'credit_status'
    ) THEN
        ALTER TABLE public.customer_plate_consultations 
            ADD COLUMN credit_status TEXT CHECK (credit_status IN ('none', 'reserved', 'consumed', 'released'));
    END IF;
END $$;

-- Backfill based on actual approved transactions
UPDATE public.customer_plate_consultations c
SET payment_coverage_type = 'mercadopago'
WHERE c.payment_coverage_type IS NULL
  AND EXISTS (
      SELECT 1 FROM public.payment_transactions pt
      WHERE pt.consultation_id = c.id
        AND pt.status = 'approved'
  );

-- Consultations without payment confirmation marked as legacy_unknown
UPDATE public.customer_plate_consultations
SET payment_coverage_type = 'legacy_unknown'
WHERE payment_coverage_type IS NULL;

-- Default for future consultations
ALTER TABLE public.customer_plate_consultations 
    ALTER COLUMN payment_coverage_type SET DEFAULT 'mercadopago';

-- ------------------------------------------------------------------------------
-- 7. RPC: grant_credit_package (Admin Only, Atomic, Idempotent)
-- ------------------------------------------------------------------------------
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
    -- 1. Validate caller is admin
    IF NOT public.is_admin() THEN
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

-- ------------------------------------------------------------------------------
-- 8. RPC: reserve_credit_for_consultation (Pessimistic Locking, FIFO, Mutex with MP)
-- ------------------------------------------------------------------------------
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

    -- 12. Audit Log
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        actor_id,
        actor_type,
        event_name,
        metadata
    ) VALUES (
        p_consultation_id,
        v_user_id,
        'customer',
        'credit_reserved',
        jsonb_build_object(
            'reservation_id', v_reservation_id,
            'package_id', v_package_id,
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

-- ------------------------------------------------------------------------------
-- 9. RPC: consume_reserved_credit (Live Report Guard, Production Mock Block)
-- ------------------------------------------------------------------------------
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

    -- 8. Audit Log
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        actor_type,
        event_name,
        metadata
    ) VALUES (
        p_consultation_id,
        'system',
        'credit_consumed',
        jsonb_build_object(
            'reservation_id', v_res_id,
            'package_id', v_package_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'CONSUME_SUCCESS',
        'message_safe', 'Crédito consumido com sucesso após entrega.',
        'reservation_id', v_res_id,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. RPC: release_reserved_credit (Compensatory Rollback on Delivery Failure)
-- ------------------------------------------------------------------------------
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

    -- 5. Restore Package Remaining Credits (if package is not cancelled)
    UPDATE public.customer_credit_packages
    SET credits_remaining = credits_remaining + 1,
        status = CASE WHEN status = 'exhausted' THEN 'active' ELSE status END,
        updated_at = timezone('utc', now())
    WHERE id = v_package_id
      AND status != 'cancelled';

    -- 6. Lock and Update Aggregated Balance
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

    -- 9. Audit Log
    INSERT INTO public.consultation_audit_logs (
        consultation_id,
        actor_type,
        event_name,
        metadata
    ) VALUES (
        p_consultation_id,
        'system',
        'credit_released',
        jsonb_build_object(
            'reservation_id', v_res_id,
            'package_id', v_package_id,
            'reason_code', p_reason_code
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'RELEASE_SUCCESS',
        'message_safe', 'Crédito devolvido ao saldo disponível com sucesso.',
        'reservation_id', v_res_id,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. RPC: adjust_credit_package (Admin Manual Adjustment)
-- ------------------------------------------------------------------------------
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
    IF NOT public.is_admin() THEN
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
            'reason_code', p_reason_code
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'ADJUSTMENT_SUCCESS',
        'message_safe', 'Ajuste de créditos executado com sucesso.',
        'package_id', p_package_id,
        'available_credits', v_avail,
        'reserved_credits', v_res,
        'consumed_credits', v_cons
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. REVOKE & GRANT PERMISSIONS
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credit_package(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reserve_credit_for_consultation(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_credit_for_consultation(UUID, TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consume_reserved_credit(UUID, UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_reserved_credit(UUID, UUID, BOOLEAN, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.release_reserved_credit(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_reserved_credit(UUID, TEXT, TEXT) TO service_role, authenticated;

REVOKE ALL ON FUNCTION public.adjust_credit_package(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_credit_package(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT) TO authenticated, service_role;
