-- Adiciona coluna fipe_price na tabela motorcycles
ALTER TABLE motorcycles ADD COLUMN fipe_price numeric(12,2) CHECK (fipe_price >= 0);
