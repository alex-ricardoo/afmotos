# Implementation Plan: Landing Page Pública — Histórico Veicular

**Branch**: `021-landing-historico-veicular` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-landing-historico-veicular/spec.md`

---

## Summary

Implementação da Landing Page Pública de alta conversão para o serviço de **Histórico Veicular / Consulta Cautelar Digital** da AF Motos na rota `/historico-veicular`. A solução oferece interface mobile-first com elemento visual estilizado de placa Mercosul na Hero, validação client-side imediata, preço dinâmico gerenciado pelo painel administrativo (`site_settings.settings.vehicleHistory`), travas éticas para alegações de menor preço, conversão direta para o WhatsApp oficial da loja, SEO completo com schemas estruturados (`Service`, `Offer`, `FAQPage`, `BreadcrumbList`) e conformidade total com a LGPD (zero chamadas externas e zero persistência de placas no navegador).

---

## Technical Context

**Language/Version**: TypeScript 5.x (Strict mode `strict: true`), Node.js 20+  
**Primary Dependencies**: Next.js 15 (App Router, Server Actions, Server Components), React 19, Tailwind CSS, Lucide React, Zod, Sonner  
**Storage**: Supabase PostgreSQL (Tabela singleton `site_settings` com nó JSONB `settings.vehicleHistory`)  
**Testing**: Vitest / React Testing Library  
**Target Platform**: Web responsiva (Foco Mobile-First, navegadores modernos iOS Safari / Chrome Android / Desktop)  
**Project Type**: Web application pública integrada a painel administrativo  
**Performance Goals**: Core Web Vitals (LCP < 2.0s em redes móveis 4G, CLS < 0.05, FID/INP < 100ms)  
**Constraints**: 
- Zero chamadas públicas a provedores de dados externos (API Brasil)
- R$ 0,00 de consumo de créditos em visitas públicas
- Zero persistência de dados de placas digitadas na landing page (LGPD)
- Proibição de alegação de "Mais barato do mercado" sem comprovação cadastrada no admin  
**Scale/Scope**: ~10 componentes novos, 1 nova rota pública, 1 nova aba administrativa, 4 schemas JSON-LD  

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Princípio I — Product First**: Experiência extremamente direta com apenas a placa necessária para solicitar o relatório.
- [x] **Princípio II — Mobile First**: Interface pensada prioritariamente para smartphones, com área de toque > 44px e placas adaptáveis.
- [x] **Princípio III — Type Safety**: Tipagens estritas (`VehicleHistorySettings`) e validação runtime com Zod.
- [x] **Princípio IV — Segurança**: Nenhuma chave de API ou token exposto no cliente; consultas pagas restritas à área administrativa.
- [x] **Princípio V — Supabase como Fonte de Dados**: Configurações salvas diretamente em `site_settings`.
- [x] **Princípio VI — Componentização & Domínio**: Componentes isolados em `components/vehicle-history/` e `lib/seo/schemas/`.
- [x] **Princípio VII — Integrações Desacopladas**: WhatsApp e validação de placa encapsulados em funções utilitárias puras.
- [x] **Princípio VIII — UX Consistente**: Paleta escura, acentos em dourado/âmbar, alto contraste e estados visuais bem definidos.
- [x] **Princípio IX — Performance & SEO Mandatório em Páginas Públicas**: Metadados completos, Open Graph, Sitemap dinâmico e JSON-LD (`Service`, `Offer`, `FAQPage`, `BreadcrumbList`).
- [x] **Princípio X — Testabilidade**: Funções puras de formatação, validação de placa e geração de links com cobertura de testes unitários.
- [x] **Princípio XI — Observabilidade**: Rastreamento anônimo e agregado de conversão sem coletar PII.
- [x] **Princípio XII — Evolução Incremental (YAGNI)**: Sem checkout ou gateways complexos no MVP.

---

## Project Structure

### Documentation (this feature)

```text
specs/021-landing-historico-veicular/
├── spec.md              # Especificação de requisitos e critérios de aceite
├── plan.md              # Este plano de implementação
├── research.md          # Registro de decisões técnicas e alternativas
├── data-model.md        # Modelagem de dados, Zod schemas e tipagens
├── quickstart.md        # Guia de validação, testes e configuração
├── contracts/           # Contratos de interfaces e payloads
│   ├── site-settings-vehicle-history.contract.md
│   └── whatsapp-payload.contract.md
├── checklists/
│   └── requirements.md  # Checklist de qualidade da especificação
└── tasks.md             # Roadmap de execução dividido em 8 fases
```

### Source Code Layout

```text
app/
├── (public)/
│   └── historico-veicular/
│       ├── page.tsx                           # Server Component da landing page
│       └── loading.tsx                        # Skeleton de carregamento
└── sitemap.ts                                 # Inclusão condicional no Sitemap XML

components/
├── vehicle-history/
│   ├── vehicle-history-hero.tsx               # Hero Section com Placa Mercosul
│   ├── mercosul-plate-input.tsx               # Input estilizado com máscara e feedback
│   ├── vehicle-history-benefits.tsx           # Grid com dados consultados
│   ├── vehicle-history-reasons.tsx            # Razões para consultar antes de comprar
│   ├── vehicle-history-pricing.tsx            # Card de preço dinâmico e oferta
│   ├── vehicle-history-how-it-works.tsx       # 4 passos do fluxo assistido
│   ├── vehicle-history-report-mockup.tsx      # Mockup ilustrativo em HTML/CSS
│   ├── vehicle-history-disclaimer.tsx         # Transparência e limitações
│   ├── vehicle-history-faq.tsx                # Accordion de perguntas frequentes
│   └── vehicle-history-cta-final.tsx          # CTA de encerramento
├── admin/
│   ├── settings-form.tsx                      # Inclusão da aba Histórico Veicular
│   └── settings/
│       └── vehicle-history-tab.tsx            # Formulário de configuração administrativa
└── layout/
    ├── header.tsx                             # Link dinâmico no menu
    └── footer.tsx                             # Link dinâmico no rodapé

lib/
├── seo/
│   └── schemas/
│       └── vehicle-history.ts                 # Schemas Service, Offer, FAQPage, BreadcrumbList
├── settings/
│   └── schema.ts                              # Zod schema com validação ética de preços
├── site-settings.ts                           # Resolver público com defaults
├── utils/
│   └── whatsapp.ts                            # Helper buildVehicleHistoryWhatsAppUrl()
└── vehicle-lookup/
    └── plate.ts                               # Validação e formatação de placas brasileiras

types/
└── site-settings.ts                           # Tipagens VehicleHistorySettings e posicionamento
```

**Structure Decision**: A landing page é construída dentro da rota pública padrão `app/(public)/historico-veicular`, com componentes visuais desacoplados em `components/vehicle-history/` e gerenciamento na aba correspondente de `components/admin/settings/vehicle-history-tab.tsx`.

---

## Complexity Tracking

> **Nenhuma violação constitucional identificada.** A implementação segue rigorosamente os padrões já estabelecidos no repositório.
