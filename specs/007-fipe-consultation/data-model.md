# Data Model: Consulta Tabela FIPE

**Feature**: 007-fipe-consultation
**Date**: 2026-08-22

## Entity: `fipe_consultations`

Snapshot de uma consulta de valor de referência FIPE realizada pelo administrador. Cada registro é imutável após criação (exceto `notes` e `motorcycle_id`).

### Fields

| Campo | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | ❌ | `gen_random_uuid()` | PK |
| `created_by` | `uuid` | ❌ | — | FK → `auth.users(id)`, ON DELETE RESTRICT |
| `motorcycle_id` | `uuid` | ✅ | `null` | FK → `public.motorcycles(id)`, ON DELETE SET NULL |
| `provider` | `text` | ❌ | `'fipex'` | Identificador interno do provider |
| `provider_label` | `text` | ❌ | `'fipeX'` | Nome de exibição do provider |
| `vehicle_type_id` | `text` | ❌ | — | UUID do tipo de veículo na API |
| `vehicle_type_label` | `text` | ✅ | — | Nome do tipo (ex: "Motocicletas") |
| `brand_id` | `text` | ✅ | — | UUID da marca na API |
| `brand_name` | `text` | ❌ | — | Nome da marca (ex: "Honda") |
| `model_id` | `text` | ✅ | — | UUID do modelo na API |
| `model_name` | `text` | ❌ | — | Nome do modelo (ex: "CG 160 Fan") |
| `version_name` | `text` | ✅ | — | Nome da versão, se disponível |
| `model_year` | `integer` | ✅ | — | Ano-modelo (null para 0km) |
| `is_zero_km` | `boolean` | ❌ | `false` | Verdadeiro se veículo 0km |
| `fuel_id` | `text` | ✅ | — | UUID do combustível na API |
| `fuel_name` | `text` | ✅ | — | Nome do combustível (ex: "Gasolina") |
| `fuel_acronym` | `text` | ✅ | — | Acrônimo (ex: "g") |
| `reference_period_id` | `text` | ✅ | — | UUID do período de referência na API |
| `reference_month` | `integer` | ✅ | — | Mês da referência (1-12) |
| `reference_year` | `integer` | ✅ | — | Ano da referência |
| `reference_label` | `text` | ✅ | — | Label formatado (ex: "Agosto 2026") |
| `fipe_code` | `text` | ✅ | — | Código FIPE (ex: "811049-7") |
| `fipe_price` | `numeric(12,2)` | ✅ | — | Preço em reais (convertido de centavos) |
| `currency` | `text` | ❌ | `'BRL'` | Moeda |
| `query_payload` | `jsonb` | ❌ | `'{}'` | Parâmetros enviados na consulta |
| `response_snapshot` | `jsonb` | ❌ | `'{}'` | Resposta completa da API (sem tokens) |
| `notes` | `text` | ✅ | — | Nota interna do administrador |
| `created_at` | `timestamptz` | ❌ | `now()` | Momento da consulta |
| `updated_at` | `timestamptz` | ❌ | `now()` | Atualizado via trigger |

### Constraints

```sql
CHECK (fipe_price IS NULL OR fipe_price >= 0)
CHECK (currency = 'BRL')
CHECK (reference_month IS NULL OR (reference_month >= 1 AND reference_month <= 12))
```

### Indexes

| Index | Colunas | Tipo | Justificativa |
|---|---|---|---|
| `fipe_consultations_created_by_idx` | `created_by` | B-tree | Filtro por usuário |
| `fipe_consultations_motorcycle_id_idx` | `motorcycle_id` | B-tree | Lookup de consultas por moto |
| `fipe_consultations_brand_model_idx` | `brand_name, model_name` | B-tree | Busca por marca+modelo |
| `fipe_consultations_created_at_idx` | `created_at DESC` | B-tree | Ordenação cronológica (histórico) |

### Trigger

```sql
CREATE TRIGGER update_fipe_consultations_updated_at
  BEFORE UPDATE ON public.fipe_consultations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
```

Reutiliza a função `update_updated_at_column()` já existente na migration `001_initial_schema.sql`.

### RLS Policies

| Policy | Operation | Condition |
|---|---|---|
| `admin_select_fipe_consultations` | SELECT | `is_admin()` |
| `admin_insert_fipe_consultations` | INSERT | `is_admin() AND created_by = auth.uid()` |
| `admin_update_fipe_consultations` | UPDATE | `is_admin() AND created_by = auth.uid()` |
| `admin_delete_fipe_consultations` | DELETE | `is_admin()` |

