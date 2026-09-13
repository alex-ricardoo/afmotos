# Data Model & Schema Audit: Mock vs Live Vehicle Consultations

---

## 1. Schema Existente no PostgreSQL

### Tabela: `public.vehicle_plate_consultations`
Criada pela migration `20260830100000_create_vehicle_plate_consultations.sql`.

| Coluna | Tipo | Nullable | Padrão | Descrição / Uso no Hotfix |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Não | `gen_random_uuid()` | Identificador primário |
| `plate_normalized` | `text` | Não | - | Placa sem máscara (ex: `PFX3G12`) |
| `plate_display` | `text` | Não | - | Placa formatada |
| `provider` | `text` | Não | `'apibrasil'` | Provedor de dados veiculares |
| `raw_response` | `jsonb` | Não | - | Resposta bruta integral |
| `response_schema_version`| `text` | Não | `'1.0'` | Versão do schema da resposta |
| `status` | `text` | Não | - | `'COMPLETED'`, `'FAILED'`, etc. |
| `mode` | `text` | Não | - | `'live'` ou `'mock'` |
| `is_mock` | `boolean`| Não | `true` | `false` para consulta real paga da API Brasil |
| `is_chargeable` | `boolean`| Não | `false`| Consumiu crédito |
| `charged_amount` | `numeric`| Não | `0.00` | Valor tarifado em Reais |
| `consulted_at` | `timestamptz`| Não | `now()` | Data/hora da consulta |

### Tabela: `public.customer_plate_consultations`
Criada por `20260911000000_create_customer_area.sql` e estendida por `20260912110000_mercadopago_transactions_and_audit.sql` e `20260913180000_expand_consultation_status_constraints.sql`.

| Coluna | Tipo | Nullable | Padrão | Descrição / Uso no Hotfix |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Não | `gen_random_uuid()` | ID da consulta do cliente |
| `user_id` | `uuid` | Não | - | Chave estrangeira para `customer_profiles` |
| `plate_normalized` | `text` | Não | - | Placa normalizada |
| `vehicle_data` | `jsonb` | Sim | `null` | Snapshot dos dados veiculares entregues |
| `source_consultation_id`| `uuid` | Sim | `null` | Aponta para `vehicle_plate_consultations(id)` |
| `status` | `text` | Não | `'pending'`| Ciclo de vida (`'completed'`, etc.) |
| `payment_status` | `text` | Não | `'unpaid'` | `'unpaid'`, `'paid'`, `'refunded'` |
| `latest_payment_transaction_id` | `uuid` | Sim | `null` | Transação de pagamento associada |

---

## 2. Necessidade de Novas Migrations

Após inspeção minuciosa dos arquivos de migração:
- As colunas `provider`, `mode`, `is_mock`, `status`, `raw_response` e `response_schema_version` **JÁ EXISTEM** nativamente em `vehicle_plate_consultations` com tipos e restrições apropriados.
- Na tabela `vehicle_plate_consultations`, já existem índices:
  - `idx_vpc_plate_normalized` (`plate_normalized`)
  - `idx_vpc_consulted_at` (`consulted_at DESC`)
  - `idx_vpc_status` (`status`)
  - `idx_vpc_is_mock` (`is_mock`)
- **Conclusão**: Nenhuma migration estrutural destrutiva é necessária. O schema existente já possui todo o suporte para discriminação entre mock e live.
- **Índice Composto Otimizado Adicional (Opcional/Recomendado)**:
  Para máxima eficiência na busca de cache live em alta concorrência:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_vpc_cache_lookup
    ON public.vehicle_plate_consultations (plate_normalized, status, is_mock, consulted_at DESC);
  ```
