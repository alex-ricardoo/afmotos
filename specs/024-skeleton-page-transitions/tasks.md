# Tasks: Skeleton Loaders em Transições de Página

**Feature**: `024-skeleton-page-transitions` | **Date**: 2026-09-04 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuração de estilos globais de shimmer, keyframes CSS e saneamento do fallback raiz.

- [X] T001 Configure CSS shimmer animation keyframes, utility tokens, and `prefers-reduced-motion` in `app/globals.css`
- [X] T002 Refactor root loading component `app/loading.tsx` to remove blocking async calls (`await getSiteSettings()`) into a pure synchronous skeleton with luxury dark theme

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Primitivas de esqueleto e blocos modulares reutilizáveis que bloqueiam a implementação das rotas.

**⚠️ CRITICAL**: Nenhuma rota de carregamento das histórias de usuário deve ser criada antes da conclusão desta fase.

- [X] T003 Implement enhanced atomic `Skeleton` component with variants (`default`, `text`, `image`, `card`, `list`, `button`, `avatar`, `input`), accessibility props (`aria-busy`, `role="status"`, `label`), and aspect-ratio helper in `components/ui/skeleton.tsx`
- [X] T004 [P] Create modular `MotorcycleCardSkeleton` matching `MotorcycleCard` geometry (aspect-16/10 image, badges, title, price, installment) in `components/motorcycles/motorcycle-card-skeleton.tsx`
- [X] T005 [P] Update `MotorcycleGridSkeleton` in `components/motorcycles/motorcycle-grid.tsx` to reuse `MotorcycleCardSkeleton` and support responsive 1/2/3 column layouts
- [X] T006 [P] Create universal fallback skeleton layout for public route transitions in `app/(public)/loading.tsx`

**Checkpoint**: Primitivas e componentes base de esqueleto prontos — implementação das rotas pode prosseguir.

---

## Phase 3: User Story 1 - Navegação Fluida no Catálogo de Motos Mobile-First (Priority: P1) 🎯 MVP

**Goal**: Permitir que usuários no celular e desktop naveguem instantaneamente para a rota `/motos` com prévia de filtros e grade de motos sem nenhum layout shift (CLS = 0).

**Independent Test**: Navegar da Home (`/`) para `/motos` com Fast 3G simulado no DevTools; o skeleton deve aparecer em <100ms, preencher 100% da tela mobile em 1 coluna e 3 colunas no desktop, transicionando para os cards reais sem saltos de rolagem.

- [X] T007 [P] [US1] Create catalog filter bar skeleton component matching mobile drawer trigger and desktop facets in `components/filters/motorcycle-filters-skeleton.tsx`
- [X] T008 [US1] Implement route loading screen in `app/(public)/motos/loading.tsx` assembling hero placeholder, filter bar skeleton, and `MotorcycleGridSkeleton`
- [X] T009 [US1] Verify container padding, min-heights, and responsive grid alignment between `app/(public)/motos/page.tsx` and `app/(public)/motos/loading.tsx` to eliminate layout shift

**Checkpoint**: User Story 1 (Catálogo) 100% funcional, testável de forma independente e elegível para MVP.

---

## Phase 4: User Story 2 - Transição e Visualização Imediata no Detalhe da Moto (Priority: P1)

**Goal**: Apresentar prévia imediata na transição para `/motos/[slug]` com galeria fotográfica 16:10, título, preço, grade de especificações técnicas e bloco sticky de conversão WhatsApp.

**Independent Test**: Clicar em qualquer card de moto no catálogo; o skeleton deve renderizar a estrutura completa da página de detalhes sem tela branca e substituir pelo conteúdo real sem mover os botões de ação.

- [X] T010 [P] [US2] Create vehicle detail gallery skeleton with 16:10 aspect ratio and carousel indicators in `components/gallery/image-carousel-skeleton.tsx`
- [X] T011 [P] [US2] Create vehicle technical specifications grid skeleton matching 2-col mobile and 3-col desktop in `components/motorcycles/motorcycle-specs-skeleton.tsx`
- [X] T012 [P] [US2] Create conversion sticky card skeleton with price, installment badge, WhatsApp CTA button, and store hours in `components/motorcycles/motorcycle-detail-cta-skeleton.tsx`
- [X] T013 [US2] Implement route loading screen in `app/(public)/motos/[slug]/loading.tsx` assembling breadcrumb, gallery, mobile header, specs, sticky conversion card, and similar bikes grid
- [X] T014 [US2] Verify layout alignment and container constraints between `app/(public)/motos/[slug]/page.tsx` and `app/(public)/motos/[slug]/loading.tsx` to ensure CLS < 0.05

**Checkpoint**: User Stories 1 e 2 funcionais e navegáveis de ponta a ponta.

---

## Phase 5: User Story 3 - Cobertura Estrutural nas Demais Rotas Comerciais e Institucionais (Priority: P2)

**Goal**: Garantir experiência estruturada idêntica nas rotas de Aluguel, Venda/Consignação, Histórico Veicular e Institucional.

