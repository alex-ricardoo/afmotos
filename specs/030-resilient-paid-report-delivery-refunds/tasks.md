# Implementation Tasks: Resilient Delivery, Retries & Refunds

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Date**: 2026-09-13

---

## Phase 1: Database Schema & Migrations

- [X] **TASK-1.1**: Criar migration `supabase/migrations/20260913180000_expand_consultation_status_constraints.sql` para expandir `customer_plate_consultations.status` com os estados `retry_scheduled`, `failed_permanent`, `refund_pending`, `refunded`, `manual_review`.
- [X] **TASK-1.2**: Criar migration `supabase/migrations/20260913190000_create_consultation_delivery_jobs.sql` com índices parciais de deduplicação e procedure PostgreSQL `claim_next_delivery_jobs` para concorrência segura.
- [X] **TASK-1.3**: Criar migration `supabase/migrations/20260913200000_create_payment_refunds.sql` para rastreamento imutável de estornos totais via Mercado Pago.
- [X] **TASK-1.4**: Atualizar tipos TypeScript em `lib/mercadopago/types.ts` e `lib/customer/types.ts` refletindo os novos esquemas.

---

## Phase 2: Classification of Failures & Delivery Service

- [X] **TASK-2.1**: Implementar módulo `lib/vehicle-delivery/failure-classifier.ts` mapeando erros da API Brasil (`InsufficientBalanceError`, 401, 403, 408, 429, 500, timeouts) para classes `transient`, `permanent` ou `unknown` com códigos seguros e sanitizados.
- [X] **TASK-2.2**: Implementar `lib/vehicle-delivery/delivery-service.ts` com funções `enqueueDeliveryJob`, `claimAndProcessDeliveryJobs` e `executeSingleDeliveryJob`.
- [X] **TASK-2.3**: Garantir verificação cache-first em `delivery-service.ts`: se a placa já possui laudo concluído no banco, copiar o snapshot e concluir o job sem contatar o provedor externo.
- [X] **TASK-2.4**: Implementar política de backoff com jitter para jobs em `retry_scheduled` (1m, 5m, 15m, 30m; máximo de 5 tentativas).
- [X] **TASK-2.5**: Interromper retries e registrar `failed_permanent` quando ocorrer erro definitivo ou atingir `MAX_ATTEMPTS`.

---

## Phase 3: Automated & Safe Mercado Pago Refund Service

- [X] **TASK-3.1**: Implementar `lib/mercadopago/refund-service.ts` conectando ao cliente oficial `PaymentRefund` do Mercado Pago SDK via `mp_payment_id` e cabeçalho `X-Idempotency-Key`.
- [X] **TASK-3.2**: Garantir validações estritas antes de solicitar estorno: pagamento aprovado, valor positivo, ausência de estorno anterior, ausência de laudo válido entregue.
- [X] **TASK-3.3**: Implementar tratamento de duas fases: transição para `requested`/`pending` na chamada de API e consolidação para `confirmed`/`refunded` após webhook oficial ou reconciliação.
- [X] **TASK-3.4**: Atualizar `app/api/webhooks/mercadopago/route.ts` para processar eventos de notificação com status `refunded` e disparar conciliação financeira do estorno.

---

## Phase 4: Serverless Cron Handlers & Decoupling

- [X] **TASK-4.1**: Refatorar `lib/mercadopago/payment-processing-service.ts` para desacoplar a confirmação do pagamento da chamada síncrona da API Brasil, substituindo pela criação do job de entrega.
- [X] **TASK-4.2**: Criar rota protegida `app/api/cron/process-delivery-jobs/route.ts` que valida `CRON_SECRET` e executa lote de jobs claimados.
- [X] **TASK-4.3**: Criar rota protegida `app/api/cron/reconcile-pending-refunds/route.ts` para reconciliação periódica de devoluções pendentes no Mercado Pago.
- [X] **TASK-4.4**: Atualizar `vercel.json` configurando os agendamentos das novas rotas de cron.

---

## Phase 5: Customer Experience & Observability

- [X] **TASK-5.1**: Atualizar `app/api/mp/transactions/[transactionId]/status/route.ts` para mapear os novos estados e fornecer orientações seguras ao cliente.
- [X] **TASK-5.2**: Atualizar `components/customer/payment-return-status.tsx` para apresentar as mensagens e layouts adequados aos novos estados:
  - Instabilidade com retry automático agendado.
  - Indisponibilidade temporária com solicitação de estorno em andamento.
  - Estorno concluído com orientações bancárias.
- [X] **TASK-5.3**: Implementar botão de suporte com WhatsApp gerando mensagens pré-formatadas higienizadas (sem PII ou detalhes técnicos).
- [X] **TASK-5.4**: Implementar logs estruturados com prefixos `[VEHICLE_DELIVERY]` e `[PAYMENT_REFUND]` em `lib/mercadopago/observability.ts`.

---

## Phase 6: Admin Operations & Recovery

- [X] **TASK-6.1**: Implementar rota administrativa `/api/admin/delivery/jobs` para consulta de jobs em retry, falhas permanentes e alertas de saldo insuficiente.
- [X] **TASK-6.2**: Criar script de recuperação/reconciliação para pagamentos antigos aprovados que eventualmente ficaram sem laudo concluído.

---

## Phase 7: Verification & Automated Tests

- [X] **TASK-7.1**: Testes unitários para `failure-classifier.ts` (classificação de status, sanitização, detecção de falta de saldo).
- [X] **TASK-7.2**: Testes unitários para `refund-service.ts` (validação de `mp_payment_id`, idempotência, bloqueio de estorno duplicado).
- [X] **TASK-7.3**: Testes de concorrência garantindo execução única de jobs de entrega e ordens de estorno.
- [X] **TASK-7.4**: Testes de sanitização comprovando ausência de tokens ou segredos nos logs da Vercel.
