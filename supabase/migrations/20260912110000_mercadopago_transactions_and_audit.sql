-- ============================================================
-- Migration: 20260912110000_mercadopago_transactions_and_audit
-- Description: Tables, indexes, and RLS for Mercado Pago payment integration,
--              webhook idempotency events, and consultation audit trail.
-- ============================================================

-- 1. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mp_payment_id TEXT UNIQUE,
    mp_preference_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back')),
    status_detail TEXT,
    payment_method_id TEXT,
    payment_type_id TEXT,
    transaction_amount NUMERIC(10,2) NOT NULL CHECK (transaction_amount >= 0),
    net_received_amount NUMERIC(10,2),
    installments INTEGER NOT NULL DEFAULT 1,
    payer_email TEXT,
    payer_identification_type TEXT,
    payer_identification_number TEXT,
    refund_status TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'refunded', 'failed')),
    refund_amount NUMERIC(10,2),
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    mp_refund_id TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_consultation ON public.payment_transactions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mp_payment ON public.payment_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- 2. Webhook Events Table (Auditing & Idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE,
    event_type TEXT NOT NULL,
    action TEXT,
    mp_resource_id TEXT,
    signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'ignored', 'failed')),
    processing_error TEXT,
    payload JSONB NOT NULL,
    headers JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_resource ON public.webhook_events(mp_resource_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- 3. Consultation Audit Logs Table
CREATE TABLE IF NOT EXISTS public.consultation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('customer', 'system', 'admin', 'webhook')),
    event TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_audit_logs_consultation ON public.consultation_audit_logs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_audit_logs_created_at ON public.consultation_audit_logs(created_at DESC);

-- 4. Extend customer_plate_consultations with payment metadata
ALTER TABLE public.customer_plate_consultations
    ADD COLUMN IF NOT EXISTS latest_payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lookup_error_message TEXT,
    ADD COLUMN IF NOT EXISTS auto_refund_attempted BOOLEAN DEFAULT FALSE;

-- 5. Row Level Security Policies

-- payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.payment_transactions;
CREATE POLICY "Customers can view their own transactions"
    ON public.payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all transactions"
    ON public.payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.id = auth.uid()
            AND admin_profiles.is_active = true
        )
    );

-- webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;
CREATE POLICY "Admins can view webhook events"
    ON public.webhook_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.id = auth.uid()
            AND admin_profiles.is_active = true
        )
    );

-- consultation_audit_logs
ALTER TABLE public.consultation_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view logs for their own consultations" ON public.consultation_audit_logs;
CREATE POLICY "Customers can view logs for their own consultations"
    ON public.consultation_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.customer_plate_consultations
            WHERE customer_plate_consultations.id = consultation_audit_logs.consultation_id
            AND customer_plate_consultations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.consultation_audit_logs;
CREATE POLICY "Admins can view all audit logs"
    ON public.consultation_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE admin_profiles.id = auth.uid()
            AND admin_profiles.is_active = true
        )
    );
