---
description: 'Task list for Mercado Pago Checkout Pro for Credit Package Purchases'
---

# Tasks: Checkout Pro para Pacotes de Créditos B2B com Gestão Administrativa

**Input**: Design documents from `specs/039-mercadopago-credit-package-checkout/` (`spec.md`, `plan.md`, `data-model.md`, `research.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `data-model.md`, `contracts/`

**Tests**: Testes automatizados incluídos conforme especificado no plano de implementação e estratégia de segurança.

**Organization**: Tarefas agrupadas por fases de infraestrutura e histórias de usuário (User Stories), garantindo entregas incrementais e testabilidade independente.

## Format: `[TaskID] [P?] [Story?] Description with file path`

- **[P]**: Tarefa paralelizada (arquivos distintos, sem dependência de tarefas incompletas)
- **[Story]**: Identificador da história de usuário correspondente (`US1`, `US2`, `US3`, `US4`, `US5`, `US6`)
- Caminhos de arquivo explícitos e absolutos a partir da raiz do projeto.

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Definição de tipos TypeScript, contratos de dados e schemas de validação compartilhados.

- [X] T001 [P] Definir tipos TypeScript do domínio de pacotes e pedidos em `lib/credits/types.ts`
- [X] T002 [P] Implementar schemas de validação Zod para checkout e ofertas em `lib/credits/validations.ts`
- [X] T003 [P] Mapear eventos de log e telemetria estruturada em `lib/mercadopago/observability.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Estrutura de banco de dados, migrações SQL aditivas, índices, RLS e RPC atômica que bloqueiam todas as histórias de usuário.

**⚠️ CRITICAL**: Nenhuma implementação de história de usuário pode iniciar sem a conclusão desta fase.

- [X] T004 Criar migration SQL para tabelas `credit_package_offers` e `credit_package_orders` com seed idempotente em `supabase/migrations/20260918100000_create_credit_package_offers_and_orders.sql`
- [X] T005 Criar migration SQL para evolução de `payment_transactions`, extensões em `customer_credit_packages`, políticas RLS e RPC atômica `grant_credit_package_from_paid_order` em `supabase/migrations/20260918110000_evolve_payments_and_credit_grant_rpc.sql`
- [X] T006 Implementar serviço de dados de ofertas de pacotes (queries ativas e admin) em `lib/credits/offers-service.ts`
- [X] T007 Implementar serviço central de pedidos de pacotes (criação de ordens e resolução de preços) em `lib/credits/orders-service.ts`

**Checkpoint**: Fundação pronta - banco modelado, RPC atômica disponível e serviços de dados operacionais.

---

## Phase 3: User Story 1 - Compra Direta de Pacote Pré-configurado via Checkout Pro (Priority: P1) 🎯 MVP

**Goal**: Permitir que um cliente corporativo autenticado selecione um pacote comercial ativo (5, 15 ou 30 consultas), inicie o checkout seguro do Mercado Pago, pague e tenha seus créditos liberados automaticamente.

**Independent Test**: Iniciar uma compra via API ou interface de cliente autenticado, simular aprovação autoritativa de pagamento e verificar incremento imediato em `customer_credit_balances.available_credits`.

### Tests for User Story 1
- [X] T008 [P] [US1] Teste unitário para construção de preferência de pacotes em `lib/mercadopago/__tests__/package-preference-builder.test.ts`
- [X] T009 [P] [US1] Teste de integração do fluxo de checkout de pacotes em `lib/credits/__tests__/package-checkout-flow.test.ts`

### Implementation for User Story 1
- [X] T010 [P] [US1] Implementar builder de Preferência Mercado Pago para pacotes com `external_reference = order.id` em `lib/mercadopago/package-preference-builder.ts`
- [X] T011 [US1] Implementar endpoint de início de checkout de pacote em `app/api/cliente/credit-packages/[offerId]/checkout/route.ts`
- [X] T012 [US1] Adaptar o processador central de pagamentos para roteamento multiobjetivo por `purpose` ('vehicle_consultation' vs 'credit_package') em `lib/mercadopago/payment-processing-service.ts`
- [X] T013 [US1] Atualizar webhook oficial para detectar pagamento de pacote e disparar `grant_credit_package_from_paid_order` em `app/api/webhooks/mercadopago/route.ts`
- [X] T014 [US1] Atualizar componente da vitrine de pacotes com dados dinâmicos do backend e botão "Comprar com Mercado Pago" em `components/customer/customer-credits-view.tsx`
- [X] T015 [US1] Integrar carregamento das ofertas ativas no Server Component da página de créditos em `app/cliente/creditos/page.tsx`

**Checkpoint**: MVP Completo. O cliente consegue comprar um pacote padrão e receber créditos automaticamente via Checkout Pro.

---

## Phase 4: User Story 2 - Direcionamento Exclusivo ao WhatsApp para Pacotes Personalizados (Priority: P1)

**Goal**: Garantir que pacotes sob medida (Volume Customizado / 50+ consultas) exibam exclusivamente botão de contato com o WhatsApp oficial, bloqueando qualquer tentativa de checkout automático.

**Independent Test**: Tentar acionar o endpoint de checkout com o ID do pacote customizado e verificar rejeição `422 OFFER_REQUIRES_WHATSAPP`; clicar no card na interface e verificar abertura do link WhatsApp parametrizado.

### Tests for User Story 2
- [X] T016 [P] [US2] Teste unitário garantindo rejeição de checkout para ofertas `contact_only` em `lib/credits/__tests__/whatsapp-custom-package.test.ts`

### Implementation for User Story 2
- [X] T017 [US2] Implementar guarda no serviço de pedidos contra criação de checkout para ofertas com `contact_only = true` em `lib/credits/orders-service.ts`
- [X] T018 [US2] Configurar botão "Negociar no WhatsApp" com texto seguro no componente de pacotes em `components/customer/customer-credits-view.tsx`

**Checkpoint**: Pacotes personalizados blindados contra checkout automático e integrados ao canal WhatsApp.

---

## Phase 5: User Story 3 - Proteção Estrita Contra Manipulação de Preços e Quantidades (Priority: P1)

**Goal**: Garantir que nenhuma requisição externa possa alterar preço, desconto ou quantidade de créditos, usando exclusivamente os valores persistidos no backend.

**Independent Test**: Submeter payload contendo `price_cents = 100` e `credits_quantity = 500` e verificar que a ordem é gerada exclusivamente com o valor oficial do banco.

### Tests for User Story 3
- [X] T019 [P] [US3] Teste automatizado de injeção de parâmetros maliciosos no checkout em `lib/credits/__tests__/checkout-security.test.ts`

### Implementation for User Story 3
- [X] T020 [US3] Reforçar sanitização e validação Zod no endpoint de checkout descartando atributos não permitidos em `app/api/cliente/credit-packages/[offerId]/checkout/route.ts`
- [X] T021 [US3] Assegurar snapshot imutável em `credit_package_orders` obtido diretamente da oferta ativa em `lib/credits/orders-service.ts`

**Checkpoint**: Backend estabelecido como fonte incondicional e única da verdade de preços.

---

## Phase 6: User Story 4 - Retorno Transparente e Concessão Idempotente de Créditos (Priority: P2)

**Goal**: Fornecer ao cliente tela de retorno com atualização em tempo real do status da compra, reconciliação ativa e garantia de concessão única sem duplicações por concorrência ou reenvio de webhook.

**Independent Test**: Acessar tela de retorno após pagamento, verificar transição de "Confirmando" para "Créditos liberados" e testar retransmissão de webhook garantindo saldo inalterado.

### Tests for User Story 4
- [X] T022 [P] [US4] Teste de concessão idempotente e concorrência na RPC `grant_credit_package_from_paid_order` em `lib/credits/__tests__/grant-idempotency.test.ts`

### Implementation for User Story 4
- [X] T023 [US4] Implementar endpoint de consulta de status e reconciliação sob demanda do pedido do cliente em `app/api/cliente/credit-packages/orders/[orderId]/status/route.ts`
- [X] T024 [US4] Criar página de retorno do cliente com polling reativo e feedback visual em `app/cliente/pacotes/retorno/[orderId]/page.tsx`
- [X] T025 [US4] Integrar atualização dinâmica de saldo na interface do cliente após confirmação de concessão em `components/customer/customer-credits-view.tsx`

**Checkpoint**: Experiência de pós-pagamento fluida com garantia criptográfica e lógica de idempotência.

---

## Phase 7: User Story 5 - Gestão Administrativa de Ofertas Comerciais de Pacotes (Priority: P2)

**Goal**: Permitir que administradores gerenciem o catálogo de pacotes comerciais (criar, editar, ativar, desativar e ordenar) no painel administrativo, com recálculo automático de descontos e auditoria.

**Independent Test**: Criar uma nova oferta promocional no painel administrativo e verificar sua publicação imediata na vitrine de clientes sem alteração de pedidos anteriores.

### Tests for User Story 5
- [X] T026 [P] [US5] Teste de autorização de admin (`admin_profiles.auth_user_id = auth.uid()`) para gestão de ofertas em `lib/admin/__tests__/admin-package-offers.test.ts`

### Implementation for User Story 5
- [X] T027 [US5] Implementar endpoints administrativos de listagem, criação e edição de ofertas em `app/api/admin/credit-package-offers/route.ts` e `app/api/admin/credit-package-offers/[offerId]/route.ts`
- [X] T028 [US5] Criar componente de tabela e modal de ofertas administrativas com cálculo de desconto em `components/admin/credit-package-offers-manager.tsx`
- [X] T029 [US5] Criar página administrativa de gestão de pacotes em `app/admin/configuracoes/pacotes-consultas/page.tsx`

**Checkpoint**: Gestão comercial de ofertas 100% autônoma via painel administrativo.

---

## Phase 8: User Story 6 - Gestão de Pedidos, Reconciliação e Política de Estorno (Refund) (Priority: P3)

**Goal**: Permitir que administradores visualizem pedidos de pacotes (separando Mercado Pago de WhatsApp), forcem reconciliações e executem estornos de acordo com a política de consumo.

**Independent Test**: Executar estorno em pacote sem uso (revogando créditos) e em pacote parcialmente consumido (suspendendo e direcionando para revisão manual sem apagar o ledger).

### Tests for User Story 6
- [X] T030 [P] [US6] Teste da política de estorno de pacotes (sem uso vs uso parcial) em `lib/credits/__tests__/refund-policy.test.ts`

### Implementation for User Story 6
- [X] T031 [US6] Implementar serviço de estorno de pacotes de acordo com a política de consumo em `lib/mercadopago/package-refund-service.ts`
- [X] T032 [US6] Implementar endpoints administrativos de reconciliação e estorno de pedidos em `app/api/admin/credit-package-orders/[orderId]/reconcile/route.ts` e `app/api/admin/credit-package-orders/[orderId]/refund/route.ts`
- [X] T033 [US6] Expandir a central de pagamentos administrativa com a visualização de pedidos de pacotes e ações de conciliação em `components/admin/payments-table.tsx`

**Checkpoint**: Controle operacional e financeiro completo com suporte a estornos seguros e reconciliação.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação de ponta a ponta, hardening de segurança, conformidade de tipos e verificação do quickstart.

- [X] T034 Executar cenários do guia de validação em `specs/039-mercadopago-credit-package-checkout/quickstart.md`
- [X] T035 [P] Executar suite de testes completa via `npm test`
- [X] T036 [P] Executar checagem estrita de tipos via `npm run typecheck`
- [X] T037 [P] Executar linter em todo o projeto via `npm run lint`
- [X] T038 Validar build de produção via `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências - inicia imediatamente.
- **Foundational (Phase 2)**: Depende da Phase 1 - **BLOQUEIA TODAS AS HISTÓRIAS DE USUÁRIO**.
- **User Story 1 (Phase 3 - MVP)**: Depende da Phase 2.
- **User Story 2 (Phase 4)**: Depende da Phase 2 e integra com vitrine da Phase 3.
- **User Story 3 (Phase 5)**: Depende da Phase 2 e Phase 3.
- **User Story 4 (Phase 6)**: Depende da Phase 3 (US1).
- **User Story 5 (Phase 7)**: Depende da Phase 2.
- **User Story 6 (Phase 8)**: Depende da Phase 3 (US1) e Phase 6 (US4).
- **Polish (Phase 9)**: Depende da conclusão de todas as histórias desejadas.

---

## Parallel Opportunities

```bash
# Execução paralela de Setup (Phase 1):
Task T001: "Definir tipos TypeScript em lib/credits/types.ts"
Task T002: "Implementar schemas Zod em lib/credits/validations.ts"
Task T003: "Mapear eventos de observabilidade em lib/mercadopago/observability.ts"

# Execução paralela de testes da User Story 1 (Phase 3):
Task T008: "Teste unitário de preferência em lib/mercadopago/__tests__/package-preference-builder.test.ts"
Task T009: "Teste de integração em lib/credits/__tests__/package-checkout-flow.test.ts"

# Execução paralela após Phase 2 (Foundational):
Desenvolvedor A: Phase 3 (US1 - MVP Compra Direta)
Desenvolvedor B: Phase 7 (US5 - Gestão Administrativa de Ofertas)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Concluir Phase 1 (Setup) e Phase 2 (Foundational).
2. Concluir Phase 3 (User Story 1: Compra Direta de Pacote via Checkout Pro).
3. **Validar MVP**: Testar compra de ponta a ponta no Sandbox do Mercado Pago com liberação de créditos confirmada.

### Incremental Delivery
1. Foundation pronta → Liberar US1 (MVP de compra online).
2. Adicionar US2 (WhatsApp sob medida) e US3 (Segurança de preços).
3. Adicionar US4 (Tela de retorno com polling reativo e concessão idempotente).
4. Adicionar US5 (Gestão administrativa de ofertas) e US6 (Reconciliação e política de estorno).
5. Executar Polish e checklist de qualidade final.
