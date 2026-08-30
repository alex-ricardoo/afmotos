# Implementation Plan: Cadastro e CRM de Clientes


**Branch**: `016-cadastro-clientes-crm` | **Date**: 2026-08-29 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/016-cadastro-clientes-crm/spec.md)

**Input**: Feature specification from `specs/016-cadastro-clientes-crm/spec.md`

## Summary

Criar entidade central `public.customers` para unificar dados de clientes da AF Motos, integrando com vendas, propostas, anúncios, consignações e locações. A tabela complementa registros existentes sem destruir snapshots históricos. A UI será mobile-first em `/admin/clientes` com CRUD completo, busca, filtros, deduplicação por CPF/telefone/e-mail, e integração com o formulário de nova venda.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js App Router (React Server Components + Server Actions)

**Primary Dependencies**: Supabase JS v2, Zod, react-hook-form, lucide-react, shadcn/ui, sonner

**Storage**: PostgreSQL via Supabase (RLS habilitado, `public.is_admin()` como função de autorização)

**Testing**: Manual + unitário para normalizers/validators

**Target Platform**: Web (Vercel) — desktop + mobile (320px+)

**Project Type**: Web application (admin panel, monolith Next.js)

**Performance Goals**: Busca < 2s para 5.000 clientes; cadastro < 90s mobile; seleção na venda < 15s

**Constraints**: RLS admin-only; CPF nunca em URLs/logs; snapshot preservado; sem exclusão física

**Scale/Scope**: ~5.000 clientes; ~30 arquivos alterados/criados; 8 fases de implementação

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio | Status | Justificativa |
| --- | --- | --- |
| I. Product First | ✅ | CRM resolve problema real de clientes duplicados entre módulos |
| II. Mobile First | ✅ | Cards mobile, filtros em sheet, touch targets ≥ 44px |
| III. Type Safety | ✅ | TypeScript strict, Zod validation, zero `any` |
| IV. Segurança | ✅ | RLS via `is_admin()`, CPF mascarado, sem PII em logs/URLs |
| V. Supabase como Fonte | ✅ | Tabela em PostgreSQL/Supabase, sem BD paralelo |
| VI. Componentização | ✅ | Componentes por domínio em `components/admin/customers/` |
| VII. Integrações Desacopladas | ✅ | Serviço `findOrCreateCustomer` centralizado, sem acoplamento direto |
| VIII. UX Consistente | ✅ | Reutiliza tokens, layout, padrões de sidebar/nav existentes |
| IX. Performance & SEO | ✅ | Server-side pagination, indexes, sem N+1 |
| X. Testabilidade | ✅ | Normalizers e validators isolados e testáveis |
| XI. Observabilidade | ✅ | `created_by`/`updated_by` para auditoria; `source` para rastreamento |
| XII. Evolução Incremental | ✅ | FKs nulláveis, sem breaking changes, backfill separado |

**Resultado**: Todos os 12 princípios constitucionais satisfeitos. Sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/016-cadastro-clientes-crm/
├── plan.md              # Este arquivo
├── research.md          # Decisões arquiteturais (10 ADRs)
├── data-model.md        # Schema customers, FKs, RLS, índices, migration strategy
├── quickstart.md        # Guia de validação com 10 cenários
├── tasks.md             # Tarefas atômicas com dependências
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
# Migration layer
supabase/migrations/
├── 20260830000000_create_customers.sql
└── 20260830000100_add_customer_fks.sql

# Type definitions
types/
├── customer.ts                    # [NEW] Customer, CustomerInsert, CustomerUpdate, etc.
└── database.ts                    # [MODIFY] +customer_id em Sale, Lead, SellRequest, etc.

# Domain logic
lib/
├── utils/
│   ├── customer-normalizers.ts    # [NEW] normalizePhone, normalizeCpf, isValidCpf, maskCpf, normalizeEmail
│   └── formatters.ts             # [EXISTING] Reutilizar formatCpf, formatPhone, cleanNumeric
├── validations/
│   ├── customer.ts                # [NEW] customerCreateSchema, customerQuickCreateSchema, customerUpdateSchema
│   └── sale.ts                    # [MODIFY] +optional customer_id
├── domain/
│   └── customer-dedup.ts          # [NEW] findDuplicateCandidates, findOrCreateCustomer
├── queries/
│   └── customers.ts               # [NEW] getCustomers, getCustomerById, searchCustomersForSale
└── actions/
    ├── customers.ts               # [NEW] createCustomer, updateCustomer, deactivateCustomer, etc.
    ├── sales.ts                   # [MODIFY] +customer_id, +findOrCreate no submit
    ├── leads.ts                   # [MODIFY] +findOrCreate no createLeadAction e createSellRequestAction
    └── rental-requests.ts         # [MODIFY] +findOrCreate no createRentalRequestAction

