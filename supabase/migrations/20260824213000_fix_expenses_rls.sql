-- =========================================================
-- Migration: Fix RLS Policies for Expenses and Expense Categories
-- =========================================================

-- 1. Desbloquear e ajustar RLS de categorias de gastos para usuários autenticados
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins have full access to expense_categories" ON public.expense_categories;

CREATE POLICY "Admins have full access to expense_categories"
ON public.expense_categories
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 2. Desbloquear e ajustar RLS de gastos
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins have full access to expenses" ON public.expenses;

CREATE POLICY "Admins have full access to expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 3. Inserir ou garantir as categorias padrão
INSERT INTO public.expense_categories (name, slug, expense_type, sort_order)
VALUES
  ('Manutenção', 'manutencao', 'MOTO', 1),
  ('Revisão', 'revisao', 'MOTO', 2),
  ('Óleo e Filtros', 'oleo-filtros', 'MOTO', 3),
  ('Pneus', 'pneus', 'MOTO', 4),
  ('Bateria', 'bateria', 'MOTO', 5),
  ('Peças', 'pecas', 'MOTO', 6),
  ('Combustível Moto', 'combustivel-moto', 'MOTO', 7),
  ('Estética e Lavagem', 'estetica-lavagem', 'MOTO', 8),
  ('Documentação Moto', 'documentacao-moto', 'MOTO', 9),
  ('Seguro Moto', 'seguro-moto', 'MOTO', 10),
  ('Guincho', 'guincho', 'MOTO', 11),
  ('Preparação Venda', 'preparacao-venda', 'MOTO', 12),
  ('Preparação Aluguel', 'preparacao-aluguel', 'MOTO', 13),
  ('Outros Gastos Moto', 'outros-moto', 'MOTO', 14),
  ('Aluguel da Loja', 'aluguel-loja', 'LOJA', 15),
  ('Energia Elétrica', 'energia-eletrica', 'LOJA', 16),
  ('Água', 'agua', 'LOJA', 17),
  ('Internet e Telefone', 'internet-telefone', 'LOJA', 18),
  ('Ar-Condicionado', 'ar-condicionado', 'LOJA', 19),
  ('Limpeza e Conservação', 'limpeza-conservacao', 'LOJA', 20),
  ('Material de Escritório', 'material-escritorio', 'LOJA', 21),
  ('Marketing e Anúncios', 'marketing-anuncios', 'LOJA', 22),
  ('Contabilidade', 'contabilidade', 'LOJA', 23),
  ('Impostos e Taxas', 'impostos-taxas', 'LOJA', 24),
  ('Salários e Comissões', 'salarios-comissoes', 'LOJA', 25),
  ('Taxas Bancárias', 'taxas-bancarias', 'LOJA', 26),
  ('Software e Assinaturas', 'software-assinaturas', 'LOJA', 27),
  ('Manutenção da Loja', 'manutencao-loja', 'LOJA', 28),
  ('Outros Gastos Gerais', 'outros-gerais', 'LOJA', 29)
ON CONFLICT (slug) DO NOTHING;
