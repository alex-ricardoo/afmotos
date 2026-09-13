# Operations Runbook: Hobby Screen-Driven Delivery Retries & Safe Refunds

Este documento orienta os operadores e desenvolvedores na manutenção, diagnóstico e recuperação operacional da entrega de laudos veiculares sob o plano **Vercel Hobby** (sem cron frequente).

---

## 1. Limitações da Arquitetura sem Cron Frequente

1. **Retentativas dependem da presença do cliente**:
   - Quando a API Brasil falha com erro transitório, o job é agendado com `next_retry_at`.
   - Se o cliente mantiver a aba aberta, o frontend dispara a nova tentativa no momento exato.
   - Se o cliente fechar a aba antes do horário de retry, o job permanece em `retry_scheduled` no banco de dados e **não** será reprocessado em background até que:
     a) O cliente reabra a página de retorno ou a tela de Minhas Consultas;
     b) O cliente clique em "Verificar Status";
     c) Um administrador acione o reprocessamento manual via painel.
2. **Quando considerar migrar para Vercel Pro ou Worker Externo**:
   - Quando o volume de consultas pagas justificar retentativas e conciliações 100% autônomas mesmo que o cliente feche a aba imediatamente após pagar.
   - Alternativas externas gratuitas/acessíveis: Upstash QStash, Cloudflare Workers Cron, ou upgrade para Vercel Pro ($20/mês).

---

## 2. Como Verificar Jobs Pendentes de Entrega

Via SQL no Supabase Studio:

```sql
SELECT 
  id,
  consultation_id,
  transaction_id,
  status,
  attempt_count,
  max_attempts,
  next_retry_at,
  last_error_code,
  last_error_message_safe,
  created_at,
  updated_at
FROM consultation_delivery_jobs
WHERE status IN ('pending', 'processing', 'retry_scheduled')
ORDER BY created_at DESC;
```

Ou via API Administrativa autenticada:

```bash
curl -X GET https://seu-dominio.com/api/admin/delivery/jobs?status=retry_scheduled \
  -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
```

---

## 3. Como Identificar Falta de Saldo na API Brasil

Quando o saldo da API Brasil esgota:
1. O sistema classifica o erro como `APIBRASIL_INSUFFICIENT_CREDITS`.
2. A falha é marcada como `permanent`.
3. O log estruturado emite:
   `[VEHICLE_DELIVERY] {"event": "vehicle_delivery.failure_classified", "failureCode": "APIBRASIL_INSUFFICIENT_CREDITS"}`
4. A API `/api/admin/delivery/jobs` retorna o indicador:
   `"insufficientCreditsAlert": true`.
5. O cliente visualiza uma mensagem amigável de indisponibilidade e o sistema inicia o estorno total automático no Mercado Pago.

---

## 4. Como Recarregar Saldo e Reprocessar com Segurança

1. Acesse o painel da API Brasil: [https://app.apibrasil.io/dashboard?modal=recharge](https://app.apibrasil.io/dashboard?modal=recharge).
2. Adicione créditos suficientes para o plano de consultas Veículos Total.
3. Para reprocessar manualmente um job que falhou antes do estorno ser confirmado:
   ```bash
   curl -X POST https://seu-dominio.com/api/admin/delivery/jobs/<JOB_ID>/retry \
     -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>"
   ```
   *Nota*: Se o estorno já tiver sido solicitado ou confirmado, o endpoint administrativo rejeitará a chamada para evitar entregar laudo gratuito após devolução de dinheiro.

---

## 5. Como Verificar e Reconciliar Estornos Pendentes

Via SQL no Supabase Studio:

```sql
SELECT 
  id,
  transaction_id,
  consultation_id,
  provider_payment_id,
  provider_refund_id,
  amount_cents,
  status,
  reason_code,
  requested_at,
  confirmed_at
FROM payment_refunds
WHERE status IN ('requested', 'pending', 'failed')
ORDER BY created_at DESC;
```

Para forçar a reconciliação autoritativa de um refund pendente contra o Mercado Pago:
- O próprio endpoint de status do cliente reconcilia automaticamente ao ser consultado.
- Ou via script CLI:
  ```bash
  npx tsx scripts/recover-approved-consultations.ts
  ```

---

## 6. Como Recuperar Pagamentos Aprovados sem Laudo

Se houver transações antigas aprovadas cujo webhook foi perdido:

Execute o script de recuperação seguro:

```bash
npx tsx scripts/recover-approved-consultations.ts
```

O script:
1. Identifica transações com `status = 'approved'` cuja consulta esteja sem `vehicle_data`.
2. Cria o job de entrega idempotente no banco.
3. Executa a tentativa com cache-first.
4. Caso a API Brasil falhe definitivamente, agenda ou emite o estorno correspondente.
