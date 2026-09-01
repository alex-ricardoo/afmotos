# Implementation Plan: Compartilhamento Público Seguro de Laudos Veiculares por Link

**Branch**: `023-compartilhamento-publico-laudo-veicular` | **Date**: 2026-09-01 | **Spec**: [`specs/023-compartilhamento-publico-laudo-veicular/spec.md`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/023-compartilhamento-publico-laudo-veicular/spec.md)

**Input**: Feature specification from [`specs/023-compartilhamento-publico-laudo-veicular/spec.md`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/023-compartilhamento-publico-laudo-veicular/spec.md)

---

## Summary

Implementação do sistema de **Compartilhamento Público Seguro de Laudos Veiculares por Link** para a AF Motos. A solução permite que administradores gerem links públicos com tokens criptográficos de 256 bits (`base64url`) diretamente da tela de detalhes de laudos. O banco de dados armazena apenas o hash SHA-256 do token (`token_hash`), garantindo proteção contra vazamento e enumeração. O cliente visualiza uma página responsiva e institucional da AF Motos sem login, pode baixar e imprimir o laudo em PDF gerado sob demanda no servidor a custo zero (reutilizando 100% o snapshot JSONB salvo, sem chamadas à API Brasil), com sanitização estrita de dados pessoais (LGPD), cabeçalhos anti-indexação (`noindex, nofollow, noarchive`) e controle de revogação imediata auditada.

---

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode), Node.js 20+ Runtime  
**Primary Dependencies**: Next.js 15 (App Router, Server Components, Server Actions), React 19, `@react-pdf/renderer` 4.3+, `@supabase/supabase-js`, `lucide-react`, `sonner`, `tailwind-merge`  
**Storage**: PostgreSQL (Supabase) com tabelas `public.vehicle_report_shares` e `public.vehicle_report_share_events`, índices B-Tree e RLS  
**Testing**: Jest / Vitest (testes unitários para token, hashing, sanitização de DTO e services)  
**Target Platform**: Web responsivo (Mobile-first, Desktop) e API REST  
**Project Type**: Web application full-stack com SSR e Server Actions  
**Performance Goals**: Renderização da página pública < 200ms p95; geração de PDF em buffer sob demanda < 350ms; zero chamadas externas adicionais à API Brasil  
**Constraints**: Zero persistência de tokens puros; conformidade com LGPD (mascaramento de CPF/CNPJ/chassi/renavam); `noindex, nofollow` estrito; rate limiting de 15 erros por IP a cada 10 min  
**Scale/Scope**: Suporte a consultas concorrentes com índice único parcial (1 link ativo por consulta no MVP) e auditoria completa de acessos  

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio Constitucional | Conformidade | Justificativa / Mecanismo |
| :--- | :---: | :--- |
| **I. Product First** | PASS | Facilita o envio de laudos veiculares para clientes compradores via WhatsApp/E-mail com 1 clique. |
| **II. Mobile First** | PASS | Página pública 100% responsiva com navegação touch-friendly, placas Mercosul nítidas e botão de download confortável. |
| **III. Type Safety** | PASS | Tipagem TypeScript estrita em todas as entidades (`PublicVehicleReportDto`, `VehicleReportShareRecord`). |
| **IV. Segurança** | PASS | Geração criptográfica de 256 bits (`crypto.randomBytes`), armazenamento exclusivo de `token_hash` (SHA-256), RLS no banco e zero exposição de secrets. |
| **V. Supabase como Fonte de Dados** | PASS | Persistência relacional em PostgreSQL no Supabase com integridade referencial `ON DELETE CASCADE`. |
| **VI. Componentização & Domínio** | PASS | Código estruturado no domínio `lib/vehicle-lookup/` e componentes isolados em `components/public/vehicle-report/` e `components/admin/vehicle-lookup/`. |
| **VII. Integrações Desacopladas** | PASS | Reutilização estrita dos adapters existentes; o compartilhamento opera 100% sobre snapshot JSONB local. |
| **VIII. UX Consistente** | PASS | Design institucional da AF Motos, tema dark/light premium, badges de veredito e placa Mercosul autêntica. |
| **IX. Performance & Privacidade** | PASS | Renderização server-side rápida, exclusão de sitemaps, cabeçalhos `noindex, nofollow, noarchive`, `Cache-Control: private, no-store`. |
| **X. Testabilidade** | PASS | Funções puras de token, hashing e adapter DTO cobertas por testes unitários automatizados. |
| **XI. Observabilidade** | PASS | Rastreamento de eventos de criação, abertura, download de PDF, impressão e revogação. |
| **XII. Evolução Incremental** | PASS | Foco no MVP (1 link ativo por consulta) com schema preparado para expiração futura e múltiplos links. |