### Relationships

```
fipe_consultations.created_by → auth.users.id (N:1, RESTRICT)
fipe_consultations.motorcycle_id → motorcycles.id (N:1, SET NULL)
```

Uma motocicleta pode ter múltiplas consultas FIPE vinculadas (diferentes datas, diferentes períodos de referência). Uma consulta pode existir sem vínculo a uma moto.

---

## Migration SQL Completa

Arquivo: `supabase/migrations/00022_create_fipe_consultations.sql`

```sql
-- Tabela para armazenar snapshots de consultas FIPE realizadas pelo admin
CREATE TABLE IF NOT EXISTS public.fipe_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem consultou
  created_by uuid NOT NULL
    REFERENCES auth.users(id)
    ON DELETE RESTRICT,

  -- Moto vinculada (opcional)
  motorcycle_id uuid
    REFERENCES public.motorcycles(id)
    ON DELETE SET NULL,

  -- Provider
  provider text NOT NULL DEFAULT 'fipex',
  provider_label text NOT NULL DEFAULT 'fipeX',

  -- Tipo de veículo
  vehicle_type_id text NOT NULL,
  vehicle_type_label text,

  -- Marca
  brand_id text,
  brand_name text NOT NULL,

  -- Modelo
  model_id text,
  model_name text NOT NULL,
  version_name text,

  -- Ano
  model_year integer,
  is_zero_km boolean NOT NULL DEFAULT false,

  -- Combustível
  fuel_id text,
  fuel_name text,
  fuel_acronym text,

  -- Referência
  reference_period_id text,
  reference_month integer CHECK (reference_month IS NULL OR (reference_month >= 1 AND reference_month <= 12)),
  reference_year integer,
  reference_label text,

  -- Preço
  fipe_code text,
  fipe_price numeric(12, 2) CHECK (fipe_price IS NULL OR fipe_price >= 0),
  currency text NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),

  -- Payloads
  query_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Nota interna
  notes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.fipe_consultations IS 'Snapshots de consultas de referência FIPE via fipeX, realizadas pelo admin para apoio à negociação.';
COMMENT ON COLUMN public.fipe_consultations.fipe_price IS 'Preço de referência em reais (convertido de centavos da API).';
COMMENT ON COLUMN public.fipe_consultations.query_payload IS 'Parâmetros utilizados na consulta (para reconsulta).';
COMMENT ON COLUMN public.fipe_consultations.response_snapshot IS 'Resposta completa da API para auditoria. Não deve conter tokens ou segredos.';

-- Índices
CREATE INDEX IF NOT EXISTS fipe_consultations_created_by_idx
  ON public.fipe_consultations (created_by);

CREATE INDEX IF NOT EXISTS fipe_consultations_motorcycle_id_idx
  ON public.fipe_consultations (motorcycle_id);

CREATE INDEX IF NOT EXISTS fipe_consultations_brand_model_idx
  ON public.fipe_consultations (brand_name, model_name);

CREATE INDEX IF NOT EXISTS fipe_consultations_created_at_idx
  ON public.fipe_consultations (created_at DESC);

-- Trigger updated_at (reutiliza função existente de 001_initial_schema.sql)
DROP TRIGGER IF EXISTS update_fipe_consultations_updated_at ON public.fipe_consultations;
CREATE TRIGGER update_fipe_consultations_updated_at
  BEFORE UPDATE ON public.fipe_consultations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE public.fipe_consultations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS admin_select_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_select_fipe_consultations
  ON public.fipe_consultations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS admin_insert_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_insert_fipe_consultations
  ON public.fipe_consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS admin_update_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_update_fipe_consultations
  ON public.fipe_consultations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND created_by = auth.uid())
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS admin_delete_fipe_consultations ON public.fipe_consultations;
CREATE POLICY admin_delete_fipe_consultations
  ON public.fipe_consultations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
```

### Rollback

```sql
DROP TRIGGER IF EXISTS update_fipe_consultations_updated_at ON public.fipe_consultations;
DROP TABLE IF EXISTS public.fipe_consultations;
```

⚠️ O rollback remove todo o histórico de consultas FIPE. Não afeta `motorcycles`, `leads`, ou qualquer outra tabela.
