-- ==============================================================================
-- Migration: 20260918100000_create_credit_package_offers_and_orders.sql
-- Description: Tabelas de catálogo comercial de ofertas vendáveis (credit_package_offers),
--              pedidos de compra de pacotes de crédito (credit_package_orders),
--              índices de performance e seed idempotente com ofertas iniciais.
-- ==============================================================================

-- 1. TABELA: credit_package_offers (Catálogo Comercial Vendável)
CREATE TABLE IF NOT EXISTS public.credit_package_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_label TEXT,
    description TEXT,
    package_type TEXT NOT NULL DEFAULT 'standard' 
        CHECK (package_type IN ('standard', 'agency', 'reseller', 'fleet', 'custom')),
    credits_quantity INTEGER NOT NULL CHECK (credits_quantity > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    reference_individual_price_cents INTEGER,
    discount_percent NUMERIC(5,2),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    contact_only BOOLEAN NOT NULL DEFAULT FALSE,
    requires_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    validity_days INTEGER CHECK (validity_days IS NULL OR validity_days > 0),
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms_summary TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    published_at TIMESTAMPTZ
);

-- Regra: contact_only obriga requires_whatsapp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_contact_only_whatsapp'
    ) THEN
        ALTER TABLE public.credit_package_offers
            ADD CONSTRAINT check_contact_only_whatsapp 
            CHECK (NOT contact_only OR (contact_only AND requires_whatsapp));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_package_offers_active_order 
    ON public.credit_package_offers (is_active, display_order ASC);

-- 2. TABELA: credit_package_orders (Pedidos Financeiros de Pacotes)
CREATE TABLE IF NOT EXISTS public.credit_package_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES public.credit_package_offers(id) ON DELETE RESTRICT,
    offer_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity = 1),
    credits_quantity INTEGER NOT NULL CHECK (credits_quantity > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
    reference_individual_price_cents INTEGER,
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    discount_percent NUMERIC(5,2),
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'payment_in_process', 'paid', 'rejected', 'cancelled', 'refunded', 'manual_review')),
    payment_transaction_id UUID,
    mp_preference_id TEXT UNIQUE,
    mp_payment_id TEXT UNIQUE,
    external_reference TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    granted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credit_package_orders_user_status 
    ON public.credit_package_orders (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_package_orders_external_ref 
    ON public.credit_package_orders (external_reference);
CREATE INDEX IF NOT EXISTS idx_credit_package_orders_idempotency 
    ON public.credit_package_orders (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_credit_package_orders_preference 
    ON public.credit_package_orders (mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_credit_package_orders_payment 
    ON public.credit_package_orders (mp_payment_id);

-- 3. SEED IDEMPOTENTE: 4 Ofertas Iniciais
INSERT INTO public.credit_package_offers (
    slug,
    name,
    short_label,
    description,
    package_type,
    credits_quantity,
    price_cents,
    currency,
    reference_individual_price_cents,
    discount_percent,
    display_order,
    is_active,
    is_featured,
    contact_only,
    requires_whatsapp,
    validity_days,
    benefits,
    published_at
) VALUES 
(
    'pacote-inicial-5',
    'Pacote Inicial',
    'Autônomo',
    'Ideal para quem compra ou vende veículos com frequência moderada.',
    'standard',
    5,
    18000, -- R$ 180,00 (R$ 36,00 por consulta)
    'BRL',
    3990,  -- Referência R$ 39,90
    9.77,
    1,
    true,
    false,
    false,
    false,
    null,
    '["5 laudos veiculares completos", "Liberação imediata em 1 clique", "Sem taxa de cartão a cada placa", "Créditos sem data de expiração"]'::jsonb,
    timezone('utc', now())
),
(
    'pacote-lojista-15',
    'Pacote Lojista & Revenda',
    'Mais Recomendado',
    'O pacote preferido de lojistas de motos, corretores e revendas.',
    'reseller',
    15,
    51000, -- R$ 510,00 (R$ 34,00 por consulta)
    'BRL',
    3990,  -- Referência R$ 39,90
    14.79,
    2,
    true,
    true,
    false,
    false,
    null,
    '["15 laudos veiculares completos", "Economia progressiva garantida", "Prioridade na fila de processamento", "Canal dedicado via WhatsApp"]'::jsonb,
    timezone('utc', now())
),
(
    'pacote-frotista-30',
    'Pacote Frotista & Despachante',
    'Melhor Custo-Benefício',
    'Máxima produtividade para quem avalia veículos diariamente.',
    'fleet',
    30,
    96000, -- R$ 960,00 (R$ 32,00 por consulta)
    'BRL',
    3990,  -- Referência R$ 39,90
    19.80,
    3,
    true,
    false,
    false,
    false,
    null,
    '["30 laudos veiculares completos", "Menor custo por placa consultada", "Histórico e auditoria centralizados", "Suporte prioritário exclusivo", "Créditos não expiram"]'::jsonb,
    timezone('utc', now())
),
(
    'pacote-customizado-50',
    'Volume Customizado',
    'Sob Medida PJ',
    'Condição sob medida para leilões, concessionárias e grandes frotas.',
    'custom',
    50,
    0,     -- Negociação sob medida
    'BRL',
    3990,
    null,
    4,
    true,
    false,
    true,  -- Exclusivo WhatsApp
    true,  -- Requer WhatsApp
    null,
    '["Volume a partir de 50 consultas", "Faturamento ou PIX PJ direto", "Atendimento direto com a diretoria", "Garantia de disponibilidade SLA"]'::jsonb,
    timezone('utc', now())
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    short_label = EXCLUDED.short_label,
    description = EXCLUDED.description,
    package_type = EXCLUDED.package_type,
    credits_quantity = EXCLUDED.credits_quantity,
    price_cents = EXCLUDED.price_cents,
    reference_individual_price_cents = EXCLUDED.reference_individual_price_cents,
    discount_percent = EXCLUDED.discount_percent,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    contact_only = EXCLUDED.contact_only,
    requires_whatsapp = EXCLUDED.requires_whatsapp,
    benefits = EXCLUDED.benefits,
    updated_at = timezone('utc', now());
