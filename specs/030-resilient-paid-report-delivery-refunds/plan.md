# Implementation Plan: Resilient Paid Report Delivery, Persisted Retries, and Secure Refunds

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Date**: 2026-09-13

---

## 1. Arquitetura Atual vs. Arquitetura Alvo

### 1.1 Arquitetura Atual (Síncrona & Frágil)
```
[Mercado Pago Webhook / Reconcile Route]
      │
      ▼
confirmAndProcessPaymentTransaction()
      │
      ▼ (síncrono)
releaseVerifiedPaidConsultation()
      │
      ├─► findExistingConsultation() [Cache]
      │
      └─► executeVehiclePlateLookup() [API Brasil LIVE - até 120s]
            │
            ├─► Se falhar (timeout, 500, sem saldo):
            │     - Grava status = 'failed'
            │     - Transação continua 'approved'
            │     - NENHUM retry
            │     - NENHUM refund
            │     - Cliente fica na tela em loading eterno
```

### 1.2 Arquitetura Alvo (Desacoplada, Durável, Idempotente e com Refund)
```
[Mercado Pago Webhook / Reconcile Route]
      │
      ▼
confirmAndProcessPaymentTransaction()
      │ (1. Confirma pagamento approved)
      │ (2. Enfileira consultation_delivery_jobs)
      │ (3. Dispara trigger assíncrono fire-and-forget)
      ▼
[Resposta HTTP 200 ao Mercado Pago em < 500ms]

═══════════════════════════════════════════════════════════════
[Fila Persistida: consultation_delivery_jobs]
      ▲                               ▲
      │ (trigger imediato)            │ (Vercel Cron a cada 1m)
[ProcessDeliveryWorker] ──────────────┘
      │
      ├─► 1. Cache Hit ──► Copia snapshot ──► completed
      │
      └─► 2. Cache Miss ──► API Brasil Live
                │
                ├─► Sucesso ──► Persiste laudo ──► completed
                │
                ├─► Falha Transitória (timeout, 500, 429)
                │     └──► status = 'retry_scheduled'
                │     └──► next_retry_at (1m, 5m, 15m, 30m)
                │
                └─► Falha Permanente (sem saldo, 401, mock em prod) ou Tentativas Esgotadas
                      │
                      ▼
               [DeliveryFailedPermanent]
                      │
                      ▼
               [PaymentRefundService]
                      │
                      ├─► Cria payment_refunds (status='requested')
                      ├─► Invoca Mercado Pago API (PaymentRefund.total com mp_payment_id)
                      ├─► Atualiza status = 'pending'
                      └─► Registra alerta operacional: "Recarregar saldo da API Brasil"
                              │
                              ▼
                [Webhook Mercado Pago / Reconcile Refund]
                              │
                              ▼
                      status = 'refunded'
                      customer_plate_consultations.payment_status = 'refunded'
```

---

## 2. Decisão de Execução Assíncrona

- **Motor Principal**: Vercel Cron acionando a rota `/api/cron/process-delivery-jobs` em intervalos regulares (1 a 2 minutos).
- **Gatilho Inicial de Baixa Latência**: Logo após o webhook ou reconciliação enfileirar o job, uma chamada assíncrona interna (fire-and-forget com timeout reduzido de conexão) tenta processar a tentativa #1 imediatamente, permitindo que laudos rápidos ou cache hits sejam entregues em menos de 3 segundos para o cliente final.
- **Segurança da Rota de Cron**:
  - Cabeçalho `Authorization: Bearer CRON_SECRET` validado obrigatoriamente.
  - Se `CRON_SECRET` for inválido ou ausente, a rota retorna `401 Unauthorized`.
- **Lock Atômico Concorrente**:
  - Utilização da procedure PostgreSQL `claim_next_delivery_jobs` com `FOR UPDATE SKIP LOCKED`.
  - Múltiplos workers paralelos nunca claimam o mesmo job.
  - Jobs com lock expirado (> 5 minutos) são automaticamente resgatados caso uma função serverless caia no meio do processamento.

---

## 3. Mapeamento Exato dos Arquivos Modificados / Criados

### 3.1 Arquivos a Modificar
1. `lib/mercadopago/types.ts`:
   - Adicionar novos status do ciclo de entrega e refund (`retry_scheduled`, `failed_permanent`, `refund_pending`, `manual_review`).
   - Adicionar interfaces para `ConsultationDeliveryJobRecord` e `PaymentRefundRecord`.
2. `lib/mercadopago/payment-processing-service.ts`:
   - Modificar para não executar consulta síncrona diretamente.
   - Enfileirar job em `consultation_delivery_jobs` e disparar worker em segundo plano.
3. `lib/mercadopago/consultation-releaser.ts`:
   - Refatorar para virar o executor do job (`processDeliveryJob`), isolando lógica de busca, retry e falha.
