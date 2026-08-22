# Tasks: AF Motos — Evolução Completa da Experiência Pública

**Feature**: `006-public-experience-evolution`
**Input**: Design documents from `specs/006-public-experience-evolution/` (`spec.md`, `plan.md`, `data-model.md`, `research.md`, `contracts/`, `quickstart.md`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estrutura base de internacionalização e utilitários compartilhados

- [x] T001 [P] Criar módulo central de traduções e rótulos públicos em `lib/utils/translations.ts`
- [x] T002 [P] Atualizar constantes e fallbacks institucionais padrão em `lib/utils/constants.ts`
- [x] T003 Configurar montagem do provedor global do Sonner em `app/layout.tsx` e `app/(public)/layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de dados e queries de facetas que desbloqueiam as histórias de usuário

**⚠️ CRITICAL**: Todas as histórias de busca, catálogo e navegação dependem destas queries

- [x] T004 Implementar função de extração de facetas dinâmicas `getMotorcycleFilterFacets()` em `lib/queries/motorcycles.ts`
- [x] T005 [P] Criar validação de schema e tipos Zod para propostas e anúncios em `lib/validations/sell-request.ts`
- [x] T006 [P] Atualizar validação de schema para locação e leads em `lib/validations/lead.ts`
- [x] T007 Configurar redirecionamentos de rotas legadas e termos no `next.config.ts`

**Checkpoint**: Camada de dados, facetas e validações pronta para implementação paralela das histórias.

---

## Phase 3: User Story 1 - Descoberta Visual e Navegação Fluida na Home (Priority: P1) 🎯 MVP

**Goal**: Permitir que visitantes em celulares e desktops visualizem uma Hero nítida e acolhedora, naveguem com o link explícito "Início" no header e acessem CTAs sem promessas comerciais falsas.

**Independent Test**: Carregar `http://localhost:3000/`, inspecionar a visibilidade da foto de fundo com contraste equilibrado, verificar o item "Início" no header e mobile drawer, e acionar os botões "Ver motos disponíveis" e "Anunciar minha moto".

### Implementation for User Story 1

- [x] T008 [US1] Adicionar item de navegação explícito "Início" (`/`) e renomear "Consignação" para "Anuncie sua moto" no header desktop em `components/layout/header.tsx`
- [x] T009 [US1] Atualizar menu mobile drawer com link ativo para "Início" e rotas atualizadas em `components/layout/header.tsx`
- [x] T010 [US1] Ajustar visibilidade da imagem na Hero da Home (opacidade 80%, gradiente direcional focado no texto) em `app/(public)/page.tsx`
- [x] T011 [US1] Reescrever título, subtítulo e CTAs da Hero da Home eliminando promessas falsas de laudo ou financiamento em `app/(public)/page.tsx`
- [x] T012 [US1] Ajustar seção de diferenciais e transparência da Home em `app/(public)/page.tsx`

**Checkpoint**: A página inicial (Hero + Navegação) está refinada, acessível e testável de forma independente.

---

## Phase 4: User Story 2 - Catálogo Dinâmico e Filtros Baseados em Dados Reais (Priority: P1)

**Goal**: Substituir todos os filtros fixos/hardcoded da Home e do Catálogo por opções derivadas unicamente dos registros de motos ativas retornadas pelo Supabase, 100% em português.

**Independent Test**: Acessar `http://localhost:3000/motos` e a barra de QuickSearch na Home, confirmando que marcas, anos e faixas de preço refletem apenas o estoque existente no banco (sem marcas fictícias ou seletores em inglês).

### Implementation for User Story 2

- [x] T013 [P] [US2] Refatorar componente `QuickSearch` para consumir facetas dinâmicas e usar rótulos em português em `components/filters/quick-search.tsx`
- [x] T014 [P] [US2] Refatorar componente `MotorcycleFilters` para consumir facetas reais do Supabase e sincronizar URL em `components/filters/motorcycle-filters.tsx`
- [x] T015 [US2] Atualizar página do catálogo `app/(public)/motos/page.tsx` para carregar facetas no servidor via `getMotorcycleFilterFacets()` e passá-las para os filtros
- [x] T016 [US2] Injetar facetas dinâmicas na seção `QuickSearch` da página inicial em `app/(public)/page.tsx`
- [x] T017 [US2] Implementar estado vazio humanizado quando a busca por filtros não encontrar motos em `components/motorcycles/motorcycle-grid.tsx`

**Checkpoint**: Filtros da Home e da página `/motos` são 100% dinâmicos e sincronizados com o estoque real.

---

## Phase 5: User Story 3 - Visualização de Cards de Motos em Destaque e Catálogo (Priority: P1)

**Goal**: Apresentar cards de motos com estética refinada, proporção de imagem consistente, fallback para ausência de foto, badges de status traduzidos e CTA direto de WhatsApp contextualizado.

**Independent Test**: Visualizar os cards na Home e em `/motos`, conferir formatação de preço em Reais (`R$`), badges traduzidos ("Disponível", "Reservada", "Vendida") e acionar o botão de WhatsApp verificando a mensagem preenchida com modelo e ano.

### Implementation for User Story 3

- [x] T018 [US3] Atualizar `MotorcycleStatusBadge` para utilizar o dicionário central de status em português em `components/motorcycles/motorcycle-status-badge.tsx`
- [x] T019 [US3] Redesenhar layout, tipografia Brand Gold `#c9a44c` e proporção `aspect-[16/10]` em `components/motorcycles/motorcycle-card.tsx`
- [x] T020 [US3] Adicionar fallback visual elegante para motocicletas sem fotos cadastradas em `components/motorcycles/motorcycle-card.tsx`
- [x] T021 [US3] Integrar botão de ação rápida para WhatsApp com mensagem contextualizada nos cards em `components/motorcycles/motorcycle-card.tsx`
- [x] T022 [US3] Atualizar página de histórico de motos vendidas em `app/(public)/motos-vendidas/page.tsx` com novo padrão de cards e status

**Checkpoint**: Cards de motos em destaque, catálogo e histórico operam com redesign consistente.

---

## Phase 6: User Story 4 - Anúncio e Proposta de Venda Direta ("Anuncie sua moto") (Priority: P2)

**Goal**: Disponibilizar página unificada `/anunciar-sua-moto` com etapas claras do processo de anúncio, formulário seguro com upload de fotos e validação amigável.

**Independent Test**: Acessar `http://localhost:3000/anunciar-sua-moto`, preencher os campos com fotos, submeter e verificar o toast de sucesso e o lead persistido no Supabase.

### Implementation for User Story 4

- [x] T023 [P] [US4] Criar Server Action para submissão de anúncios e fotos de clientes em `lib/actions/leads.ts`
- [x] T024 [P] [US4] Criar componente de formulário unificado `AnunciarMotoForm` com validação Zod e upload em `components/forms/anunciar-moto-form.tsx`
- [x] T025 [US4] Criar página pública unificada `app/(public)/anunciar-sua-moto/page.tsx` com etapas explicativas e formulário
- [x] T026 [US4] Atualizar rotas legadas `app/(public)/consignar-moto/page.tsx` e `app/(public)/venda-sua-moto/page.tsx` para reutilizar o fluxo unificado ou redirecionar

**Checkpoint**: Fluxo de anúncio de motos de terceiros unificado, sem duplicação e com upload validado.

---

## Phase 7: User Story 5 - Locação de Motocicletas com Planos Flexíveis e Personalizados (Priority: P2)

**Goal**: Permitir aos clientes consultar planos vigentes e solicitar condições personalizadas para durações maiores (ex.: 3, 6, 12 meses) na página de aluguel.

**Independent Test**: Acessar `http://localhost:3000/aluguel`, rolar até a seção de planos sob medida, submeter uma solicitação para 6 meses e verificar a criação do lead comercial.

### Implementation for User Story 5

- [x] T027 [P] [US5] Criar componente `CustomRentalForm` para solicitação de planos personalizados em `components/forms/custom-rental-form.tsx`
- [x] T028 [US5] Adicionar seção "Precisa alugar por mais tempo?" e integrar formulário na página `app/(public)/aluguel/page.tsx`
- [x] T029 [US5] Atualizar `RentalForm` padrão para emitir toasts padronizados do Sonner em `components/forms/rental-form.tsx`

**Checkpoint**: Página de aluguel pronta com suporte a planos sob medida de médio/longo prazo.

---

## Phase 8: User Story 6 - Política de Privacidade e Conformidade Legal (Priority: P2)

**Goal**: Publicar página de Política de Privacidade conforme LGPD e Marco Civil em `/politica-de-privacidade` e remover referências a Termos de Uso.

**Independent Test**: Acessar `/politica-de-privacidade` via link no rodapé, verificar seções legais com placeholders editáveis e confirmar ausência total de links para Termos de Uso.

### Implementation for User Story 6

- [x] T030 [P] [US6] Criar página de Política de Privacidade com estrutura LGPD em `app/(public)/politica-de-privacidade/page.tsx`
- [x] T031 [US6] Remover links e menções a "Termos de Uso" e apontar link para Política de Privacidade em `components/layout/footer.tsx`

**Checkpoint**: Conformidade com LGPD implementada e Termos de Uso eliminados do site.

---

## Phase 9: User Story 7 - Sistema Centralizado de Toasts, Tooltips e Feedback Visual (Priority: P2)

**Goal**: Assegurar feedback acessível, não intrusivo e em português para todos os formulários públicos e administrativos, eliminando `alert()` e prevenindo duplo envio.

**Independent Test**: Submeter formulários com falhas de validação forçadas e dados válidos, verificando exibição imediata de toasts Sonner e estado desabilitado durante o envio.

### Implementation for User Story 7

- [x] T032 [US7] Auditar e padronizar toasts de sucesso, erro e loading em todos os formulários públicos (`components/forms/`)
- [x] T033 [US7] Adicionar desabilitação e indicador de progresso no clique de botões de formulário para evitar envios duplicados

**Checkpoint**: Sistema de feedback consistente e acessível em 100% dos formulários.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: SEO, acessibilidade, fallbacks institucionais e validação da build

- [x] T034 [P] Configurar metadata de SEO e Open Graph realistas em todas as páginas públicas (`app/(public)/**/page.tsx`)
- [x] T035 [P] Assegurar fallbacks institucionais para ausência de dados em `site_settings` no header, footer e botões de WhatsApp
- [x] T036 Auditar contraste de cores (WCAG 2.2 AA) e navegação por teclado nos componentes públicos
- [x] T037 Executar validação automatizada de tipagem TypeScript via `npm run typecheck` / `npx tsc --noEmit`
- [x] T038 Executar validação de linting
- [x] T039 Executar compilação de produção via `npm run build`
- [x] T040 Executar cenários de validação manual do `quickstart.md`
