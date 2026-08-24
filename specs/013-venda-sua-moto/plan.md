# Implementation Plan: Página "Venda sua Moto para a AF Motos"

**Branch**: `013-venda-sua-moto` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-venda-sua-moto/spec.md`

## Summary

Implementar a página pública dedicada `/venda-sua-moto` para compra direta de motocicletas pela AF Motos. A solução inclui identidade visual própria com Hero e Stepper em 5 etapas, integração com a API da Tabela FIPE (`fipeX`), simulador de proposta percentual interativo (70% a 100%), formulário seguro de dados e fotos, recálculo matemático no servidor com persistência em `public.sell_requests` (com novas colunas tipadas `offer_percentage` e `estimated_offer`), `public.sell_request_images` e `public.leads`, e visualização enriquecida no painel `/admin/propostas`.

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode), Node.js 20+  
**Primary Dependencies**: Next.js 16 (App Router, Server Components, Server Actions), React 19, Tailwind CSS v4, Lucide React, Zod, React Hook Form, Sonner, Date-fns  
**Storage**: Supabase PostgreSQL (`public.sell_requests`, `public.sell_request_images`, `public.leads`), ImgBB / Supabase Storage  
**Testing**: Manual E2E Validation scenarios (`quickstart.md`), TypeScript Compiler (`tsc --noEmit`), ESLint  
**Target Platform**: Web (Mobile First responsivo para 320px–1440px)  
**Project Type**: Next.js Web Application (Público + Área Administrativa)  
**Performance Goals**: Carregamento da página com LCP < 1.5s, cálculo do simulador instantâneo (< 16ms), submissão assíncrona < 3s  
**Constraints**: RLS ativo com inserção anônima estrita e leitura restrita a admins, proteção contra duplo clique, recálculo obrigatório no servidor  
**Scale/Scope**: 1 rota pública (`/venda-sua-moto`), 1 suíte de componentes do formulário wizard (`components/forms/venda-moto-form/`), 1 Server Action atualizada, 1 migração SQL idempotente

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Product First**: Foco na simplicidade e conversão direta para proprietários venderem suas motos para a loja.
- [x] **II. Mobile First**: Layout em etapas compacto, botões fixos ao alcance do polegar e sem overflow.
- [x] **III. Type Safety**: TypeScript estrito com tipagem completa em Zod, Server Actions e ViewModels.
- [x] **IV. Segurança**: Validação server-side, recálculo no servidor, RLS preservado e sem exposição de segredos.
- [x] **V. Supabase como Fonte de Dados**: Persistência padrão em `sell_requests`, `sell_request_images` e `leads`.
- [x] **VI. Componentização & Organização por Domínio**: Componentes modulares e reutilizáveis organizados em `components/forms/venda-moto-form/`.
- [x] **VII. Integrações Desacopladas**: Utilização da camada `fipeX` e orquestrador de upload `uploadImage`.
- [x] **VIII. UX Consistente**: Design System Dark Luxury com tipografia, espaçamentos e micro-interações padronizadas.
- [x] **IX. Performance & SEO**: Metadata completa, imagens otimizadas e carregamento dinâmico.
- [x] **X. Testabilidade**: Regras de simulação isoladas e testáveis no cliente e no servidor.
- [x] **XI. Observabilidade**: Rastreamento de submissão e conversão no CRM.
- [x] **XII. Evolução Incremental**: Respeita a base existente sem duplicar tabelas nem criar complexidades desnecessárias.

## Project Structure

### Documentation (this feature)

```text
specs/013-venda-sua-moto/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (/speckit-plan output)
├── research.md          # Research findings & architectural decisions
├── data-model.md        # Data model, schemas & entity relationships
├── quickstart.md        # Step-by-step validation guide
├── contracts/           # Server actions and UI component contracts
│   ├── server-actions.md
│   └── ui-contracts.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
app/
├── (public)/
│   ├── page.tsx                               # Atualizar link do card "Venda sua Moto pra Nós"
│   └── venda-sua-moto/
│       └── page.tsx                           # Nova página pública com Hero, Wizard e Trust Bar
components/
├── forms/
│   └── venda-moto-form/
│       ├── index.tsx                          # Container do formulário Wizard com React Hook Form
│       ├── steps/
│       │   ├── step-1-motorcycle-data.tsx     # Dados da moto (Marca, Modelo, Ano, Km, Cor)
│       │   ├── step-2-fipe-simulator.tsx      # Consulta FIPE e Simulador de Proposta (70-100%)
│       │   ├── step-3-owner-contact.tsx       # Dados do proprietário (Nome, WhatsApp, Cidade PE)
│       │   ├── step-4-photos-upload.tsx       # Upload de até 5 fotos reais com drag & drop
│       │   └── step-5-review-submit.tsx       # Resumo completo, consentimento e envio
│       ├── venda-moto-stepper.tsx             # Indicador de progresso responsivo
│       ├── venda-moto-summary-card.tsx        # Resumo lateral dinâmico para Desktop
│       └── venda-moto-success-view.tsx        # Tela de confirmação pós-submissão
├── admin/
│   └── proposal-detail-drawer.tsx             # Enriquecer exibição do simulador FIPE e badge
lib/
├── actions/
│   └── leads.ts                               # createSellRequestAction com recálculo e novas colunas
├── validations/
│   └── sell-request.ts                        # Schemas Zod atualizados
supabase/
└── migrations/
    └── 20260823000000_add_offer_simulation_to_sell_requests.sql # Migration idempotente
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A (Zero violations) | Todas as decisões seguem os padrões estabelecidos no repositório. | Não há desvios arquiteturais. |