**Independent Test**: Percorrer cada link do header e footer público (`/aluguel`, `/venda-sua-moto`, `/consignar-moto`, `/historico-veicular`, `/sobre`, `/motos-vendidas`) e validar a exibição dos esqueletos específicos de cada página.

- [X] T015 [P] [US3] Implement rental route loading screen with hero banner, pricing plan comparison cards, and vehicle fleet in `app/(public)/aluguel/loading.tsx`
- [X] T016 [P] [US3] Implement sell your motorcycle route loading screen with multi-step vehicle proposal form and trust badges in `app/(public)/venda-sua-moto/loading.tsx`
- [X] T017 [P] [US3] Implement consignment route loading screen in `app/(public)/consignar-moto/loading.tsx`
- [X] T018 [P] [US3] Implement vehicle history route loading screen with plate search box and sample report preview in `app/(public)/historico-veicular/loading.tsx`
- [X] T019 [P] [US3] Implement about page route loading screen with hero banner, timeline, and physical store info in `app/(public)/sobre/loading.tsx`
- [X] T020 [P] [US3] Implement sold motorcycles route loading screen in `app/(public)/motos-vendidas/loading.tsx`

**Checkpoint**: Todas as páginas públicas de vendas contam com loading skeleton customizado e sem tela em branco.

---

## Phase 6: User Story 4 - Animação Confortável, Anti-Flicker e Acessibilidade Inclusiva (Priority: P2)

**Goal**: Garantir que as animações sejam suaves, não causem cansaço visual, respeitem `prefers-reduced-motion` e anunciem status para leitores de tela.

**Independent Test**: Ativar `prefers-reduced-motion: reduce` no Chrome DevTools e inspecionar os elementos com leitor de tela; validar que a animação é estática e que `role="status"` e `aria-busy="true"` estão presentes.

- [X] T021 [US4] Audit and enforce `aria-busy="true"`, `role="status"`, and `sr-only` descriptions across all route skeletons
- [X] T022 [US4] Verify and test `@media (prefers-reduced-motion: reduce)` in `app/globals.css` ensuring animation is stopped and static background is displayed
- [X] T023 [US4] Tune shimmer gradient colors in `components/ui/skeleton.tsx` and `app/globals.css` for optimal luxury contrast against dark backgrounds (`#050505` and `#151515`)

---

## Phase 7: User Story 5 - Resiliência em Conexões Móveis Degradadas (Priority: P3)

**Goal**: Proteger a experiência em redes celulares lentas ou oscilantes com fallbacks granulares via React Suspense e mensagens de persistência.

**Independent Test**: Simular delay de rede de 10 segundos no DevTools; o layout deve se manter estável sem travar a renderização do browser.

- [X] T024 [US5] Add timeout resilience and subtle persistent status indicator in `app/(public)/loading.tsx`
- [X] T025 [US5] Implement granular React Suspense boundaries with skeleton fallbacks for heavy deferred components in `app/(public)/motos/[slug]/page.tsx` (e.g. similar motorcycles grid)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verificação de tipagem estrita, linting e validação visual de ponta a ponta.

- [X] T026 Run strict TypeScript validation via `npm run typecheck`
- [X] T027 Run ESLint code quality validation via `npm run lint`
- [X] T028 Validate all test scenarios from `specs/024-skeleton-page-transitions/quickstart.md` using Chrome DevTools mobile viewports (375px/390px) and Network Throttling (Fast 3G/Slow 4G)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — execução imediata.
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as User Stories.
- **User Stories (Phase 3+)**: Todas dependem de Phase 2.
  - **US1 (Catálogo)** e **US2 (Detalhe)** são prioridade máxima P1 e podem ser implementadas sequencialmente ou em paralelo após a Phase 2.
  - **US3 (Rotas Comerciais)**, **US4 (Acessibilidade/Shimmer)** e **US5 (Resiliência)** dependem da fundação e enriquecem o produto.
- **Polish (Phase 8)**: Depende da conclusão das User Stories.

### Parallel Opportunities

- Em **Phase 2**: `T004`, `T005` e `T006` podem ser executados em paralelo.
- Em **Phase 4**: `T010`, `T011` e `T012` podem ser desenvolvidos em paralelo antes de `T013`.
- Em **Phase 5**: `T015`, `T016`, `T017`, `T018`, `T019` e `T020` podem ser desenvolvidos em paralelo por arquivos independentes.

---

## Implementation Strategy (MVP First)

1. **Etapa 1**: Concluir Setup (`T001`, `T002`) e Foundational (`T003` - `T006`).
2. **Etapa 2 (MVP)**: Concluir Phase 3 (`T007` - `T009`) entregando o catálogo `/motos` com skeleton perfeito.
3. **Etapa 3**: Concluir Phase 4 (`T010` - `T014`) entregando a página de produto `/motos/[slug]`.
4. **Etapa 4**: Expandir para Phase 5 (`T015` - `T020`) cobrindo 100% das rotas públicas.
5. **Etapa 5**: Acessibilidade e polimento final (`T021` - `T028`).
