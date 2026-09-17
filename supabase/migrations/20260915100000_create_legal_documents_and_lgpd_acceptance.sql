-- ==============================================================================
-- Migration: 20260915100000_create_legal_documents_and_lgpd_acceptance.sql
-- Feature: 038 - Política de Privacidade, Termos de Uso e Registro de Aceite LGPD
-- Description: Cria tabelas versionadas de documentos legais com SHA-256,
--              registro append-only de aceites de usuários e protocolos LGPD.
-- ==============================================================================

-- 1. Tabela de Tipos de Documentos Legais
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Versões de Documentos Legais (Imutável após publicação)
CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content_markdown TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  effective_at TIMESTAMPTZ,
  requires_reacceptance BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_legal_document_version UNIQUE (document_id, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_doc_versions_lookup
  ON public.legal_document_versions (document_id, status);

-- 3. Tabela de Aceites de Documentos Legais (Append-Only)
CREATE TABLE IF NOT EXISTS public.legal_document_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_version_id UUID NOT NULL REFERENCES public.legal_document_versions(id) ON DELETE RESTRICT,
  document_slug TEXT NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acceptance_source TEXT NOT NULL CHECK (
    acceptance_source IN ('signup', 'login_reacceptance', 'account_settings', 'checkout', 'oauth_completion')
  ),
  ip_hash TEXT,
  user_agent_category TEXT,
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_document_acceptance UNIQUE (user_id, document_version_id)
);

CREATE INDEX IF NOT EXISTS idx_legal_doc_acceptances_user
  ON public.legal_document_acceptances (user_id);

CREATE INDEX IF NOT EXISTS idx_legal_doc_acceptances_slug_version
  ON public.legal_document_acceptances (document_slug, version);

-- 4. Tabela de Solicitações LGPD de Titulares de Dados (Art. 18)
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_number TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL CHECK (
    request_type IN (
      'confirmation',
      'access',
      'correction',
      'anonymization_or_deletion',
      'portability',
      'sharing_info',
      'consent_revocation',
      'other'
    )
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_analysis', 'completed', 'rejected')
  ),
  details TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  response_notes TEXT,
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user
  ON public.privacy_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_status
  ON public.privacy_requests (status);

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

-- 1. legal_documents: Leitura pública de documentos ativos, modificação apenas por admin ativo
DROP POLICY IF EXISTS "Public can view active legal documents" ON public.legal_documents;
CREATE POLICY "Public can view active legal documents"
  ON public.legal_documents FOR SELECT
  USING (is_active = true OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins can manage legal documents" ON public.legal_documents;
CREATE POLICY "Admins can manage legal documents"
  ON public.legal_documents FOR ALL TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 2. legal_document_versions: Público vê somente publicados; Admin vê todos e gerencia
DROP POLICY IF EXISTS "Public can view published legal document versions" ON public.legal_document_versions;
CREATE POLICY "Public can view published legal document versions"
  ON public.legal_document_versions FOR SELECT
  USING (status = 'published' OR public.is_active_admin());

DROP POLICY IF EXISTS "Admins can insert legal document versions" ON public.legal_document_versions;
CREATE POLICY "Admins can insert legal document versions"
  ON public.legal_document_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_active_admin());

DROP POLICY IF EXISTS "Admins can update draft legal document versions" ON public.legal_document_versions;
CREATE POLICY "Admins can update draft legal document versions"
  ON public.legal_document_versions FOR UPDATE TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- 3. legal_document_acceptances: Clientes vêem e inserem seus próprios aceites; Admin audita
DROP POLICY IF EXISTS "Users view own legal acceptances" ON public.legal_document_acceptances;
CREATE POLICY "Users view own legal acceptances"
  ON public.legal_document_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_active_admin());

DROP POLICY IF EXISTS "Users insert own legal acceptances" ON public.legal_document_acceptances;
CREATE POLICY "Users insert own legal acceptances"
  ON public.legal_document_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. privacy_requests: Clientes vêem e criam suas solicitações; Admin gerencia e responde
DROP POLICY IF EXISTS "Users view own privacy requests" ON public.privacy_requests;
CREATE POLICY "Users view own privacy requests"
  ON public.privacy_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_active_admin());

DROP POLICY IF EXISTS "Users create own privacy requests" ON public.privacy_requests;
CREATE POLICY "Users create own privacy requests"
  ON public.privacy_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update privacy requests" ON public.privacy_requests;
CREATE POLICY "Admins update privacy requests"
  ON public.privacy_requests FOR UPDATE TO authenticated
  USING (public.is_active_admin())
  WITH CHECK (public.is_active_admin());

-- ==============================================================================
-- SEED INICIAL DE DOCUMENTOS LEGAIS
-- ==============================================================================

INSERT INTO public.legal_documents (slug, name, description)
VALUES 
  ('privacy_policy', 'Política de Privacidade', 'Política de Privacidade e Tratamento de Dados Pessoais em conformidade com a LGPD'),
  ('terms_of_use', 'Termos de Uso', 'Termos e Condições Gerais de Uso da Plataforma e Serviços da AF Motos')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;
