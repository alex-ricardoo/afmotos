# Tasks: Redesign da Central de Propostas e Leads (CRM AF Motos)

**Input**: Design artifacts from `specs/011-admin-propostas-redesign/` (`spec.md`, `plan.md`, `data-model.md`, `research.md`, `quickstart.md`, `contracts/proposals-api.md`)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verificação de ambiente e dependências compartilhadas do módulo CRM

- [X] T001 Verificar dependências de ícones, datas e componentes UI em `package.json`
- [X] T002 [P] Validar configurações de domínios de imagens externas (ImgBB e Supabase) em `next.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Normalização de tipos, modelo de dados, dicionários em português e helpers de utilidade

- [X] T003 [P] Atualizar definições de `ProposalViewModel`, `ProposalImage`, `ProposalMotorcycle`, `ProposalStatus` e mappers em `lib/admin/proposal-view-model.ts`
- [X] T004 [P] Atualizar dicionário de rótulos em português (`proposalTypeLabels`, `proposalStatusLabels`) e estilos de badges em `lib/admin/proposal-labels.ts`
- [X] T005 [P] Atualizar helpers de sanitização de telefone, geração de links e mensagens contextuais em `lib/utils/whatsapp.ts`
- [X] T006 Atualizar e tipar as Server Actions `getLeads` e `updateLeadStatus` em `lib/actions/leads.ts`

**Checkpoint**: Camada de dados e utilitários normalizada — implementação das histórias de usuário concluída.

---

## Phase 3: User Story 1 - Atendimento Rápido e Contato via WhatsApp (Priority: P1) 🌟 MVP

**Goal**: Permitir ao vendedor iniciar atendimento no WhatsApp em 1 clique com mensagem pré-formatada e copiar telefone higienizado com feedback visual.

**Independent Test**: Clicar no botão "Falar no WhatsApp" no card ou detalhe e verificar abertura correta da URL `wa.me/55...` com texto contextualizado da moto e nome do cliente; clicar no botão de copiar telefone e confirmar toast "Telefone copiado!".

- [X] T007 [P] [US1] Implementar botão principal de WhatsApp e botão de cópia de telefone no card em `components/admin/admin-propostas-contacts.tsx`
- [X] T008 [P] [US1] Implementar seletor de modelos de resposta rápida WhatsApp (Padrão, Pedir Fotos/Doc, Agendar Visita, Contraproposta) em `components/admin/proposal-detail-drawer.tsx`
- [X] T009 [US1] Implementar botão de ação de WhatsApp e cópia de mensagem completa no painel de detalhes em `components/admin/proposal-detail-drawer.tsx`

**Checkpoint**: Atendimento via WhatsApp totalmente funcional e independente.

---

## Phase 4: User Story 2 - Gestão e Transição Rápida de Status Comercial (Priority: P1)

**Goal**: Permitir alteração imediata de status comercial no card e no detalhe com atualização otimista na interface e sincronização no Supabase.

**Independent Test**: Alterar o status de um lead pelo dropdown do card ou pelos botões do detalhe; constatar mudança visual imediata (< 50ms), toast de sucesso e confirmação da persistência no reload da página.

- [X] T010 [P] [US2] Implementar menu dropdown de status com cores e pontos indicativos no card comercial em `components/admin/admin-propostas-contacts.tsx`
- [X] T011 [P] [US2] Implementar grade de seleção rápida de status no painel de detalhes em `components/admin/proposal-detail-drawer.tsx`
- [X] T012 [US2] Integrar atualização otimista no estado local e tratamento de rollback com notificação de erro via Sonner toast em `components/admin/admin-propostas-contacts.tsx`

**Checkpoint**: Pipeline de status com atualização otimista 100% operacional.

---

## Phase 5: User Story 3 - Visualização com Galeria de Fotos e Indicador FIPE (Priority: P2)

**Goal**: Exibir foto de capa e contagem de fotos nos cards, galeria em alta resolução com tela cheia no detalhe e comparativo percentual com a Tabela FIPE.

**Independent Test**: Abrir card com fotos, validar carregamento de capa e badge `+N fotos`, clicar para abrir visualizador em tela cheia (`ImageFullscreen`) e inspecionar a badge percentual FIPE.

- [X] T013 [P] [US3] Implementar renderização de foto de capa com contador de fotos e fallback visual em `components/admin/admin-propostas-contacts.tsx`
- [X] T014 [P] [US3] Implementar galeria de miniaturas clicáveis e integração com `ImageFullscreen` em `components/admin/proposal-detail-drawer.tsx`
- [X] T015 [US3] Implementar bloco financeiro com valor desejado vs. valor FIPE e cálculo percentual (`-X% abaixo da FIPE`) em `components/admin/proposal-detail-drawer.tsx`

**Checkpoint**: Galeria de imagens multi-provedor e análise FIPE operando com fluidez.

---

## Phase 6: User Story 4 - Busca, Filtros Multidimensionais e Visão Adaptativa Mobile/Desktop (Priority: P2)

**Goal**: Oferecer métricas reais clicáveis, busca instantânea, abas de filtro por status e tipo, alternância de visão (Cards/Tabela) e layout adaptativo (Dialog desktop vs Bottom Sheet mobile).

**Independent Test**: Realizar buscas em tempo real, filtrar por abas de status, alternar entre grade de cards e tabela compacta, e testar responsividade em viewport mobile (< 768px).

- [X] T016 [P] [US4] Implementar barra de métricas com contagens dinâmicas reais clicáveis para filtragem em `components/admin/admin-propostas-contacts.tsx`
- [X] T017 [P] [US4] Implementar campo de busca em tempo real e seletor de tipo de solicitação na barra de ferramentas em `components/admin/admin-propostas-contacts.tsx`
- [X] T018 [P] [US4] Implementar alternância entre visualização em Cards e Tabela Compacta em `components/admin/admin-propostas-contacts.tsx`
- [X] T019 [US4] Implementar responsividade adaptativa (Dialog amplo no desktop vs Bottom Sheet no mobile) com `useMediaQuery` em `components/admin/proposal-detail-drawer.tsx`
- [X] T020 [US4] Conectar a página `app/admin/(protected)/propostas/page.tsx` para carregar os dados via Server Component sem dados mockados

**Checkpoint**: Painel CRM completo com busca, filtros, métricas reais e responsividade mobile-first.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificação de segurança, validação de tipos, lint e garantia de qualidade

- [X] T021 [P] Auditar políticas de segurança RLS das tabelas `leads`, `sell_requests` e `sell_request_images`
- [X] T022 Executar checagem de tipos com `npm run typecheck`
- [X] T023 Executar linter com `npm run lint`
- [X] T024 Validar todos os cenários de teste documentados em `quickstart.md`

---

## Dependencies & Execution Order

```text
Phase 1: Setup (T001 - T002) [COMPLETED]
    └── Phase 2: Foundational (T003 - T006) [COMPLETED]
            ├── Phase 3: User Story 1 - WhatsApp (T007 - T009) [COMPLETED]
            ├── Phase 4: User Story 2 - Status (T010 - T012) [COMPLETED]
            ├── Phase 5: User Story 3 - Fotos & FIPE (T013 - T015) [COMPLETED]
            └── Phase 6: User Story 4 - Busca & Filtros (T016 - T020) [COMPLETED]
                    └── Phase 7: Polish & Quality (T021 - T024) [COMPLETED]
```

### Parallel Opportunities

- **Foundational**: T003, T004 e T005 executadas com tipagem estrita e sem `any`.
- **User Story 1 & 2**: Módulos de atendimento e pipeline entregues com otimizações em tempo real.
- **User Story 3 & 4**: Galeria multi-provedor, visualizador em tela cheia e responsividade refinados.
