# Tasks: Checkout Pro Mercado Pago para Consulta Veicular

**Input**: Design documents from `specs/028-mercadopago-checkout-pro/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`  
**Branch**: `028-mercadopago-checkout-pro`  

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências diretas)
- **[Story]**: História de usuário relacionada (ex.: US1, US2, US3, US4, US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalação de dependências e configuração de ambiente.

- [X] T001 Instalar e fixar dependência oficial `mercadopago@2.12.0` no `package.json`.
- [X] T002 [P] Atualizar `.env.example` com as variáveis oficiais do Checkout Pro (`MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_CHECKOUT_MODE`, `MERCADO_PAGO_WEBHOOK_URL`).
- [X] T003 [P] Criar arquivo de tipos compartilhados `lib/mercadopago/types.ts` com interfaces para Preferências, Pagamentos e Estados de Transação.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Camada base de infraestrutura que suporta todas as histórias de usuário.

- [X] T004 Criar singleton seguro do cliente SDK em `lib/mercadopago/client.ts` com validação de `MERCADO_PAGO_ACCESS_TOKEN`.
- [X] T005 [P] Implementar utilitários de segurança e mascaramento de logs em `lib/mercadopago/security.ts` (validação de host de redirecionamento, mascaramento de CPF/e-mail).
- [X] T006 [P] Implementar mapeador estrito de status em `lib/mercadopago/payment-status-mapper.ts` (mapeamento de `approved`, `pending`, `rejected`, `provider_error`).
- [X] T007 [P] Implementar emissão de logs estruturados em `lib/mercadopago/observability.ts`.

**Checkpoint**: Camada foundational pronta e tipada.

---

## Phase 3: User Story 1 - Iniciar Pagamento Seguro via Checkout Pro (Priority: P1)

**Goal**: Permitir que o cliente com consulta pendente inicie o checkout e seja redirecionado ao ambiente seguro do Mercado Pago.

- [X] T008 [P] [US1] Implementar construtor de preferências em `lib/mercadopago/preference-builder.ts` com validação de valor canônico, BRL, `back_urls` e `auto_return`.
- [X] T009 [US1] Criar Route Handler `POST /api/mp/checkout-pro/preferences/route.ts` com autenticação Supabase, validação de titularidade da consulta, criação atômica da transação em `payment_transactions` e geração da preferência via SDK.
- [X] T010 [P] [US1] Criar componente cliente `components/customer/checkout-pro-button.tsx` com estado de loading, feedback de erro e redirecionamento seguro para `init_point`/`sandbox_init_point`.
- [X] T011 [US1] Atualizar a página `app/cliente/pagamento/[consultationId]/page.tsx` para renderizar o botão de pagamento com Checkout Pro quando a consulta for elegível.

**Checkpoint**: Cliente clica no botão, a preferência é gerada no backend e o navegador redireciona para a página de pagamento do Mercado Pago.

---

## Phase 4: User Story 2 - Pagamento Hospedado e Retorno à AF Motos (Priority: P1)

**Goal**: Permitir que o cliente retorne à AF Motos após pagar no Mercado Pago e visualize o status atualizado do laudo.

- [X] T012 [P] [US2] Criar componente de polling e status visual `components/customer/payment-return-status.tsx` com 5 estados (aprovado com laudo, processando, aguardando, rejeitado, erro).
- [X] T013 [US2] Criar página Server Component de retorno `app/cliente/pagamento/retorno/[transactionId]/page.tsx` com validação de autenticação, carregamento de estado inicial e montagem do componente de retorno.

**Checkpoint**: Ao retornar do checkout, o cliente vê tela informativa aguardando a confirmação sem aprovação prematura.

---

## Phase 5: User Story 3 - Sincronização Autoritativa via Webhook com HMAC (Priority: P1)

**Goal**: Receber notificações do Mercado Pago, validar assinatura HMAC-SHA256, consultar a API e liberar o laudo veicular de forma atômica e idempotente.

- [X] T014 [US3] Implementar serviço de webhook em `lib/mercadopago/webhook-service.ts` com validação de assinatura HMAC via `crypto.timingSafeEqual`, deduplicação em `webhook_events` e busca via `Payment.get()`.
- [X] T015 [US3] Implementar rotina atômica de liberação da consulta veicular em `lib/mercadopago/consultation-releaser.ts` (`releaseVerifiedPaidConsultation`), invocando `executeVehiclePlateLookup` exatamente uma vez e gravando em `consultation_audit_logs`.
- [X] T016 [US3] Criar Route Handler `POST /api/webhooks/mercadopago/route.ts` orquestrando a validação de assinatura, consulta à API, atualização da transação e resposta HTTP 200/401.

**Checkpoint**: Notificação enviada pelo Mercado Pago desbloqueia a consulta veicular e atualiza a transação para `approved` sem duplicidades.

---

## Phase 6: User Story 4 - Consulta Segura de Status da Transação (Priority: P2)

**Goal**: Fornecer endpoint higienizado para polling e consulta em tempo real da transação pelo cliente.

- [X] T017 [US4] Criar Route Handler `GET /api/mp/transactions/[transactionId]/status/route.ts` com autenticação, validação de propriedade da transação e retorno estrito de campos normalizados.

**Checkpoint**: Frontend obtém status higienizado sem exposição de tokens, credenciais ou dados do pagador.

---

## Phase 7: User Story 5 - Reconciliação e Visibilidade Administrativa (Priority: P3)

**Goal**: Permitir que administradores auditem e reconciliem manualmente transações pendentes consultando a API oficial.

- [X] T018 [US5] Implementar serviço de reconciliação em `lib/mercadopago/reconciliation-service.ts` para consulta de pagamentos pendentes e atualização controlada de status.
- [X] T019 [US5] Adicionar ação administrativa para disparar a reconciliação e registrar em `consultation_audit_logs` com identificação do operador.

**Checkpoint**: Administrador pode resolver pendências sem marcação manual cega de pagamento.

---

## Phase 8: Polish, Testes Automatizados e Validação

**Purpose**: Garantir qualidade, cobertura de testes e ausência de regressões.

- [X] T020 Criar testes unitários para o construtor de preferências em `lib/mercadopago/__tests__/preference-builder.test.ts`.
- [X] T021 [P] Criar testes unitários para a validação HMAC e mapeador de status em `lib/mercadopago/__tests__/webhook-signature.test.ts` e `lib/mercadopago/__tests__/status-mapper.test.ts`.
- [X] T022 [P] Executar `npm run typecheck`, `npm run lint` e `npm test` garantindo 100% de aprovação.
- [X] T023 Validar que nenhum componente ou importação de Checkout Bricks permanece ativo na aplicação.
