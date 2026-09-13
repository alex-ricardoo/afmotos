# Implementation Tasks: Hobby Screen-Driven Delivery Retries

**Feature**: Hotfix de entrega resiliente sem cron frequente na Vercel Hobby  
**Branch**: `fix/hobby-screen-driven-delivery-retries`  
**Date**: 2026-09-13

---

## Phase 1: Vercel Configuration Cleanup
- [X] **TASK-1.1**: Limpar `vercel.json` removendo qualquer expressão de cron frequente (`* * * * *`, `*/5 * * * *`), deixando `"crons": []` para aprovação imediata do deploy no plano Hobby.

---

## Phase 2: Schema & Core Service Verification
- [X] **TASK-2.1**: Confirmar reutilização integral das tabelas `consultation_delivery_jobs`, `payment_refunds` e `customer_plate_consultations` sem novas migrations destrutivas.
- [X] **TASK-2.2**: Assegurar que `executeSingleDeliveryJob` e `initiateRefundForFailedDelivery` permaneçam como serviços centrais de domínio reutilizados em todos os pontos de entrada.

---

## Phase 3: Client Screen-Driven Endpoint
- [X] **TASK-3.1**: Criar rota autenticada `POST /api/cliente/consultas/[consultationId]/process-delivery` com:
  - Validação de sessão do usuário logado via Supabase Auth.
  - Validação de propriedade da consulta (`consultation.user_id === user.id`).
  - Verificação de elegibilidade: pagamento aprovado e job em estado não-terminal.
  - Verificação de horário: rejeitar execução antes de `next_retry_at` retornando HTTP 200 com código `retry_not_due`.
  - Claim atômico persistido com expiração de lease contra abas concorrentes.
  - Rate limiting defensivo por usuário/consulta (mínimo 10 segundos entre requisições ativas).

---

## Phase 4: Frontend UI & Timer Management
- [X] **TASK-4.1**: Atualizar `components/customer/payment-return-status.tsx`:
  - Gerenciamento inteligente de timer agendado estritamente para `nextRetryAt`.
  - Disparo único com cleanup no unmount do componente.
  - Atualização do botão "Verificar Status" para disparar reconciliação e entrega se elegível.
  - Botão de suporte WhatsApp com mensagem pré-formatada sem dados sensíveis ou técnicos.
  - Interrupção imediata de timers e polling em estados terminais (`completed`, `failed_permanent`, `refund_pending`, `refunded`, `manual_review`).

---

## Phase 5: Reconcile Refunds & Admin Operations
- [X] **TASK-5.1**: Integrar reconciliação de refund sob demanda quando o cliente ou admin consultar o status de consultas em `refund_pending`.
- [X] **TASK-5.2**: Assegurar suporte na rota `/api/admin/delivery/jobs` para visualização de métricas e alertas de saldo da API Brasil.

---

## Phase 6: Automated Verification & Documentation
- [X] **TASK-6.1**: Criar testes automatizados cobrindo o endpoint `process-delivery`, proteção contra chamadas prematuras antes de `next_retry_at`, validação de ownership e idempotência.
- [X] **TASK-6.2**: Criar `runbook.md` e especificações de contratos em `contracts/`.
- [X] **TASK-6.3**: Executar `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.
