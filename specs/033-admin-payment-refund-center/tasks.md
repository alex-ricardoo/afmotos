# Tarefas de Implementação: Central Administrativa de Pagamentos, Consultas e Estornos

## Fase 1: Banco de Dados e Camada de Acesso (Aditiva)

- [x] **T01**: Criar migration aditiva `supabase/migrations/20260913210000_create_admin_payments_view_and_indexes.sql` contendo os índices de busca em `payment_transactions`, `customer_plate_consultations` e a View `admin_payment_consultations_view`.
- [x] **T02**: Criar módulo de tipos e consultas em `lib/admin/payments-service.ts` com funções `getAdminPaymentsList`, `getAdminPaymentSummary` e `getAdminPaymentDetails`.

---

## Fase 2: Segurança e Endpoints de API

- [x] **T03**: Implementar helper de autorização administrativa em `lib/admin/admin-auth.ts` reutilizando `admin_profiles` e `is_admin()`.
- [x] **T04**: Criar endpoint de listagem e sumário `app/api/admin/payments/route.ts` com suporte a paginação, filtros e busca textual por placa e IDs.
- [x] **T05**: Criar endpoint de detalhes completos `app/api/admin/payments/[transactionId]/route.ts` com composição da timeline de auditoria.
- [x] **T06**: Criar endpoint de solicitação de estorno `app/api/admin/payments/[transactionId]/refund/route.ts` com validação Zod da palavra "ESTORNAR", chamada ao Mercado Pago exclusivamente com `mp_payment_id` e gravação de log.
- [x] **T07**: Criar endpoint de reconciliação de estorno `app/api/admin/payments/[transactionId]/refund/reconcile/route.ts` consultando o estado autoritativo no gateway.
- [x] **T08**: Criar endpoint de reprocessamento de entrega `app/api/admin/payments/[transactionId]/reprocess/route.ts` com checagem de saldo confirmado e bloqueio em caso de estorno existente.

---

## Fase 3: Interface do Usuário e Experiência Operacional

- [x] **T09**: Atualizar `components/admin/admin-sidebar.tsx` inserindo o link "Pagamentos & Estornos" direcionando para `/admin/pagamentos-consultas`.
- [x] **T10**: Criar banner de alerta prioritário `components/admin/payments/insufficient-credits-banner.tsx` para casos de saldo insuficiente na API Brasil.
- [x] **T11**: Criar componente de cards `components/admin/payments/payments-kpi-cards.tsx` com os 8 contadores e interação de filtro ao clicar.
- [x] **T12**: Criar barra de filtros e busca `components/admin/payments/payments-filters-bar.tsx` com sincronização bidirecional em query params.
- [x] **T13**: Criar tabela principal `components/admin/payments/payments-table.tsx` com badges acessíveis, formatação em BRL e timezone explícito.
- [x] **T14**: Criar modal de confirmação reforçada de estorno `components/admin/payments/refund-confirmation-modal.tsx`.
- [x] **T15**: Criar modal de reprocessamento com confirmação de recarga `components/admin/payments/reprocess-confirmation-modal.tsx`.
- [x] **T16**: Criar gaveta lateral de detalhes `components/admin/payments/payment-detail-drawer.tsx` com blocos operacionais e timeline cronológica.
- [x] **T17**: Montar a página `app/admin/(protected)/pagamentos-consultas/page.tsx` com SSR inicial e componente client `payments-dashboard-client.tsx`.

---

## Fase 4: Testes Automatizados, Qualidade e Validação

- [x] **T18**: Criar testes unitários para a validação de elegibilidade e schema Zod em `lib/admin/__tests__/refund-eligibility.test.ts`.
- [x] **T19**: Criar testes de integração para os endpoints administrativos validando restrição de acesso a usuários não administradores.
- [x] **T20**: Executar validação estática completa: `npm run typecheck`, `npm run lint` e testes unitários existentes.