# Pages (App Router)
app/admin/(protected)/clientes/
├── page.tsx                       # [NEW] Listagem
├── novo/
│   └── page.tsx                   # [NEW] Novo cliente
└── [id]/
    ├── page.tsx                   # [NEW] Detalhe
    └── editar/
        └── page.tsx               # [NEW] Edição

# Components
components/admin/
├── admin-sidebar.tsx              # [MODIFY] +item Clientes
├── admin-bottom-nav.tsx           # [MODIFY] Clientes no sheet "Mais"
├── sales/
│   └── sale-form.tsx              # [MODIFY] +seção Comprador/Cliente
├── proposal-detail-drawer.tsx     # [MODIFY] +card de cliente vinculado
└── customers/
    ├── customer-list.tsx          # [NEW] Tabela desktop
    ├── customer-mobile-card.tsx   # [NEW] Card mobile
    ├── customer-filters.tsx       # [NEW] Filtros com sync URL
    ├── customer-form.tsx          # [NEW] Formulário shared create/edit
    ├── customer-quick-create-dialog.tsx  # [NEW] Modal criação rápida na venda
    ├── customer-search-combobox.tsx      # [NEW] Busca async para venda
    ├── customer-summary-cards.tsx       # [NEW] Cards de contagem de vínculos
    ├── customer-details-header.tsx      # [NEW] Header com avatar, contato, ações
    ├── customer-relations-tabs.tsx      # [NEW] Abas de relacionamentos
    ├── customer-empty-relations.tsx     # [NEW] Empty state para cliente avulso
    ├── customer-status-badge.tsx        # [NEW] Badge ativo/inativo
    ├── customer-source-badge.tsx        # [NEW] Badge de origem com label humano
    └── customer-dedup-alert.tsx         # [NEW] Alerta de duplicidade CPF/tel/email
