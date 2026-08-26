-- Adiciona categorias de gastos veiculares comuns (documentação e burocracia de motos)
INSERT INTO public.expense_categories (name, slug, expense_type, sort_order)
VALUES
  ('IPVA', 'ipva', 'MOTO', 30),
  ('Transferência de Propriedade', 'transferencia-propriedade', 'MOTO', 31),
  ('Licenciamento Anual', 'licenciamento-anual', 'MOTO', 32),
  ('DPVAT / Seguro Obrigatório', 'dpvat-seguro-obrigatorio', 'MOTO', 33),
  ('Multas de Trânsito', 'multas-transito', 'MOTO', 34),
  ('Vistoria Veicular', 'vistoria-veicular', 'MOTO', 35),
  ('Emplacamento', 'emplacamento', 'MOTO', 36),
  ('Despachante', 'despachante', 'MOTO', 37)
ON CONFLICT (slug) DO NOTHING;
