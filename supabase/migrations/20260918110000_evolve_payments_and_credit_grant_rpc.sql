-- ==============================================================================
-- Migration: 20260918110000_evolve_payments_and_credit_grant_rpc.sql
-- Description: Evolução de payment_transactions (purpose e credit_package_order_id),
--              extensões em customer_credit_packages, políticas RLS
--              e RPC atômica idempotente grant_credit_package_from_paid_order.
-- ==============================================================================

-- 1. EVOLUÇÃO EM payment_transactions
ALTER TABLE public.payment_transactions 
    ALTER COLUMN consultation_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'payment_transactions' 
          AND column_name = 'purpose'
    ) THEN
        ALTER TABLE public.payment_transactions 
            ADD COLUMN purpose TEXT NOT NULL DEFAULT 'vehicle_consultation'
            CHECK (purpose IN ('vehicle_consultation', 'credit_package'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'payment_transactions' 
          AND column_name = 'credit_package_order_id'
    ) THEN
        ALTER TABLE public.payment_transactions 
            ADD COLUMN credit_package_order_id UUID 
            REFERENCES public.credit_package_orders(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_transaction_purpose_target'
    ) THEN
        ALTER TABLE public.payment_transactions
            ADD CONSTRAINT check_transaction_purpose_target
            CHECK (
                (purpose = 'vehicle_consultation' AND consultation_id IS NOT NULL) OR
                (purpose = 'credit_package' AND credit_package_order_id IS NOT NULL)
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_purpose_order 
    ON public.payment_transactions (purpose, credit_package_order_id);

-- 2. EVOLUÇÃO EM customer_credit_packages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_credit_packages' 
          AND column_name = 'offer_id'
    ) THEN
        ALTER TABLE public.customer_credit_packages 
            ADD COLUMN offer_id UUID 
            REFERENCES public.credit_package_offers(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_credit_packages' 
          AND column_name = 'source'
    ) THEN
        ALTER TABLE public.customer_credit_packages 
            ADD COLUMN source TEXT NOT NULL DEFAULT 'manual_admin'
            CHECK (source IN ('manual_admin', 'mercadopago_package', 'promotional', 'partner', 'test'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_credit_packages' 
          AND column_name = 'purchase_order_id'
    ) THEN
        ALTER TABLE public.customer_credit_packages 
            ADD COLUMN purchase_order_id UUID UNIQUE 
            REFERENCES public.credit_package_orders(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_credit_packages' 
          AND column_name = 'purchase_price_cents'
    ) THEN
        ALTER TABLE public.customer_credit_packages 
            ADD COLUMN purchase_price_cents INTEGER 
            CHECK (purchase_price_cents IS NULL OR purchase_price_cents >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_credit_packages' 
          AND column_name = 'purchase_currency'
    ) THEN
        ALTER TABLE public.customer_credit_packages 
            ADD COLUMN purchase_currency TEXT NOT NULL DEFAULT 'BRL';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'customer_credit_packages' 
          AND column_name = 'purchased_at'
    ) THEN
        ALTER TABLE public.customer_credit_packages 
            ADD COLUMN purchased_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_credit_packages_purchase_order 
    ON public.customer_credit_packages (purchase_order_id);

-- 3. VÍNCULO EM credit_package_orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_credit_package_orders_payment_transaction'
    ) THEN
        ALTER TABLE public.credit_package_orders
            ADD CONSTRAINT fk_credit_package_orders_payment_transaction
            FOREIGN KEY (payment_transaction_id) 
            REFERENCES public.payment_transactions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. POLÍTICAS ROW LEVEL SECURITY (RLS)

-- 4.1 credit_package_offers
ALTER TABLE public.credit_package_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active credit package offers" ON public.credit_package_offers;
CREATE POLICY "Anyone can view active credit package offers"
    ON public.credit_package_offers FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage credit package offers" ON public.credit_package_offers;
CREATE POLICY "Admins manage credit package offers"
    ON public.credit_package_offers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.auth_user_id = auth.uid()
              AND admin_profiles.is_active = true
              AND admin_profiles.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.auth_user_id = auth.uid()
              AND admin_profiles.is_active = true
              AND admin_profiles.role IN ('admin', 'super_admin')
        )
    );

-- 4.2 credit_package_orders
ALTER TABLE public.credit_package_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own credit package orders" ON public.credit_package_orders;
CREATE POLICY "Customers view own credit package orders"
    ON public.credit_package_orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all credit package orders" ON public.credit_package_orders;
CREATE POLICY "Admins view all credit package orders"
    ON public.credit_package_orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.auth_user_id = auth.uid()
              AND admin_profiles.is_active = true
              AND admin_profiles.role IN ('admin', 'super_admin')
        )
    );

-- 5. RPC ATÔMICA E IDEMPOTENTE: grant_credit_package_from_paid_order
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

-- Permissões de execução estritas
REVOKE ALL ON FUNCTION public.grant_credit_package_from_paid_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_credit_package_from_paid_order(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_credit_package_from_paid_order(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
