# Implementation Plan: Redesign da Central de Propostas e Leads (CRM AF Motos)

**Branch**: `011-admin-propostas-redesign` | **Date**: 2026-08-23 | **Spec**: [`specs/011-admin-propostas-redesign/spec.md`](./spec.md)

**Input**: Redesenhar completamente a tela administrativa de propostas, contatos e leads (`/admin/propostas`) transformando-a em uma central comercial moderna, rápida, mobile-first, com indicadores reais, galeria de fotos, WhatsApp integrado, alteração ágil de status e suporte a múltiplas fontes de contato sem dados mockados.

## Summary

O projeto de Redesign da Central de Propostas e CRM visa transformar a rota `/admin/propostas` em um hub comercial avançado. A solução unifica os dados de contatos, vendas e consignações em um `ProposalViewModel` tipado, fornece métricas dinâmicas reais, busca em tempo real, suporte a visualização em grade e tabela, integração fluida com WhatsApp através de modelos de mensagens contextuais, exibição e ampliação de fotos (ImgBB e Supabase) e alteração instantânea de status com atualização otimista na interface.

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode), Node.js 20+

**Primary Dependencies**: Next.js 15 (App Router, Server Components & Server Actions), React 19, Tailwind CSS, Lucide React, Date-fns, Sonner (Toasts), Radix UI (Dialog, Sheet, DropdownMenu)

**Storage**: Supabase PostgreSQL (`public.leads`, `public.sell_requests`, `public.consignment_requests`, `public.sell_request_images`), ImgBB e Supabase Storage

**Testing**: Validação ponta a ponta manual via cenários de atendimento, `npm run typecheck`, `npm run lint` e `npm run build`

**Target Platform**: Web responsiva (Mobile-First em smartphones a partir de 320px, tablets e desktops)

**Project Type**: Next.js Web Application (Admin CRM Dashboard)

**Performance Goals**: Carregamento da central em < 200ms, mutação otimista de status em < 50ms, pesquisa/filtragem instantânea no cliente

**Constraints**: Sem dados mockados, sem N+1 queries, respeito rigoroso às políticas de RLS e zero vazamento de credenciais ou dados sensíveis

**Scale/Scope**: 1 página principal (`/admin/propostas`), 3 componentes de CRM (`admin-propostas-contacts`, `proposal-detail-drawer`, `image-fullscreen`), 2 arquivos de mapeamento/domínio (`proposal-view-model`, `whatsapp`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Princípio I (Product First)**: PASS — Focado na produtividade do vendedor e na conversão rápida de leads.
- **Princípio II (Mobile First)**: PASS — Bottom Sheet dedicado e botões ergonômicos para uso em celular.
- **Princípio III (Type Safety)**: PASS — TypeScript estrito em todas as camadas (`ProposalViewModel`, `ProposalStatus`).
- **Princípio IV (Segurança)**: PASS — RLS mantido nas tabelas Supabase e mutações via Server Actions administrativas.
- **Princípio V (Supabase como Fonte de Dados)**: PASS — Consultas diretas ao Supabase sem bancos paralelos.
- **Princípio VI (Componentização por Domínio)**: PASS — Componentes organizados em `components/admin/` e lógica em `lib/admin/`.
- **Princípio VII (Integrações Desacopladas)**: PASS — Helpers isolados para formatação de WhatsApp e extração de imagens.
- **Princípio VIII (UX Consistente)**: PASS — Identidade visual AF Motos (preto, grafite, dourado e esmeralda).
- **Princípio IX (Performance & SEO)**: PASS — Carregamento eficiente com thumbnails e imagens sob demanda.
- **Princípio X (Testabilidade)**: PASS — Mappers puros e funções de sanitização de telefone testáveis isoladamente.
- **Princípio XI (Observabilidade)**: PASS — Notificações de feedback via Sonner toast e logs de erro estruturados.
- **Princípio XII (Evolução Incremental)**: PASS — Estrutura preparada para expansão futura de pipeline sem refatorações drásticas.

## Project Structure

### Documentation (this feature)

```text
specs/011-admin-propostas-redesign/
├── plan.md              # Este arquivo
├── research.md          # Decisões arquiteturais e resolução de incógnitas
├── data-model.md        # Definição de entidades, tipos e máquina de estados
├── quickstart.md        # Guia de teste rápido e validação
├── contracts/           # Contratos de interfaces e Server Actions
│   └── proposals-api.md
└── checklists/
    └── requirements.md  # Checklist de validação de requisitos
```

### Source Code (repository root)

```text
app/
└── admin/
    └── (protected)/
        └── propostas/
            ├── page.tsx                           # Server Component para carregamento de leads
            └── columns.tsx                        # Definições de colunas da tabela
components/
└── admin/
    ├── admin-propostas-contacts.tsx               # Componente principal do CRM (Toolbar, Métricas, Grid, Tabela)
    └── proposal-detail-drawer.tsx                 # Modal amplo (Desktop) e Bottom Sheet (Mobile) com presets WhatsApp
lib/
├── actions/
│   └── leads.ts                                   # Server Actions: getLeads, updateLeadStatus, createSellRequestAction
├── admin/
│   ├── proposal-view-model.ts                     # Definições do ViewModel e mappers
│   └── proposal-labels.ts                         # Labels e mapeamentos em português
└── utils/
    └── whatsapp.ts                                # Helpers para sanitização de número e geração de links
```

**Structure Decision**: A feature integra-se diretamente à arquitetura Next.js App Router existente em `app/admin/(protected)/propostas` com separação limpa entre Server Components para leitura de dados e Client Components ricos para interatividade de atendimento.

## Complexity Tracking

| Aspecto | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| ViewModel Unificado | Várias origens de propostas (`leads`, `sell_requests`) com formatos ligeiramente diferentes | Deixar os componentes lidarem com condicionais poluídas aumentaria acoplamento e geraria bugs de renderização |
| Visualização Híbrida (Dialog/Sheet) | Proporciona melhor ergonomia no mobile e máximo aproveitamento de espaço no desktop | Usar um único Dialog centralizado ficaria apertado ou cortado no mobile |
