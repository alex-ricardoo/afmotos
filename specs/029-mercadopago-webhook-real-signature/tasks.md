# Implementation Tasks: Mercado Pago Real Webhook Signature and Reconciliation

**Feature**: `029-mercadopago-webhook-real-signature`  
**Date**: 2026-09-13  
**Status**: Completed  
**Branch**: `029-mercadopago-webhook-real-signature`  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparação do ambiente, tipagens e fixtures de teste representativos de eventos reais.

- [x] T001 Expandir tipos e interfaces em `lib/mercadopago/types.ts` para suportar códigos de motivo de rejeição (`WebhookRejectionReason`), metadados de manifesto e resposta de reconciliação
- [x] T002 [P] Criar fixtures anonimizadas de notificações reais do Mercado Pago em `lib/mercadopago/__tests__/fixtures/webhook-fixtures.ts` com cabeçalhos reais (`x-signature`, `x-request-id`) e IDs de produção (ex.: `177857907601`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utilitários puros de resolução de recursos, parser de cabeçalho tolerante, comparador criptográfico de buffers hexadecimais e detecção de ambiente.

**⚠️ CRITICAL**: Todas as histórias de usuário dependem diretamente destes utilitários fundamentais.

- [x] T003 Implementar função pura `resolveMercadoPagoWebhookResourceId(request: Request, payload: unknown): string | null` em `lib/mercadopago/webhook-service.ts` com resolução hierárquica (`payload.data.id` -> `query.data.id` -> `query.id`)
- [x] T004 [P] Implementar parser tolerante de assinatura em `lib/mercadopago/webhook-service.ts` suportando ordens arbitrárias (`ts=...,v1=...` ou `v1=...,ts=...`), espaços opcionais e campos adicionais desconhecidos
- [x] T005 [P] Implementar validação de hexadecimais de 64 caracteres e comparador `timingSafeCompareHexBuffers(expectedHex: string, receivedHex: string): boolean` em `lib/mercadopago/security.ts` usando `crypto.timingSafeEqual` sobre buffers decodificados em hex
- [x] T006 [P] Implementar detector de ambiente confiável `getRuntimeEnvironment(): 'production' | 'preview' | 'local'` em `lib/mercadopago/observability.ts` avaliando prioritariamente `process.env.VERCEL_ENV`

**Checkpoint**: Base fundamental implementada e isolada. As histórias de usuário podem ser iniciadas.

---

## Phase 3: User Story 1 - Validação e Liquidação Confiável de Notificações Reais do Mercado Pago (Priority: P1) 🎯 MVP

**Goal**: Permitir que webhooks reais de pagamento enviados pelo Mercado Pago sejam autenticados via HMAC-SHA256 oficial e confirmados na API do provedor, atualizando a transação interna para `approved`.

**Independent Test**: Enviar payload e cabeçalhos reais (ou fixtures fiéis) para o endpoint de webhook e validar HTTP 200, atualização em `payment_transactions` e liberação da consulta veicular sem falsos positivos de rejeição de assinatura.

### Tests for User Story 1 🧪
- [x] T007 [P] [US1] Criar testes unitários para o template de manifesto oficial `id:{data.id};request-id:{x-request-id};ts:{ts};` em `lib/mercadopago/__tests__/webhook-signature.test.ts` (Cenários T01 a T04)
- [x] T008 [P] [US1] Criar testes unitários para rejeição controlada de cabeçalhos faltantes, segredo ausente, digest corrompido ou tamanho incorreto em `lib/mercadopago/__tests__/webhook-signature.test.ts` (Cenários T05 a T11)
- [x] T009 [P] [US1] Criar testes unitários para extração do identificador com `data.id` string, numérico e query string em `lib/mercadopago/__tests__/webhook-signature.test.ts` (Cenários T12 a T14)

### Implementation for User Story 1
- [x] T010 [US1] Refatorar `validateWebhookSignature` em `lib/mercadopago/webhook-service.ts` para construir o manifesto oficial e executar a comparação de buffers hexadecimais com tratamento de erros higienizado
- [x] T011 [US1] Atualizar o Route Handler `POST /api/webhooks/mercadopago` em `app/api/webhooks/mercadopago/route.ts` para utilizar `resolveMercadoPagoWebhookResourceId` e o novo validador de assinatura HMAC
- [x] T012 [US1] Conectar a busca autoritativa do pagamento via `fetchAuthoritativePayment` e validação estrita de `external_reference`, moeda e valor em centavos em `app/api/webhooks/mercadopago/route.ts`
- [x] T013 [US1] Integrar a liberação única da consulta veicular `releaseVerifiedPaidConsultation(transaction.id)` no Route Handler do webhook em `app/api/webhooks/mercadopago/route.ts`

**Checkpoint**: User Story 1 totalmente funcional. O webhook aceita notificações reais do Mercado Pago e conclui o pagamento.

---

## Phase 4: User Story 2 - Reconciliação Server-Side e Desbloqueio Imediato no Retorno do Cliente (Priority: P1)

**Goal**: Fornecer um endpoint server-side autenticado e integração na página de retorno do cliente para reconciliar pagamentos aprovados no Mercado Pago mesmo se o webhook atrasar ou falhar.

**Independent Test**: Retornar do pagamento na URL com status pendente no banco, verificar que a chamada ao endpoint `/reconcile` consulta o provedor, atualiza o banco para `approved` e desbloqueia o laudo em menos de 5 segundos.

### Tests for User Story 2 🧪
- [x] T014 [P] [US2] Criar testes de integração para o serviço de reconciliação com pagamento aprovado no provedor em `lib/mercadopago/__tests__/reconciliation-service.test.ts` (Cenário T18)
- [x] T015 [P] [US2] Criar testes de integração para reconciliação com pagamento ainda pendente no provedor e rejeição de acesso não autorizado em `lib/mercadopago/__tests__/reconciliation-service.test.ts` (Cenários T19 e T20)

### Implementation for User Story 2
- [x] T016 [US2] Refatorar e centralizar a lógica de confirmação e conciliação em `lib/mercadopago/reconciliation-service.ts` para compartilhamento com webhook e suporte à busca por `external_reference`
- [x] T017 [US2] Criar Route Handler autenticado `POST /api/mp/transactions/[transactionId]/reconcile` em `app/api/mp/transactions/[transactionId]/reconcile/route.ts` com validação de titularidade via Supabase Auth e rate limiting por transação
- [x] T018 [US2] Atualizar o componente `PaymentReturnStatus` em `components/customer/payment-return-status.tsx` para acionar reconciliação imediata no retorno de sucesso e aplicar polling com backoff progressivo (0s, 3s, 8s, 15s)
- [x] T019 [US2] Atualizar o botão manual "Verificar Status" em `components/customer/payment-return-status.tsx` para executar a reconciliação server-side antes de consultar o status
- [x] T020 [US2] Atualizar a página de retorno `app/cliente/pagamento/retorno/[transactionId]/page.tsx` para exibir mensagens orientativas seguras e reforçar que a URL do navegador nunca é tratada como prova definitiva de pagamento

**Checkpoint**: User Story 2 completa. Clientes não ficam bloqueados na tela de retorno mesmo com atrasos de webhook.

---

## Phase 5: User Story 3 - Observabilidade Estruturada e Diagnóstico Seguro de Webhooks (Priority: P2)

**Goal**: Padronizar logs estruturados com prefixo `[CHECKOUT_PRO]`, rastrear hashes e metadados de requisições, reportar o ambiente correto (`production`) e blindar contra vazamento de segredos.

**Independent Test**: Executar requisições de webhook e reconciliação inspecionando os logs gerados, confirmando a presença do prefixo `[CHECKOUT_PRO]`, detecção correta de `runtimeEnvironment: "production"` e ausência absoluta de segredos, tokens ou dados pessoais em texto claro.

### Tests for User Story 3 🧪
- [x] T021 [P] [US3] Criar testes de conformidade de observabilidade em `lib/mercadopago/__tests__/observability-sanitization.test.ts` validando que tokens, segredos, digests completos e corpos brutos nunca são serializados (Cenário T15)

### Implementation for User Story 3
- [x] T022 [US3] Implementar helpers `shortHash`, `maskId` e sanitizador de erros seguro em `lib/mercadopago/observability.ts`
- [x] T023 [US3] Atualizar `logCheckoutProEvent` em `lib/mercadopago/observability.ts` para injetar `runtimeEnvironment` via `getRuntimeEnvironment()` e formatar os eventos estruturados de webhook e reconciliação
- [x] T024 [US3] Instrumentar a emissão dos novos eventos (`webhook_signature_manifest_built`, `webhook_signature_rejected` com `reasonCode`, `reconcile_requested`, `reconcile_completed`) em `app/api/webhooks/mercadopago/route.ts` e `app/api/mp/transactions/[transactionId]/reconcile/route.ts`

**Checkpoint**: Observabilidade robusta e segura ativa em todo o pipeline de pagamento.

---

## Phase 6: User Story 4 - Idempotência Estrita e Prevenção de Downgrade de Transações (Priority: P2)

**Goal**: Garantir que múltiplos webhooks idênticos, requisições concorrentes ou notificações atrasadas não revertam pagamentos aprovados nem dupliquem execuções veiculares.

**Independent Test**: Simular o envio de notificação aprovada seguida de evento pendente para a mesma transação, confirmando preservação de `approved`, registro de duplicata ignorada e resposta HTTP 200.

### Tests for User Story 4 🧪
- [x] T025 [P] [US4] Criar testes de idempotência e concorrência em `lib/mercadopago/__tests__/webhook-concurrency.test.ts` cobrindo requisições concorrentes e bloqueio de downgrade de estado (Cenários T16 e T17)

### Implementation for User Story 4
- [x] T026 [US4] Assegurar a política de transição estrita em `lib/mercadopago/payment-status-mapper.ts` bloqueando transições de `approved` para `pending`, `in_process`, `rejected` ou `cancelled`
- [x] T027 [US4] Implementar verificação de deduplicação na tabela `public.webhook_events` em `app/api/webhooks/mercadopago/route.ts`, respondendo HTTP 200 e emitindo `checkout_pro.webhook_duplicate_ignored` para eventos repetidos
- [x] T028 [US4] Reforçar a trava otimista em `lib/mercadopago/consultation-releaser.ts` para garantir que chamadas concorrentes entre webhook e reconciliação disparem a busca veicular externa exatamente uma única vez

**Checkpoint**: Sistema resistente a concorrência, retries de rede e eventos fora de ordem.

---

## Phase 7: Polish & Cross-Cutting Concerns / Recuperação Operacional

**Purpose**: Verificação global de tipos, suíte completa de testes, auditoria de segurança e disponibilização de runbook de recuperação operacional.

- [x] T029 [P] Criar script/ação administrativa segura de recuperação operacional em `lib/mercadopago/operational-recovery.ts` para reconciliar pagamentos reais que ficaram pendentes em produção (`54b419a6-...`, `3c561c8c-...`, `e1b2385d-...`)
- [x] T030 [P] Documentar o runbook de recuperação operacional e procedimento de conferência de credenciais em `specs/029-mercadopago-webhook-real-signature/runbook.md`
- [x] T031 Executar verificação estrita de TypeScript (`npm run typecheck`) e linting (`npm run lint`) garantindo zero erros
- [x] T032 Executar a suíte completa de testes (`npm test`) validando que todos os cenários passam com sucesso
- [x] T033 Validar o guia de validação rápida end-to-end em `specs/029-mercadopago-webhook-real-signature/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Sem dependências — concluída.
- **Phase 2 (Foundational)**: Concluída.
- **Phase 3 (User Story 1 - P1)**: Concluída.
- **Phase 4 (User Story 2 - P1)**: Concluída.
- **Phase 5 (User Story 3 - P2)**: Concluída.
- **Phase 6 (User Story 4 - P2)**: Concluída.
- **Phase 7 (Polish & Operação)**: Concluída.