---

## Project Structure

### Documentation (this feature)

```text
specs/023-compartilhamento-publico-laudo-veicular/
├── spec.md              # Especificação funcional completa
├── plan.md              # Este plano de implementação
├── research.md          # Decisões arquiteturais e justificativas (Fase 0)
├── data-model.md        # Diagrama ERD, DDL SQL, índices e RLS (Fase 1)
├── quickstart.md        # Guia operacional e roteiro de homologação manual
├── contracts/           # Contratos de interfaces e APIs
│   ├── public-vehicle-report-api.contract.md
│   └── admin-share-actions.contract.md
├── checklists/
│   └── requirements.md  # Checklist de qualidade de requisitos
└── tasks.md             # Divisão de tarefas detalhadas para implementação
```

### Source Code (repository root)

```text
app/
├── (public)/
│   └── historico-veicular/             # Landing page pública institucional
├── laudos/
│   ├── layout.tsx                      # Layout minimalista privado (sem analytics/leakage)
│   └── veicular/
│       └── [shareToken]/
│           ├── page.tsx                # Server Component público do laudo
│           ├── loading.tsx             # Skeleton de carregamento institucional
│           └── not-found.tsx           # 404 neutro ("Laudo indisponível")
├── api/
│   └── public/
│       └── laudos/
│           └── veicular/
│               └── [shareToken]/
│                   └── pdf/
│                       └── route.ts    # Route Handler para download de PDF sob demanda
├── admin/
│   └── (protected)/
│       └── consulta-placa/
│           └── [id]/
│               └── page.tsx            # Detalhe do laudo com card de compartilhamento
lib/
├── actions/
│   └── vehicle-share.ts                # Server Actions administrativas (criar/revogar)
├── queries/
│   └── vehicle-share.ts                # Consultas para obter compartilhamento ativo
├── vehicle-lookup/
│   ├── share-token.ts                  # Geração, hash SHA-256 e validação de tokens
│   ├── share-types.ts                  # Tipos e DTOs de compartilhamento
│   ├── share-service.ts                # Serviço de negócio (buscar por hash, auditar)
│   ├── adapters/
│   │   ├── public-report-dto.ts        # Adapter toPublicVehicleReportDto (sanitização LGPD)
│   │   └── vehicle-pdf.ts              # Adapter de PDF existente
│   └── __tests__/
│       ├── share-token.test.ts         # Testes de criptografia e entropia
│       └── public-report-dto.test.ts   # Testes de sanitização de dados
components/
├── public/
│   └── vehicle-report/
│       ├── public-vehicle-report-view.tsx
│       ├── public-report-header.tsx
│       ├── public-risk-matrix.tsx
│       └── public-plate-badge.tsx
└── admin/
    └── vehicle-lookup/
        ├── vehicle-share-card.tsx       # Card de gestão na tela de detalhe
        ├── vehicle-share-modal.tsx      # Modal de cópia de link
        └── vehicle-revoke-modal.tsx     # Modal de revogação com justificativa
supabase/
└── migrations/
    └── 20260901000000_create_vehicle_report_shares.sql
```

---

## Complexity Tracking

| Decisão Arquitetural | Por que é necessária? | Alternativa mais simples rejeitada por que? |
| :--- | :--- | :--- |
| **Hash SHA-256 do Token no Banco** | Impede vazamento de links em dumps/backups de banco de dados. | Salvar token puro rejeitado por vulnerabilidade de segurança. |
| **Geração de PDF sob Demanda em Buffer** | Custo zero de storage e revogação instantânea em tempo real. | Salvar em bucket privado com signed URL descartado por complexidade de ciclo de vida e URLs órfãs. |
| **Adapter DTO Sanitizado Dedicado** | Garante blindagem LGPD e proteção contra vazamento de custos/saldo. | Reutilizar DTO admin rejeitado por expor JSON bruto e custos da API. |

---

## Plano de Rollback

1. Reverter commits relacionados às rotas `app/laudos/` e `app/api/public/laudos/`.
2. As consultas veiculares em `vehicle_plate_consultations` permanecem 100% operacionais.
3. Se necessário, aplicar rollback de schema: `DROP TABLE IF EXISTS public.vehicle_report_share_events, public.vehicle_report_shares CASCADE;`.
