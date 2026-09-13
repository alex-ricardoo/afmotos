# Data Model: Screen-Driven Delivery Retries & Safe Refunds

## 1. Entidades Reutilizadas (Sem alterações destrutivas)

Todas as tabelas foram introduzidas ou atualizadas na PR #8 e continuam como a fonte canônica de persistência:

### `customer_plate_consultations`
- `id`: UUID (PK)
- `user_id`: UUID (FK para auth.users)
- `plate`: VARCHAR
- `plate_normalized`: VARCHAR
- `status`: VARCHAR CHECK (`pending`, `paid`, `approved_pending_report`, `retry_scheduled`, `completed`, `failed_permanent`, `refund_pending`, `refunded`, `manual_review`)
- `payment_status`: VARCHAR CHECK (`pending`, `paid`, `refunded`, `cancelled`)
- `latest_payment_transaction_id`: UUID (FK)
- `vehicle_data`: JSONB (dados oficiais do laudo)
- `source_consultation_id`: UUID (referência de cache)
- `auto_refund_attempted`: BOOLEAN DEFAULT FALSE

### `consultation_delivery_jobs`
- `id`: UUID (PK)
- `consultation_id`: UUID (FK)
- `transaction_id`: UUID (FK)
- `status`: VARCHAR CHECK (`pending`, `processing`, `retry_scheduled`, `completed`, `failed_permanent`, `cancelled`)
- `attempt_count`: INTEGER DEFAULT 1
- `max_attempts`: INTEGER DEFAULT 5
- `next_retry_at`: TIMESTAMPTZ NULL
- `last_error_code`: VARCHAR NULL
- `last_error_message_safe`: TEXT NULL
- `last_failure_class`: VARCHAR NULL (`transient`, `permanent`, `unknown`)
- `locked_at`: TIMESTAMPTZ NULL
- `locked_by`: TEXT NULL
- `lock_expires_at`: TIMESTAMPTZ NULL

### `payment_refunds`
- `id`: UUID (PK)
- `transaction_id`: UUID (FK)
- `consultation_id`: UUID (FK)
- `provider`: VARCHAR ('mercadopago')
- `provider_payment_id`: VARCHAR (mp_payment_id)
- `provider_refund_id`: VARCHAR NULL
- `amount_cents`: INTEGER
- `currency`: VARCHAR ('BRL')
- `status`: VARCHAR CHECK (`requested`, `pending`, `confirmed`, `failed`, `manual_review`)
- `reason_code`: VARCHAR
- `reason_safe`: TEXT
- `request_attempts`: INTEGER DEFAULT 1
- `requested_at`: TIMESTAMPTZ
- `confirmed_at`: TIMESTAMPTZ NULL
- `failed_at`: TIMESTAMPTZ NULL

### `consultation_audit_logs`
- `id`: UUID (PK)
- `consultation_id`: UUID NULL
- `transaction_id`: UUID NULL
- `actor_id`: UUID NULL
- `actor_type`: VARCHAR ('webhook', 'customer', 'admin', 'system')
- `event`: VARCHAR
- `details`: JSONB
- `created_at`: TIMESTAMPTZ