4. `app/api/mp/transactions/[transactionId]/status/route.ts`:
   - Mapear os novos status de entrega (`retry_scheduled`, `refund_pending`, `refunded`, `manual_review`) e retornar mensagens seguras ao frontend.
5. `components/customer/payment-return-status.tsx`:
   - Suportar visualmente os estados de `retry_scheduled` (alerta de instabilidade temporária com retry automático), `refund_pending` (estorno solicitado) e `refunded` (estorno confirmado), além de botão de WhatsApp integrado.
6. `app/api/webhooks/mercadopago/route.ts`:
   - Suportar recebimento e conciliação de eventos de refund (`payment` com status `refunded`).

### 3.2 Arquivos a Criar
1. `lib/vehicle-delivery/delivery-service.ts`:
   - Orquestrador central da fila de entrega de laudos.
   - Funções: `enqueueDeliveryJob`, `claimAndProcessBatch`, `classifyProviderFailure`.
2. `lib/vehicle-delivery/failure-classifier.ts`:
   - Mapeamento estrito de erros da API Brasil para `transient`, `permanent` ou `unknown`.
   - Sanitização de mensagens seguras e detecção robusta de falta de saldo.
3. `lib/mercadopago/refund-service.ts`:
   - Serviço dedicado e isolado para solicitação e reconciliação de estornos totais no Mercado Pago.
   - Funções: `initiateRefundForFailedDelivery`, `reconcilePendingRefunds`, `handleRefundWebhook`.
4. `app/api/cron/process-delivery-jobs/route.ts`:
   - Rota protegida por `CRON_SECRET` para execução contínua de jobs pendentes e retries.
5. `app/api/cron/reconcile-pending-refunds/route.ts`:
   - Rota protegida por `CRON_SECRET` para autoritativamente reconciliar estornos pendentes no Mercado Pago.
6. `app/api/admin/delivery/jobs/route.ts`:
   - Rota de controle administrativo para listar jobs, reprocessar falhas e monitorar saldo.
7. Migrations no Supabase:
   - `supabase/migrations/20260913180000_expand_consultation_status_constraints.sql`
   - `supabase/migrations/20260913190000_create_consultation_delivery_jobs.sql`
   - `supabase/migrations/20260913200000_create_payment_refunds.sql`

---

## 4. Estratégia de Testes

### 4.1 Testes Unitários
- `failure-classifier.test.ts`:
  - Validar que erros de timeout, 408, 429, 500 são classificados como `transient`.
  - Validar que 401, 403, `InsufficientBalanceError` e mock em produção são classificados como `permanent`.
  - Testar que mensagens de erro não contêm tokens ou dados sensíveis.
- `refund-service.test.ts`:
  - Validar que refund usa `mp_payment_id` e nunca `preference_id`.
  - Validar cálculo em centavos e idempotência por transação.
  - Validar bloqueio de refund duplicado.

### 4.2 Testes de Integração
- Testar ciclo completo: Pagamento aprovado ──► Enfileiramento ──► Worker claim ──► Cache Hit ──► Conclusão sem chamada à API Brasil.
- Testar falha de rede da API Brasil: Retries incrementados de 1 até 5 com `next_retry_at` progressivo.
- Testar esgotamento de tentativas: Job vira `failed_permanent` e dispara refund automático.
- Testar saldo esgotado: Erro classificado como permanente, transição direta para `failed_permanent` e solicitação de estorno imediata.

### 4.3 Testes de Concorrência
- Dois webhooks concorrentes com o mesmo `mp_payment_id`: apenas 1 job de entrega é criado.
- Dois workers tentando rodar `claim_next_delivery_jobs`: nenhum job é processado em duplicidade.
- Duas chamadas simultâneas de refund: apenas 1 requisição externa ao Mercado Pago é enviada.

---

## 5. Procedimento de Rollout Progressivo & Recuperação Manual

1. **Executar Migrations Aditivas**:
   - As migrations expandem constraints e criam novas tabelas sem alterar destrutivamente registros existentes.
2. **Configuração de Variáveis na Vercel**:
   - Garantir `CRON_SECRET` configurado no painel da Vercel.
   - Atualizar `vercel.json` com os agendamentos das rotas de cron.
3. **Script de Recuperação de Transações Aprovadas Sem Laudo**:
   - Criação de rotina administrativa que localiza transações com `status = 'approved'` e `customer_plate_consultations.status IN ('pending', 'processing', 'failed')`:
     - Se consulta já possui laudo em cache, finaliza como `completed`.
     - Se consulta não possui laudo e ocorreu há mais de 24h, cria ordem de refund seguro.
     - Se consulta foi recente, enfileira em `consultation_delivery_jobs` para processamento normal.
