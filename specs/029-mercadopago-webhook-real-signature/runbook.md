# Runbook de Recuperação Operacional: Mercado Pago Checkout Pro

## 1. Contexto do Incidente e Causa-Raiz

Em versões anteriores, as notificações de webhook enviadas pelo Mercado Pago em produção para `POST /api/webhooks/mercadopago` resultaram em `HTTP 401 {"error": "Invalid webhook signature"}`.

### Causas Identificadas:
1. **Formato do Manifesto HMAC**: O template oficial do Mercado Pago requer estritamente:
   ```text
   id:{data.id};request-id:{x-request-id};ts:{ts};
   ```
2. **Parser de Cabeçalho Tolerante**: O cabeçalho `x-signature` continha variações de espaçamento e inversão de chaves (`v1=...,ts=...`).
3. **Comparação em Nível de Bytes**: A assinatura recebida deve ser validada como hash hexadecimal de 64 caracteres e comparada em tempo constante usando decodificação de bytes (`Buffer.from(hex, 'hex')`), e não strings UTF-8.
4. **Detecção de Ambiente**: `runtimeEnvironment` deve inspecionar `VERCEL_ENV === 'production'`.

---

## 2. Transações de Produção Impactadas

| Transaction ID | Valor | Status Anterior | ID do Pagamento MP |
| :--- | :--- | :--- | :--- |
| `54b419a6-053e-48fc-8afc-9aa3eaed39ad` | R$ 49,99 | `pending` | `177857907601` |
| `3c561c8c-1e8f-4cb1-807c-f173f47e3a58` | R$ 49,99 | `pending` | - |
| `e1b2385d-83b6-4b2a-8742-1e967a2139e6` | R$ 49,99 | `pending` | - |

---

## 3. Checklist de Variáveis de Ambiente em Produção (Vercel)

Antes de executar a recuperação, garanta que as variáveis de ambiente estão configuradas no dashboard da Vercel:

1. `MERCADO_PAGO_ACCESS_TOKEN`: Token de produção começando com `APP_USR-...`.
2. `MERCADO_PAGO_WEBHOOK_SECRET`: Segredo de assinatura obtido no painel de desenvolvedores do Mercado Pago.
3. `NEXT_PUBLIC_APP_URL`: URL oficial da aplicação (`https://afmotos.vercel.app`).
4. `VERCEL_ENV`: Definida nativamente pela Vercel como `production`.
5. `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_URL`: Chaves de acesso administrativo do Supabase.

---

## 4. Procedimento de Recuperação Operacional (Sem Updates Manuais de SQL)

> [!CAUTION]
> **NUNCA** execute `UPDATE payment_transactions SET status = 'approved'` diretamente no SQL.
> A aprovação manual no banco pula a verificação de valores, não audita o provedor e pode deixar a consulta veicular travada.

### Opção A: Execução do Utilitário de Recuperação via CLI

Em ambiente autorizado com acesso às variáveis de ambiente de produção:

```bash
# Reconciliação das transações do incidente conhecido:
node --experimental-strip-types lib/mercadopago/operational-recovery.ts

# Ou reconciliação de uma transação específica:
node --experimental-strip-types lib/mercadopago/operational-recovery.ts 54b419a6-053e-48fc-8afc-9aa3eaed39ad
```

### Opção B: Acionamento via Endpoint Autenticado

1. O cliente afetado pode acessar diretamente a tela de retorno:
   ```text
   https://afmotos.vercel.app/cliente/pagamento/retorno/54b419a6-053e-48fc-8afc-9aa3eaed39ad
   ```
2. O componente `PaymentReturnStatus` dispara automaticamente a reconciliação server-side via:
   ```http
   POST /api/mp/transactions/54b419a6-053e-48fc-8afc-9aa3eaed39ad/reconcile
   ```
3. O endpoint consulta a API do Mercado Pago, atualiza o status para `approved` e desbloqueia imediatamente a consulta veicular.

---

## 5. Auditoria e Validação Pós-Recuperação

Execute a conferência nas seguintes tabelas do Supabase:

### 1. Verificar Status da Transação
```sql
SELECT id, status, status_detail, mp_payment_id, transaction_amount, updated_at
FROM public.payment_transactions
WHERE id = '54b419a6-053e-48fc-8afc-9aa3eaed39ad';
```
- **Resultado Esperado**: `status = 'approved'`, `mp_payment_id = '177857907601'`.

### 2. Verificar Liberação da Consulta Veicular
```sql
SELECT id, plate, status, payment_status, processed_at
FROM public.customer_plate_consultations
WHERE latest_payment_transaction_id = '54b419a6-053e-48fc-8afc-9aa3eaed39ad';
```
- **Resultado Esperado**: `status = 'completed'`, `payment_status = 'paid'`.

### 3. Verificar Trilha de Auditoria
```sql
SELECT event, actor_type, details, created_at
FROM public.consultation_audit_logs
WHERE transaction_id = '54b419a6-053e-48fc-8afc-9aa3eaed39ad'
ORDER BY created_at DESC;
```
- **Resultado Esperado**: Registro de `reconciliation_payment_confirmed` ou `consultation_paid_and_processed`.

---

## 6. Monitoramento de Logs no Vercel

Filtre os logs na Vercel utilizando a query:
```text
[CHECKOUT_PRO]
```

Eventos esperados no ciclo saudável:
- `checkout_pro.webhook_received`
- `checkout_pro.webhook_signature_manifest_built`
- `checkout_pro.webhook_signature_verified`
- `checkout_pro.transaction_updated`
- `checkout_pro.consultation_release_succeeded`
