# Implementation Plan: Central de Relatórios Gerenciais e Exportação Contábil

**Branch**: `017-central-relatorios-gerenciais` | **Date**: 2026-08-30 | **Spec**: [specs/017-central-relatorios-gerenciais/spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/017-central-relatorios-gerenciais/spec.md)

**Input**: Feature specification from `/specs/017-central-relatorios-gerenciais/spec.md`

---

## 1. Summary

A Central de Relatórios Gerenciais (`/admin/relatorios`) provê ao gestor da AF Motos um painel executivo em tempo real para monitoramento de faturamento de vendas, ticket médio, despesas categorizadas (oficina vs loja), resultado operacional gerencial estimado, giro e idade do estoque, novos clientes e leads captados. O módulo também oferece exportação estruturada em múltiplos formatos (CSV com UTF-8 BOM, planilhas XLSX e PDFs executivos via `@react-pdf/renderer`) para apoio ao contador responsável, respeitando o princípio de isenção de responsabilidade fiscal e privacidade LGPD.

---

## 2. Technical Context

- **Language/Version**: TypeScript 5.x (Strict Mode `strict: true`), React 19, Next.js 16 (App Router)
- **Primary Dependencies**: Tailwind CSS v4, `@react-pdf/renderer`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`, `shadcn/ui`
- **Storage & Database**: PostgreSQL no Supabase, Row Level Security (RLS) com função `public.is_admin()`, Supabase SSR client
- **Testing & Quality**: Next.js ESLint, TypeScript Typecheck (`tsc --noEmit`), Testes manuais guiados por `quickstart.md`
- **Target Platform**: Web responsiva (Desktop e Mobile-First) rodando em navegadores modernos
- **Project Type**: Web Application Admin Dashboard & Data Export Engine
- **Performance Goals**: Carregamento da visão geral e alternância de períodos em < 800ms; agregação server-side sem gargalos
- **Constraints**: Sem exposição de credenciais privadas; nenhum cálculo fiscal oficial automático; downloads gerados on-the-fly sem armazenamento persistente de PII
- **Scale/Scope**: Painel administrativo modular em 6 abas temáticas, 4 componentes de gráficos customizados e 3 motores de exportação

---

## 3. Constitution Check

*GATE: Avaliação de conformidade com os 12 Princípios Constitucionais da AF Motos.*

| Princípio | Status | Justificativa de Conformidade |
|---|---|---|
| **I. Product First** | PASS | Atende diretamente à tomada de decisão do dono da loja e facilitação do fechamento contábil. |
| **II. Mobile First** | PASS | Filtros em Sheet/Drawer inferior, cards de KPI compactos e tabelas adaptativas para smartphones. |
| **III. Type Safety** | PASS | Tipos TypeScript estritos em `lib/reports/types.ts`, sem uso de `any` ou casts inseguros. |
| **IV. Segurança** | PASS | Consultas e rotas de exportação restritas a administradores autenticados com RLS. |
| **V. Supabase como Fonte de Dados** | PASS | Queries agregadas executadas diretamente no PostgreSQL do Supabase via client SSR. |
| **VI. Componentização por Domínio** | PASS | Componentes isolados em `components/admin/reports/` e lógica de negócios em `lib/reports/`. |
| **VII. Integrações Desacopladas** | PASS | Geração de relatórios não cria acoplamento rígido com gateways externos. |
| **VIII. UX Consistente** | PASS | Aderência total à paleta dark (`#08080a`, `#c9a44c`), tipografia e tokens visuais do admin. |
| **IX. Performance & SEO** | PASS | Agregações SQL no servidor, projeções enxutas de colunas e zero overhead de bundle no cliente. |
| **X. Testabilidade** | PASS | Utilitários de data e formatadores estruturados como funções puras desacopladas de UI. |
| **XI. Observabilidade** | PASS | Logs estruturados no servidor para operações de download sem vazamento de PII. |
| **XII. Evolução Incremental** | PASS | Arquitetura preparada para receber custos de compra e novas métricas quando o schema evoluir. |

---

## 4. Project Structure

### Documentation (this feature)

```text
specs/017-central-relatorios-gerenciais/
├── spec.md                  # Especificação funcional e requisitos de negócio
├── plan.md                  # Este plano de implementação
├── research.md              # Decisões de arquitetura, trade-offs e fórmulas matemáticas
├── data-model.md            # Modelo de dados, contratos TypeScript e índices
├── quickstart.md            # Guia de navegação e roteiro de testes
├── contracts/
│   └── export-api.md        # Contrato da API de download de relatórios
├── checklists/
│   └── requirements.md      # Validação de qualidade da especificação
└── tasks.md                 # Divisão em 22 tarefas executáveis
```

### Source Code (repository root)

```text
app/
├── admin/(protected)/
│   └── relatorios/
│       ├── page.tsx                           # Página principal do módulo (Server Component)
│       ├── loading.tsx                        # Skeleton de carregamento
│       └── error.tsx                          # Tratamento de erro resiliente
└── api/admin/reports/export/
    └── route.ts                               # Route Handler de exportação (CSV, XLSX, PDF)

lib/
└── reports/
    ├── types.ts                               # Interfaces e tipos de relatórios
    ├── date-range.ts                          # Normalização de períodos e comparativos
    ├── queries.ts                             # Consultas SQL agregadas no Supabase
    ├── formatters.ts                          # Formatadores de moeda, %, datas e badges
    ├── export-csv.ts                          # Gerador de CSV (UTF-8 BOM / Excel BR)
    ├── export-xlsx.ts                         # Gerador de planilha XLSX estruturada
    └── pdf/
        └── executive-report.tsx               # Template de PDF com @react-pdf/renderer

components/
└── admin/
    ├── admin-sidebar.tsx                      # Item 'Relatórios' no menu lateral
    ├── admin-bottom-nav.tsx                   # Link de acesso rápido mobile
    └── reports/
        ├── reports-dashboard.tsx              # Container de abas e estado dos filtros
        ├── report-period-filter.tsx           # Seletor de período rápido e personalizado
        ├── report-kpi-card.tsx                # Card de KPI com variação % e tooltip
        ├── report-chart-card.tsx              # Card container para gráficos
        ├── report-data-status-badge.tsx       # Badge 'Confirmado' / 'Estimado' / 'Indisponível'
        ├── report-export-dialog.tsx           # Modal de confirmação e opções de exportação
        ├── tabs/
        │   ├── overview-tab.tsx               # Aba 1: Visão Geral Executiva
        │   ├── sales-tab.tsx                  # Aba 2: Vendas e Desempenho Comercial
        │   ├── financial-tab.tsx              # Aba 3: Financeiro, Despesas e Margem
        │   ├── inventory-tab.tsx              # Aba 4: Estoque, Idade de Pátio e Alertas
        │   ├── customers-tab.tsx              # Aba 5: Clientes, Leads e Funil
        │   └── accountant-tab.tsx             # Aba 6: Central de Apoio ao Contador
        └── charts/
            ├── revenue-expenses-bar-chart.tsx # Gráfico de barras (Receitas vs Despesas)
            ├── inventory-age-pyramid.tsx      # Gráfico de faixas de idade de estoque
            ├── payment-methods-donut.tsx      # Distribuição de formas de pagamento
            └── ranking-horizontal-bars.tsx    # Barras horizontais de ranking
```

---

## 5. Complexity Tracking

Nenhuma violação constitucional detectada. Todas as soluções propostas utilizam as bibliotecas já consolidadas no projeto (`@react-pdf/renderer`, Tailwind CSS nativo, Supabase SSR e Next.js App Router).
