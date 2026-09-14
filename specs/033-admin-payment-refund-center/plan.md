# Plano de Implementação: Central Administrativa de Pagamentos, Consultas e Estornos

## 1. Visão Geral e Arquitetura

O objetivo é disponibilizar aos administradores da AF Motos uma central completa e segura para gestão de pagamentos veiculares, acompanhamento da entrega de laudos, identificação automática de falhas externas (como saldo insuficiente na API Brasil) e execução auditada de estornos e reprocessamentos.

A implementação segue os princípios da Constituição do projeto:
- **Product First & UX Consistente**: Painel no padrão visual escuro da AF Motos com destaques dourados, cards de KPIs operacionais e feedback claro de status.
- **Segurança & Defesa em Profundidade**: Proteção em Server Components, Route Handlers, Zod e RLS. Apenas `admin_profiles` ativos com papel `admin` ou `super_admin` podem acessar.
- **Type Safety**: TypeScript estrito com Zod schemas nas bordas das APIs e DTOs tipados.
- **Reutilização Integral**: Uso direto das tabelas `payment_transactions`, `payment_refunds`, `customer_plate_consultations`, `consultation_delivery_jobs` e `consultation_audit_logs`.

---

## 2. Componentes e Estrutura de Arquivos

```text
app/
├── admin/
│   └── (protected)/
│       └── pagamentos-consultas/
│           ├── loading.tsx                     # Skeletons de carregamento do painel
│           └── page.tsx                        # Server Component principal com SSR inicial
└── api/
    └── admin/
        └── payments/
            ├── route.ts                        # GET listagem paginada, busca, filtros e KPIs
            └── [transactionId]/
                ├── route.ts                    # GET detalhes completos e timeline de auditoria
                ├── refund/
                │   ├── route.ts                # POST acionamento seguro de estorno
                │   └── reconcile/
                │       └── route.ts            # POST reconciliação autoritativa do estorno
                └── reprocess/
                    └── route.ts                # POST reprocessamento seguro da entrega

components/
├── admin/
│   ├── admin-sidebar.tsx                       # [MODIFICAR] Adicionar item no menu
│   └── payments/
│       ├── payments-dashboard-client.tsx       # Orquestrador client-side com estado e URLs
│       ├── payments-kpi-cards.tsx              # Cards de resumo com contadores e filtros rápidos
│       ├── payments-table.tsx                  # Tabela paginada, ordenação e badges de status
│       ├── payments-filters-bar.tsx            # Barra de busca por placa/IDs e filtros avançados
│       ├── payment-detail-drawer.tsx           # Gaveta/Sheet lateral com blocos e timeline
│       ├── refund-confirmation-modal.tsx       # Modal de estorno reforçado (palavra ESTORNAR)
│       ├── reprocess-confirmation-modal.tsx    # Modal de reprocessamento com aviso de saldo
│       └── insufficient-credits-banner.tsx     # Banner de alerta para API Brasil sem créditos

lib/
└── admin/
    └── payments-service.ts                     # Queries administrativas, agregações e DTOs

supabase/
└── migrations/
    └── 20260913210000_create_admin_payments_view_and_indexes.sql # Migration aditiva
```

---

## 3. Fases de Implementação

### Fase 1: Banco de Dados e Camada de Acesso (Aditiva)
1. Criar migration aditiva `20260913210000_create_admin_payments_view_and_indexes.sql`:
   - Índices de performance para busca em `payment_transactions` e `customer_plate_consultations`.
   - View `public.admin_payment_consultations_view`.
   - Grant de select para `authenticated` e `service_role`.
2. Implementar `lib/admin/payments-service.ts`:
   - `getAdminPaymentsList(filters)` com paginação, busca e contagem.
   - `getAdminPaymentSummary(filters)` com contadores para os cards.
   - `getAdminPaymentDetails(transactionId)` com composição da timeline de auditoria.

### Fase 2: Endpoints de API Administrativos (Segurança e Backend)
1. Implementar `app/api/admin/payments/route.ts`:
   - Validação de administrador com `authorizeAdminRequest`.
   - Consulta paginada e sanitização de dados.
2. Implementar `app/api/admin/payments/[transactionId]/route.ts`:
   - Retorno de detalhes, blocos e timeline cronológica de auditoria.
3. Implementar `app/api/admin/payments/[transactionId]/refund/route.ts`:
   - Validação Zod com confirmação "ESTORNAR".
   - Execução via `initiateRefundForFailedDelivery` com trava atômica.
   - Registro de auditoria com `actor_type = 'admin'`.
4. Implementar `app/api/admin/payments/[transactionId]/refund/reconcile/route.ts`:
   - Consulta autoritativa via `reconcileSingleRefund`.
   - Atualização de status e liberação/cancelamento de jobs.
5. Implementar `app/api/admin/payments/[transactionId]/reprocess/route.ts`:
   - Validação de pré-requisitos (sem estorno, laudo não concluído).
   - Verificação de confirmação de saldo da API Brasil.

### Fase 3: Interface do Usuário (Frontend e Design System)
1. Atualizar `components/admin/admin-sidebar.tsx`:
   - Inserir link "Pagamentos & Estornos" com ícone `CircleDollarSign`.
2. Desenvolver `components/admin/payments/payments-kpi-cards.tsx`:
   - 8 cards com contadores dinâmicos, cores semânticas e clique para filtrar.
3. Desenvolver `components/admin/payments/payments-filters-bar.tsx`:
   - Campo de busca unificada (placa, IDs, e-mail) e selects de filtros.
   - Sincronização com query params da URL (`useSearchParams`, `useRouter`).
4. Desenvolver `components/admin/payments/payments-table.tsx`:
   - Tabela responsiva com badges visuais e textuais (acessibilidade).
   - Formatação em BRL e horários locais com timezone explícito.
   - Coluna de ações com "Ver detalhes", "Estornar", "Reconciliar" e "Reprocessar".
5. Desenvolver `components/admin/payments/payment-detail-drawer.tsx`:
   - 5 blocos informativos (Consulta, Pagamento, Entrega, Estorno, Auditoria).
6. Desenvolver `components/admin/payments/refund-confirmation-modal.tsx`:
   - Resumo financeiro, seleção de motivo e digitação obrigatória de `ESTORNAR`.
7. Desenvolver `components/admin/payments/reprocess-confirmation-modal.tsx`:
   - Alerta especial para saldo da API Brasil com checkbox obrigatório de confirmação de recarga.

### Fase 4: Testes Automatizados e Homologação
1. Testes unitários de elegibilidade e validação de schema Zod.
2. Testes de autorização (usuário anônimo e cliente comum rejeitados com 401/403).
3. Testes de concorrência e prevenção de estorno duplicado.
4. Verificação de build, typecheck e linting sem erros.

---

## 4. Estratégia de Rollback

- **Banco de Dados**: A View e índices criados são puramente aditivos. O rollback remove a view com `DROP VIEW IF EXISTS public.admin_payment_consultations_view;`.
- **Rotas e Páginas**: A rota `/admin/pagamentos-consultas` é nova e não impacta nenhuma rota existente do site público nem da área do cliente. Em caso de necessidade de rollback, basta ocultar o item no menu ou desativar o Route Handler.
