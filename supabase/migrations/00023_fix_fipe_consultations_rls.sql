-- Migration: 00023_fix_fipe_consultations_rls.sql
-- Description: Ajuste das políticas RLS para permitir acesso de administradores autenticados

-- Remover políticas restritivas anteriores
DROP POLICY IF EXISTS admin_select_fipe_consultations ON public.fipe_consultations;
DROP POLICY IF EXISTS admin_insert_fipe_consultations ON public.fipe_consultations;
DROP POLICY IF EXISTS admin_update_fipe_consultations ON public.fipe_consultations;
DROP POLICY IF EXISTS admin_delete_fipe_consultations ON public.fipe_consultations;
DROP POLICY IF EXISTS "Admins have full access to fipe_consultations" ON public.fipe_consultations;

-- Política abrangente para administradores autenticados (alinhada com 00017_rls_policies)
CREATE POLICY "Admins have full access to fipe_consultations"
  ON public.fipe_consultations
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
