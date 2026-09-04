# Implementation Plan: Skeleton Loaders em Transições de Página

**Branch**: `024-skeleton-page-transitions` | **Date**: 2026-09-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/024-skeleton-page-transitions/spec.md`

---

## Summary

Implementar uma arquitetura abrangente de **Skeleton Loaders** nas transições de página de todas as rotas públicas de vendas da AF Motos (`/`, `/motos`, `/motos/[slug]`, `/aluguel`, `/venda-sua-moto`, `/historico-veicular`, `/sobre`). A solução refatora o componente primitivo `Skeleton` em CSS puro/Tailwind 4 com suporte a variantes estruturais e efeito shimmer com paleta de luxo (dark theme); cria arquivos declarativos e síncronos `loading.tsx` por rota para resposta imediata (<100ms); elimina deslocamento de layout (CLS < 0.05) com dimensões idênticas aos componentes finais; e garante total acessibilidade e suporte a `prefers-reduced-motion`.

---

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode), Node.js 20+  
**Primary Dependencies**: Next.js 16.3.2 (App Router), React 19.2.8, Tailwind CSS v4 (`@tailwindcss/postcss`), Lucide React, clsx, tailwind-merge  
**Storage**: N/A (Apenas camada de apresentação e transições de rota; reutiliza Supabase existente)  
**Testing**: `npm run typecheck` (`tsc --noEmit`), `npm run lint`, verificação manual com emulação mobile e Network Throttling  
**Target Platform**: Navegadores Web Modernos (Mobile Safari/iOS, Chrome Android, Chrome Desktop, Edge, Firefox)  
**Project Type**: Next.js Full-Stack Web Application (App Router com Server Components & Streaming Suspense)  
**Performance Goals**:
- Percepção de resposta à navegação < 100ms.
- Cumulative Layout Shift (CLS) < 0.05.
- Custo de overhead de bundle JavaScript adicional = 0 kB (implementação baseada em CSS puro).  
**Constraints**:
- Ausência total de chamadas assíncronas bloqueantes dentro dos arquivos `loading.tsx`.
- Compatibilidade estrita com `prefers-reduced-motion: reduce`.
- Cores e tokens alinhados com o tema escuro da marca AF Motos (fundo preto/zinco com reflexos neutros e âmbar sutis).  
**Scale/Scope**: 7 rotas públicas principais de vendas + componentes modulares reutilizáveis em modais e carrosséis.

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked post-design: ALL PASS._

| Princípio Constitucional | Avaliação no Design | Status |
| :--- | :--- | :---: |
| **I. Product First** | Elimina telas em branco e telas estáticas lentas, oferecendo feedback instantâneo e aumentando a conversão de leads. | PASS |
| **II. Mobile First** | Skeletons dimensionados para 100% da largura útil em celulares, com cards verticais e touch-targets confortáveis. | PASS |
| **III. Type Safety** | Tipagem estrita com TypeScript (`SkeletonProps`, `SkeletonVariant`, `ResponsiveMode`) e sem uso de `any`. | PASS |
| **VI. Componentização** | Componente atômico `Skeleton` reutilizável em `components/ui/` e esqueletos compostos específicos por rota. | PASS |
| **VIII. UX Consistente** | Paleta de cores escura neutra e elegante harmonizada com os tokens de design system da AF Motos. | PASS |
| **IX. Performance & SEO** | Sem scripts pesados; eliminação de layout shift (CLS = 0) mantendo pontuação alta no Core Web Vitals. | PASS |
| **X. Testabilidade** | Componente e rotas de carregamento verificáveis via build, typecheck e testes ponta a ponta com DevTools. | PASS |
| **XII. Evolução Incremental** | Componente `Skeleton` base extensível para futuras áreas administrativas e novas páginas do site. | PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/024-skeleton-page-transitions/
├── plan.md              # Este documento de planejamento de implementação
├── research.md          # Decisões técnicas e arquiteturais (Fase 0)
├── data-model.md        # Modelos de dados e esquemas visuais (Fase 1)
├── quickstart.md        # Roteiro prático de validação e testes (Fase 1)
├── contracts/           # Contratos de tipagem de interface (Fase 1)
│   └── skeleton-ui-contract.ts
├── checklists/          # Checklists de qualidade
│   └── requirements.md
└── tasks.md             # Tarefas de implementação (Fase 2 - gerado via /speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── globals.css                                    # [MODIFY] Adicionar animação de shimmer em CSS puro e regras prefers-reduced-motion
├── loading.tsx                                    # [MODIFY] Refatorar para esqueleto síncrono ultra-rápido (sem await getSiteSettings)
└── (public)/
    ├── loading.tsx                                # [NEW] Fallback de carregamento padrão para layout público
    ├── motos/
    │   ├── loading.tsx                            # [NEW] Esqueleto do catálogo: filtros + grid de cards
    │   └── [slug]/
    │       └── loading.tsx                        # [NEW] Esqueleto do detalhe: galeria 16:10 + specs + CTA
    ├── aluguel/
    │   └── loading.tsx                            # [NEW] Esqueleto de locação: hero + planos + frota
    ├── venda-sua-moto/
    │   └── loading.tsx                            # [NEW] Esqueleto de captação/avaliação: formulário de proposta
    ├── consignar-moto/
    │   └── loading.tsx                            # [NEW] Esqueleto de consignação
    ├── historico-veicular/
    │   └── loading.tsx                            # [NEW] Esqueleto de histórico veicular
    └── sobre/
        └── loading.tsx                            # [NEW] Esqueleto institucional

components/
├── ui/
│   └── skeleton.tsx                               # [MODIFY] Componente atômico com variantes (card, image, text, list) e shimmer
└── motorcycles/
    ├── motorcycle-grid.tsx                        # [MODIFY] Evoluir MotorcycleGridSkeleton para usar o novo Skeleton com shimmer
    └── motorcycle-card-skeleton.tsx               # [NEW] Card esqueleto isolado e pixel-perfect com o MotorcycleCard real
```

**Structure Decision**: Adoção do padrão oficial do Next.js App Router utilizando convenção de arquivos `loading.tsx` nos diretórios de rotas correspondentes dentro de `app/(public)/`. Centralização das classes e do componente primitivo em `components/ui/skeleton.tsx` e `app/globals.css`.

---

## Complexity Tracking

> Nenhuma violação aos princípios constitucionais. Não são necessárias dependências externas adicionais nem complexidades de estado global.
