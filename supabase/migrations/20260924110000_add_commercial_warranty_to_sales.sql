-- Migration: Add Commercial Warranty Fields to Sales
-- Date: 2026-09-24
-- Description: Implementação de controle de garantia comercial para motocicletas vendidas (3 meses-calendário a partir da 1ª emissão do contrato/recibo).
-- Feature: Controle de Garantia Comercial de Motocicletas Vendidas

-- 1. Adicionar colunas de controle de garantia comercial na tabela public.sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS warranty_months integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS warranty_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS warranty_ends_at date;

-- 2. Constraints de integridade e coerência de datas
DO $$
BEGIN
  -- Prazo de garantia em meses válido (1 a 60 meses)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_warranty_months_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_warranty_months_check
      CHECK (warranty_months > 0 AND warranty_months <= 60);
  END IF;

  -- Coerência: se existir início, deve existir fim; e a data final não pode ser anterior à data de início
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_warranty_dates_coherence_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_warranty_dates_coherence_check
      CHECK (
        (warranty_issued_at IS NULL AND warranty_ends_at IS NULL)
        OR
        (
          warranty_issued_at IS NOT NULL
          AND warranty_ends_at IS NOT NULL
          AND warranty_ends_at >= (warranty_issued_at AT TIME ZONE 'America/Sao_Paulo')::date
        )
      );
  END IF;

  -- Repasse não pode possuir garantia comercial preenchida
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_repasse_no_warranty_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_repasse_no_warranty_check
      CHECK (
        is_repasse IS NOT TRUE
        OR (warranty_issued_at IS NULL AND warranty_ends_at IS NULL)
      );
  END IF;
END $$;

-- 3. Índice para consultas e filtros administrativos por vencimento da garantia
CREATE INDEX IF NOT EXISTS idx_sales_warranty_ends_at
  ON public.sales (warranty_ends_at)
  WHERE warranty_ends_at IS NOT NULL;

-- 4. Comentários explicativos para documentação de schema
COMMENT ON COLUMN public.sales.warranty_months IS 'Duração padrão da garantia comercial em meses-calendário (default: 3 meses).';
COMMENT ON COLUMN public.sales.warranty_issued_at IS 'Timestamp oficial da 1ª emissão do contrato/recibo em PDF (marco inicial da garantia comercial).';
COMMENT ON COLUMN public.sales.warranty_ends_at IS 'Data calendário final inclusiva da garantia comercial (calculada por meses-calendário a partir da 1ª emissão em America/Sao_Paulo).';
