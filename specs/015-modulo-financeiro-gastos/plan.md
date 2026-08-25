# Implementation Plan: Módulo Financeiro de Gastos

**Branch**: `015-modulo-financeiro-gastos` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-modulo-financeiro-gastos/spec.md`

## Summary

Implementação do Módulo Financeiro de Gastos da AF Motos no painel administrativo (`/admin/gastos`). O sistema permitirá o lançamento, consulta, edição, cancelamento/exclusão e análise de despesas operacionais divididas entre **Gastos de Motos** (associados a um veículo específico) e **Gastos Gerais da Loja** (aluguel, luz, internet, marketing, folha, etc.). A solução inclui relatórios de competência mensal, categorias administráveis, gráficos de distribuição e totalização acumulada de custos por motocicleta, tudo protegido por RLS e desenhado com abordagem mobile-first.

## Technical Context

**Language/Version**: TypeScript 5+ (Strict mode), Next.js 15 (App Router, React 19)

**Primary Dependencies**: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `zod`, `tailwind-merge`, `clsx`, `recharts` ou componentes visuais nativos, `sonner`

**Storage**: PostgreSQL no Supabase (`public.expenses`, `public.expense_categories`) com Row Level Security (RLS)

**Testing**: ESLint (`npm run lint`), TypeScript (`npm run typecheck`), Build Validation (`npm run build`) e roteiro E2E manual em `quickstart.md`

**Target Platform**: Navegadores Web (Mobile: 320px–430px, Tablet: 768px, Desktop: 1024px+)

**Project Type**: Aplicação Web Fullstack com Server Components e Server Actions

**Performance Goals**: Carregamento da central de gastos e atualização de totais em menos de 1 segundo

**Constraints**: RLS estrito (acesso exclusivo a administradores), zero transbordo horizontal em telas móveis, conformidade total com as regras do `AGENTS.md` do Next.js

**Scale/Scope**: Módulo financeiro central com suporte a centenas de lançamentos mensais por competência

## Constitution Check

_GATE: Validado antes da pesquisa e confirmado após o design._

- **Princípio I (Product First)**: ✅ Interface direta e em português para a rotina diária do dono da loja.
- **Princípio II (Mobile First)**: ✅ Modais em Drawer no celular e cards responsivos sem barras de rolagem horizontais.
- **Princípio III (Type Safety)**: ✅ Tipos compartilhados em `types/expenses.ts` e validação runtime com Zod Schemas.
- **Princípio IV (Segurança)**: ✅ Mutações e consultas executadas no servidor com RLS ativo na tabela.
- **Princípio V (Supabase)**: ✅ Banco PostgreSQL hospedado no Supabase como fonte única de verdade.
- **Princípio VIII (UX Consistente)**: ✅ Utilização da paleta visual AF Motos (Preto `#0c0c0f`, Dourado `#c9a44c`, Zinc neutrals).
- **Princípio XII (Evolução Incremental)**: ✅ Módulo desacoplado de receitas e vendas, pronto para expansão em etapas futuras.

## Project Structure

### Documentation (this feature)

```text
specs/015-modulo-financeiro-gastos/
├── plan.md              # Este plano de implementação
├── research.md          # Pesquisa técnica e decisões de arquitetura
├── data-model.md        # Esquema de banco de dados, RLS e seeds
├── quickstart.md        # Roteiro de testes e validação E2E
├── contracts/           # Contratos de Server Actions e consultas
│   └── server-actions.md
└── checklists/
    └── requirements.md  # Checklist de validação de requisitos
```

### Source Code (repository root)

```text
app/
└── admin/
    └── (protected)/
        └── gastos/
            ├── page.tsx                          # Página principal da central de gastos
            └── actions.ts                         # Server Actions (criar, editar, excluir, status)

components/
└── admin/
    ├── admin-sidebar.tsx                         # Atualização: Novo item 'Gastos' no menu
    └── expenses/
        ├── expense-dashboard-summary.tsx         # Cards de indicadores superiores
        ├── expense-charts.tsx                    # Gráficos de categorias e evolução
        ├── expense-list.tsx                      # Tabela desktop & Cards mobile
        ├── expense-form-modal.tsx                # Dialog (desktop) / Drawer (mobile) de cadastro
        ├── expense-detail-modal.tsx              # Modal/Drawer de detalhes do gasto
        ├── expense-filters.tsx                   # Filtros por mês, busca e status
        └── category-manager-modal.tsx            # Modal de gerenciamento de categorias

lib/
└── expenses.ts                                   # Queries server-side Supabase para despesas

types/
└── expenses.ts                                   # Definição de interfaces TypeScript e Schemas Zod

supabase/
└── migrations/
    └── 20260824200000_create_expenses_table.sql  # Migration do banco (tabelas, RLS, FKs, seed)
```

**Structure Decision**: A aplicação segue a arquitetura Next.js App Router com separação clara entre a rota administrativa em `app/admin/(protected)/gastos`, componentes modulares de interface em `components/admin/expenses`, lógica de banco em `lib/expenses.ts` e Server Actions em `actions.ts`.

## Complexity Tracking

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| *Nenhuma violação identificada* | N/A | N/A |
