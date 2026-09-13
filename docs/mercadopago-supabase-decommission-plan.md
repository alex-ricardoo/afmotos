# Plano de Desativação e Governança Supabase — Módulo Mercado Pago

**Data**: 2026-09-12  
**Status**: Não Destrutivo / Tabelas Inativas Preservadas  
**Decisão Recomendada**: Manter tabelas e colunas inativas no banco até que a próxima integração (ex.: Checkout Pro) esteja plenamente homologada.

---

## 1. Tabelas, Colunas e Policies Adicionadas

Durante a implementação da integração Mercado Pago, foram introduzidas as seguintes estruturas via migrações:

### 1.1 Tabelas Criadas
1. **`public.payment_transactions`**:
   - Armazena o ciclo de vida dos pagamentos (cartão, PIX, boleto), ID do provedor (`provider_payment_id`), status, valor e resposta bruta.
2. **`public.webhook_events`**:
   - Registra eventos de webhooks recebidos do Mercado Pago para auditoria e controle de idempotência.
3. **`public.consultation_audit_logs`**:
   - Registra o histórico imutável de transições de status da consulta e correlações financeiras.

### 1.2 Colunas Adicionadas em `public.customer_plate_consultations`
- `latest_payment_transaction_id` (UUID FK para `payment_transactions.id`)
- `auto_refund_attempted` (BOOLEAN DEFAULT FALSE)
- `lookup_error_message` (TEXT)
- `payment_method` (VARCHAR(50))
- `payment_date` (TIMESTAMPTZ)
- `processed_at` (TIMESTAMPTZ)

### 1.3 Policies RLS e Triggers
- RLS em `payment_transactions`: Clientes visualizam apenas suas próprias transações (`user_id = auth.uid()`), Administradores visualizam todas.
- RLS em `webhook_events`: Restrito a service role / admin.
- RLS em `consultation_audit_logs`: Leitura restrita ao dono da consulta e administradores.

---

## 2. Dados Existentes e Risco de Perda de Auditoria

- **Histórico Financeiro**: Registros de tentativas de pagamento, diagnósticos locais e testes reais gerados durante a fase de desenvolvimento/homologação contêm dados históricos de auditoria.
- **Risco de Perda de Auditoria**: Executar `DROP TABLE` ou `DROP COLUMN` neste momento resultaria em perda permanente de rastreabilidade contábil e de compliance, além de inviabilizar a análise forense de eventuais transações reais processadas no período.
- **Isolamento de Impacto**: Nenhuma funcionalidade nativa de consulta, cadastro, laudos ou autenticação depende de dados em `payment_transactions`. As colunas adicionadas em `customer_plate_consultations` são todas anuláveis (`nullable`), portanto a ausência de escrita não afeta em nada consultas antigas ou novas.

---

## 3. Decisão Recomendada

> **Manter as tabelas e colunas inativas no Supabase.**  
> Não executar nenhuma migração destrutiva (`DROP TABLE`, `DROP COLUMN`) no ambiente atual.

### Justificativas:
1. **Zero impacto no código ativo**: A aplicação sem as rotas Mercado Pago simplesmente deixa de realizar INSERT/UPDATE nessas tabelas.
2. **Compatibilidade futura**: Quando a nova integração (ex.: Mercado Pago Checkout Pro redirecionado ou outro gateway) for implementada, as tabelas `payment_transactions` e `consultation_audit_logs` poderão ser reutilizadas ou adaptadas suavemente.
3. **Segurança total**: Não há risco de quebra de queries do cliente ou administrativas.

---

## 4. Plano de Arquivamento e Migração Futura Opcional

Caso a equipe decida, após a homologação definitiva de um novo método de pagamento, expurgar permanentemente o schema Mercado Pago:

### 4.1 Script Opcional de Limpeza (A ser executado apenas em momento oportuno)
```sql
-- ATENÇÃO: Executar somente quando aprovado por compliance/financeiro
-- 1. Remover policies
DROP POLICY IF EXISTS "Customers see own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins manage transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins view webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Customers see own audit logs" ON public.consultation_audit_logs;

-- 2. Arquivar dados antes do drop (dump prévio obrigatório)
-- pg_dump --data-only -t payment_transactions -t webhook_events ...

-- 3. Remover tabelas
DROP TABLE IF EXISTS public.consultation_audit_logs CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;

-- 4. Limpar colunas em customer_plate_consultations (se desejado)
ALTER TABLE public.customer_plate_consultations
  DROP COLUMN IF EXISTS latest_payment_transaction_id,
  DROP COLUMN IF EXISTS auto_refund_attempted,
  DROP COLUMN IF EXISTS lookup_error_message;
```

---

## 5. Procedimento de Rollback da Desativação

Se por qualquer motivo for necessário reativar a branch Mercado Pago:
1. Fazer checkout da branch original `fix/mercadopago-payment-brick-500` ou `mercado-pago`.
2. Como nenhuma tabela ou dado foi apagado do banco, todo o histórico anterior permanecerá intacto e compatível.