```

**Structure Decision**: Next.js App Router monolith com domínio `customers` seguindo o padrão existente de `sales` e `leads`. Componentes em `components/admin/customers/`, lógica em `lib/`, tipos em `types/`.

## Migrations

### Migration 1: `20260830000000_create_customers.sql`

Cria tabela `public.customers` com 25 colunas, constraints CHECK, 6+ índices (incluindo unique parcial em `cpf_normalized`), RLS com políticas admin-only.

### Migration 2: `20260830000100_add_customer_fks.sql`

Adiciona `customer_id uuid null references customers(id) on delete set null` às seguintes tabelas:

| Tabela | Coluna FK | Semântica | Index |
| --- | --- | --- | --- |
| `sales` | `customer_id` | Comprador da venda | `idx_sales_customer_id` |
| `sell_requests` | `customer_id` | Proprietário/anunciante | `idx_sell_requests_customer_id` |
| `leads` | `customer_id` | Contato/lead | `idx_leads_customer_id` |
| `motorcycle_owners` | `customer_id` | Proprietário/consignante | `idx_motorcycle_owners_customer_id` |
| `consignment_requests` | `customer_id` | Solicitante consignação | `idx_consignment_requests_customer_id` |
| `rentals` | `customer_id` | Locatário | `idx_rentals_customer_id` |
| `rental_requests` | `customer_id` | Solicitante aluguel | `idx_rental_requests_customer_id` |

**Decisão FK naming**: Usar `customer_id` simples (não `buyer_customer_id`) porque:
- Em `sales`, a FK é unívoca — uma venda tem exatamente um comprador.
- Em `sell_requests`, o proprietário/anunciante é a única pessoa envolvida.
- Em todas as tabelas, há um único papel de cliente. Semântica explícita via nome da tabela.
- Mantém consistência com o padrão existente do projeto (`motorcycle_id`, `owner_id`, `lead_id`).

## Implementation Phases

### Fase 0 — Descoberta e Contratos ✅ (concluída neste plano)

Saída:
- Mapa completo de 20+ arquivos auditados (ver [research.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/016-cadastro-clientes-crm/research.md))
- Schema real confirmado: `sales` (buyer_name/phone/email/document/address/cep/street/etc.), `sell_requests` (name/phone/email), `leads` (name/phone/email), `consignment_requests` (name/phone/email), `motorcycle_owners` (name/phone/email/document), `rentals` (customer_name/phone/email), `rental_requests` (name/phone)
- RLS confirmado: `public.is_admin()` via `admin_profiles`
- Sidebar: 7 itens, "Clientes" vai após "Vendas" (index 3)
- Risco identificado: `sell_requests` e `leads` são criados em cadeia pela mesma action (`createSellRequestAction`), necessitando cuidado na vinculação
- Decisão: `customer_id` para todas as FKs (sem prefixo)

---

### Fase 1 — Banco de Dados e Segurança

1. Criar migration `20260830000000_create_customers.sql`
2. Criar constraints CHECK (source, gender, state, full_name length, birth_date)
3. Criar índices (cpf unique parcial, phone, email, created_at, active+created_at, source)
4. Habilitar RLS com políticas `is_admin()` para SELECT, INSERT, UPDATE
5. Criar migration `20260830000100_add_customer_fks.sql`
6. Adicionar `customer_id` nullable + index a 7 tabelas
7. Validar migrations em ambiente local (`supabase db reset`)
8. Atualizar tipos TypeScript (`types/customer.ts` + `types/database.ts`)

**Critérios**:
- Migration idempotente (`IF NOT EXISTS`)
- Clientes protegidos por RLS
- Vendas existentes continuam acessíveis com `customer_id = NULL`
- Nenhum campo histórico removido

---

### Fase 2 — Domínio e Utilitários

1. Criar `lib/utils/customer-normalizers.ts` com:
   - `normalizePhone(raw)` → dígitos; tratar +55, parênteses, espaços, hifens
   - `normalizeCpf(raw)` → dígitos ou null; tratar pontos e hifen
   - `normalizeEmail(raw)` → lowercase trimmed ou null
   - `isValidCpf(cpf)` → boolean (algoritmo de dígitos verificadores)
   - `maskCpf(cpf)` → `***.***.789-09`
2. Criar `lib/validations/customer.ts` com:
   - `customerCreateSchema` (form completo)
   - `customerQuickCreateSchema` (modal na venda: nome + telefone + email? + cpf?)
   - `customerUpdateSchema` (partial)
   - `customerSearchSchema` (query params)
3. Criar `lib/domain/customer-dedup.ts` com:
   - `findDuplicateCandidates({ cpf?, phone?, email? })` → `{ cpfMatch, phoneMatches, emailMatches }`
   - `findOrCreateCustomer(data, source)` → `{ customer, created, matched }`
4. Criar `lib/queries/customers.ts` com:
   - `getCustomers(params)` → paginado, filtrado, buscado
   - `getCustomerById(id)` → com contagens de relacionamentos
   - `searchCustomersForSale(term)` → lightweight para combobox
5. Criar `lib/actions/customers.ts` com:
   - `createCustomerAction(data)` → com dedup, created_by, normalização
   - `updateCustomerAction(id, data)` → com updated_by, normalização
   - `setCustomerActiveStatusAction(id, active)` → com confirmação
   - `checkDuplicatesAction(data)` → pre-check para UX

**Critérios**:
- Validação CPF passa para válidos, falha para inválidos
- CPF duplicado bloqueado pelo servidor
- Telefone/email alertam sem bloquear
- Dados vazios persistidos como `NULL`
- `created_by = auth.uid()` preenchido

---

### Fase 3 — Navegação e Listagem

1. Adicionar item `{ name: 'Clientes', href: '/admin/clientes', icon: UsersRound }` ao array `navigation` em `admin-sidebar.tsx` após "Vendas"
2. Criar `/admin/clientes/page.tsx` com:
   - Cabeçalho: título, descrição, contador, botão "Novo cliente"
   - Barra de busca debounced
   - Filtros sync com URL
   - Tabela desktop (`customer-list.tsx`)
   - Cards mobile (`customer-mobile-card.tsx`)
   - Paginação server-side
   - Estados: loading/skeleton, vazio inicial, sem resultados, erro
3. Criar `customer-filters.tsx` com:
   - Texto (nome, telefone, email, CPF)
   - Sexo
   - Data de entrada (hoje, 7d, 30d, mês, custom)
   - Origem
   - Vínculo (avulso, comprador, proprietário, consignante, lead, locatário)
   - Status (ativo, inativo, todos)
   - Limpar filtros
   - Mobile: Sheet/Drawer

**Critérios**:
- Layout consistente com `/admin/vendas` e `/admin/propostas`
- Filtros preservados na URL
- Sem scroll horizontal no mobile
- Sem N+1 queries
- URL nunca contém CPF

---

### Fase 4 — Cadastro e Edição

1. Criar `customer-form.tsx` (shared create/edit) com seções:
   - Dados Principais (nome*, sexo, nascimento, notas)
   - Contato (telefone*, WhatsApp toggle, email)
   - Documentos (CPF com validação, RG)
   - Endereço (CEP com ViaCEP, rua, número, complemento, bairro, cidade, UF select)
   - Origem (select com labels humanos, source_detail)
2. Criar `/admin/clientes/novo/page.tsx`
   - Formulário em modo criação
   - `customer-dedup-alert.tsx` integrado
   - Redirect para `/admin/clientes/[id]` após sucesso
3. Criar `/admin/clientes/[id]/editar/page.tsx`
   - Formulário em modo edição com dados pré-populados
   - Handle 404
   - Redirect para detalhe após sucesso
4. Implementar inativação/reativação com dialog de confirmação

**Critérios**:
- Cliente avulso (nome + telefone) pode ser criado
- CPF inválido/duplicado não salva
- Máscara de CPF, telefone e CEP funcionam
- ViaCEP reutiliza padrão da venda
- Toast de sucesso e redirect

---

### Fase 5 — Detalhe e Relacionamentos

1. Criar `/admin/clientes/[id]/page.tsx` com:
   - `customer-details-header.tsx`: avatar/iniciais, nome, badges, contato com ações (WhatsApp, ligar, copiar), botões (Editar, Registrar venda, menu ações)
   - `customer-summary-cards.tsx`: contagens reais de vínculos (vendas, anúncios, consignações, propostas, locações)
   - `customer-relations-tabs.tsx`: Visão geral, Vendas, Anúncios/propostas, Locações, Histórico
2. Cada aba com dados reais, links para módulos existentes e empty states elegantes
3. `customer-empty-relations.tsx` para cliente avulso

**Critérios**:
- Dados pessoais com proteção adequada (CPF mascarado na visão geral)
- Vínculos com links funcionais
- Empty state útil e amigável
- WhatsApp abre corretamente

---

### Fase 6 — Integração com Vendas (Crítica)

1. Criar `customer-search-combobox.tsx`:
   - Busca async debounced por nome, telefone, email, CPF
   - Resultados: nome, telefone, email, CPF mascarado, badge origem
   - Ocultar inativos por padrão
   - Keyboard navigation
2. Criar `customer-quick-create-dialog.tsx`:
   - Dialog com nome, telefone, email, CPF
   - Origem auto = `sale_registration`
   - Dedup antes de salvar
   - Retorna cliente criado
3. Modificar `sale-form.tsx`:
   - Adicionar seção "Comprador / Cliente" antes dos campos buyer_*
   - Integrar combobox + botão "Cadastrar novo cliente"
   - Ao selecionar/criar: preencher buyer_name, buyer_phone, buyer_email, buyer_document, buyer_cep, buyer_street, etc. a partir do customer
   - Admin pode editar snapshot da venda
   - Checkbox "Atualizar cadastro do cliente com os dados informados nesta venda" (unchecked por default, nunca atualiza CPF silenciosamente)
4. Modificar `lib/actions/sales.ts`:
   - `createSaleAction` recebe `customer_id` opcional
   - Se customer_id fornecido: salvar FK
   - Se customer_id ausente mas buyer_data preenchido: `findOrCreateCustomer` com source `sale_registration`
   - Se checkbox "atualizar cadastro" marcado: `updateCustomerAction` transacional
   - Prevenir duplicação em retry/duplo-clique
5. Modificar `lib/validations/sale.ts`:
   - Adicionar `customer_id: z.string().uuid().optional().nullable()`

**Critérios**:
- Selecionar cliente funciona e preenche snapshot
- Criar cliente rápido funciona
- Concluir venda manual cria/vincula cliente
- Recibo e contrato usam snapshot histórico (buyer_*)
- Sem duplicação em duplo envio
- Vendas antigas sem customer_id continuam funcionais

---

### Fase 7 — Integração com Site e Propostas

1. Modificar `createSellRequestAction` em `lib/actions/leads.ts`:
   - Após inserir em `sell_requests`, chamar `findOrCreateCustomer({ name, phone, email }, 'website_sell_request')`
   - Atualizar `sell_requests.customer_id` com o resultado
   - O lead criado na mesma ação também recebe `customer_id`
   - Idempotente em retry
2. Modificar `createLeadAction` em `lib/actions/leads.ts`:
   - Para types GENERAL_CONTACT e MOTORCYCLE_INTEREST: `findOrCreateCustomer` com source `website_contact`
   - Atualizar `leads.customer_id`
3. Modificar `createRentalRequestAction` em `lib/actions/rental-requests.ts`:
   - `findOrCreateCustomer` com source `rental_registration`
   - Atualizar `rental_requests.customer_id`
4. Avaliar `consignment_requests`:
   - Tabela em `001_initial_schema.sql` com name/phone/email
   - Adicionar `customer_id` FK
   - Se action existir para criação, integrar `findOrCreateCustomer` com source `website_consignment_request`
5. Modificar `proposal-detail-drawer.tsx`:
   - Se `customer_id` presente no lead/sell_request: mostrar card do cliente com link
   - Se ausente: botão "Criar/vincular cliente" que abre dialog
6. Planejar backfill legada como tarefa separada, idempotente, não auto-executada:
   - Priorizar CPF válido, depois telefone, depois email
   - Nunca criar cliente só por nome
   - Produzir relatório de registros não vinculados
   - Suportar dry-run

**Critérios**:
- Formulário do site não cria duplicatas em retry
- Proposta exibe perfil do cliente
- Origem inicial preservada
- Nenhum dado de formulário perdido

---

### Fase 8 — Qualidade, Testes e Rollout

1. Testes unitários:
   - `normalizePhone`, `normalizeCpf`, `normalizeEmail`, `isValidCpf`, `maskCpf`
   - Campos vazios → null
   - Mapeamentos de source e gender
2. Testes de integração:
   - Admin cria cliente avulso
   - Não-admin bloqueado por RLS
   - CPF duplicado falha
   - Telefone duplicado gera alerta
   - Inativo não aparece na busca de venda por padrão
   - Venda vinculada a cliente
   - Criação rápida na venda
   - Edição de cliente não altera snapshot
   - Retry não duplica cliente de formulário
3. Responsividade: 320px, 375px, 414px, 768px
4. Acessibilidade: labels, focus, keyboard, aria, touch targets
5. CPF: nunca em URL, logs, mensagens de erro, listagem sem máscara
6. Smoke test em preview
7. Validar RLS com conta admin e não-admin
8. Deploy checklist
9. Plano de rollback

**Critérios**: Todos os cenários do [quickstart.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/016-cadastro-clientes-crm/quickstart.md) passam.

## Decisões Bloqueantes ou Ambiguidades Encontradas

Nenhuma. Todas as ambiguidades foram resolvidas na Fase 0 (este plano). Decisões documentadas em [research.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/016-cadastro-clientes-crm/research.md).

## Riscos Técnicos e Mitigações

| Risco | Severidade | Mitigação |
| --- | --- | --- |
| Modificar `sale-form.tsx` (1162 linhas) pode introduzir regressões | Alta | Testar fluxo completo de venda antes e depois; seção de cliente é aditiva (novo bloco) |
| Modificar `createSellRequestAction` (490 linhas, flow complexo) pode quebrar formulário público | Alta | `findOrCreateCustomer` é chamado APÓS o insert bem-sucedido; falha no customer não impede o sell_request |
| Race condition em CPF único (dois admins criando simultaneamente) | Média | Constraint unique parcial no banco; action trata erro de unicidade com mensagem amigável |
| Performance de busca `ilike` em base grande | Baixa | Escala esperada < 10.000; índice em `phone_normalized`; `ilike` adequado; `pg_trgm` documentado como upgrade futuro |
| Migrations em Supabase (sem rollback automático) | Média | Migrations aditivas (ADD COLUMN IF NOT EXISTS); coluna nullable não quebra queries existentes |
| Backfill de dados legados pode criar clientes incorretos | Média | Script separado, não auto-executado, com dry-run e relatório |

## Rollback Strategy

- Migrations são aditivas: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`.
- Nenhuma coluna existente é removida ou renomeada.
- Nenhum dado existente é alterado.
- Em caso de rollback: desabilitar item de menu; coluna `customer_id` nullable é ignorada silenciosamente.
- Rollback destrutivo (DROP TABLE customers, DROP COLUMN customer_id × 7 tabelas) só se necessário em cenário extremo.
- Nunca apagar clientes ou vínculos criados em produção como ação automática.

## Deploy Checklist

- [ ] Aplicar migration em branch/staging
- [ ] Validar schema e políticas RLS
- [ ] Verificar que vendas/leads/propostas existentes continuam funcionais
- [ ] Deploy de preview no Vercel
- [ ] Smoke test com conta admin
- [ ] Smoke test com conta não-admin (deve ser bloqueado)
- [ ] Testar criação de cliente manual
- [ ] Testar venda com seleção de cliente
- [ ] Testar venda sem seleção (backward compat)
- [ ] Testar formulário público (sell_request)
- [ ] Verificar recibo PDF usa snapshot
- [ ] Testar mobile (320px+)
- [ ] Verificar CPF não aparece em URL/log
- [ ] Deploy em produção
- [ ] Monitorar erros de constraint e autorização
- [ ] Não rodar backfill massivo no primeiro deploy
