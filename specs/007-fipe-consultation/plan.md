# Implementation Plan: Consulta Tabela FIPE

**Branch**: `007-fipe-consultation` | **Date**: 2026-08-22 | **Spec**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/007-fipe-consultation/spec.md)

**Input**: Feature specification from `specs/007-fipe-consultation/spec.md`

## Summary

Criar uma área administrativa para consultar valores de referência de motocicletas via API fipeX (`https://api.fipex.com.br`). A funcionalidade inclui formulário progressivo (tipo → marca → modelo → ano → combustível), card de resultado, salvamento de consultas no banco, histórico, vinculação a motos cadastradas e comparação de preços. A integração é centralizada em `lib/fipex/` com adaptadores desacoplados. Os dados são persistidos em `public.fipe_consultations` com RLS restritiva.

## Technical Context

**Language/Version**: TypeScript 5 (strict) + Next.js 16.3.2 (App Router, React 19)

**Primary Dependencies**: `@supabase/ssr ^0.12.4`, `@supabase/supabase-js ^2.112.3`, `zod ^4.4.3`, `react-hook-form ^7.85.0`, `sonner ^2.0.8`, `lucide-react ^1.33.0`, `date-fns ^4.4.0`, `@tanstack/react-table ^8.21.3`

**Storage**: PostgreSQL (Supabase) — nova tabela `public.fipe_consultations`

**Testing**: `npm run lint`, `npm run build` (typecheck embutido), testes manuais de RLS

**Target Platform**: Web (desktop + mobile), painel admin protegido por auth

**Project Type**: Web application (Next.js fullstack com Supabase)

**Performance Goals**: Consulta FIPE completa em <30s, histórico com 100+ registros sem degradação, timeout configurável de 10s para API externa

**Constraints**: API fipeX: 10 req/s por IP, burst 60, max 50 itens/página, sem autenticação, CORS aberto. Não alterar `motorcycles.price` automaticamente. Não expor dados sensíveis.

**Scale/Scope**: Single-admin, ~100 consultas/mês estimado, 1 tabela nova, ~15 arquivos novos, 1 componente de sidebar modificado

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio | Status | Justificativa |
|---|---|---|
| I. Product First | ✅ | Funcionalidade direta para o administrador; formulário intuitivo, resultado claro |
| II. Mobile First | ✅ | Layout mobile vertical (formulário → resultado → histórico); touch targets adequados |
| III. Type Safety | ✅ | TypeScript strict; Zod para validação de respostas da API externa; tipos internos desacoplados |
| IV. Segurança | ✅ | API fipeX pública (sem secrets); mutations via Server Actions; RLS com `is_admin()`; `created_by = auth.uid()` |
| V. Supabase como Fonte | ✅ | Nova tabela `fipe_consultations` no Supabase PostgreSQL |
| VI. Componentização | ✅ | Componentes em `components/admin/fipe/`; serviço em `lib/fipex/`; queries separadas |
| VII. Integrações Desacopladas | ✅ | Camada `lib/fipex/` com client, types, mappers, errors — UI não depende diretamente do formato da API |
| VIII. UX Consistente | ✅ | Usa design system existente (tokens, sidebar, cards); estados de loading/error/empty/success |
| IX. Performance & SEO | ✅ | Rota admin: `robots: { index: false }`; cache curto em listas; Server Components onde possível |
| X. Testabilidade | ✅ | `calculatePriceDifference` e mappers são funções puras testáveis isoladamente |
| XI. Observabilidade | ✅ | Consultas salvas com `query_payload` e `response_snapshot` para auditoria |
| XII. Evolução Incremental | ✅ | Foco no MVP (consulta + histórico + vínculo); extensível para suportar novos providers futuros |

**Gate result**: ✅ All pass — nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/007-fipe-consultation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── fipex-api.md
│   └── ui-contracts.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
└── admin/
    └── (protected)/
        └── fipe/
            └── page.tsx                    # Rota principal

components/
└── admin/
    ├── admin-sidebar.tsx                   # Modificar: adicionar item "Tabela FIPE"
    └── fipe/
        ├── fipe-page-client.tsx            # Client wrapper para interatividade
        ├── fipe-search-form.tsx            # Formulário progressivo
        ├── fipe-result-card.tsx            # Card de resultado
        ├── fipe-motorcycle-linker.tsx       # Vinculação com moto
        ├── fipe-price-comparison.tsx        # Comparação de preços
        ├── fipe-history-section.tsx         # Seção de histórico (tabela + cards)
        └── fipe-source-notice.tsx           # Avisos de fonte/referência

lib/
├── fipex/
│   ├── client.ts                           # HTTP client com timeout/retry
│   ├── types.ts                            # Tipos da API fipeX (raw)
│   ├── schemas.ts                          # Zod schemas para validação
│   ├── mappers.ts                          # Conversão raw → tipos internos
│   ├── errors.ts                           # Error classes e handling
│   └── cache.ts                            # Cache em memória para listas
├── domain/
│   └── fipe-price.ts                       # calculatePriceDifference (função pura)
├── queries/
│   └── fipe-consultations.ts               # Queries de leitura
├── actions/
│   └── fipe-consultations.ts               # Server Actions (mutations)
└── validations/
    └── fipe-consultation.ts                # Zod schemas do formulário

types/
└── database.ts                             # Adicionar tipagem de fipe_consultations

supabase/
└── migrations/
    └── 00022_create_fipe_consultations.sql  # Tabela + índices + RLS + trigger
```

**Structure Decision**: Segue a estrutura existente do projeto — `lib/` para lógica de negócio, `components/admin/` para UI, `lib/actions/` para Server Actions, `lib/queries/` para leituras, `lib/validations/` para schemas Zod. A nova camada `lib/fipex/` é o adaptador isolado (Princípio VII).

## Complexity Tracking

> Nenhuma violação constitucional — tabela não necessária.
