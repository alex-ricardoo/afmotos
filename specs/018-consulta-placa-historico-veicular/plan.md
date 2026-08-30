# Implementation Plan: Consulta de Placa com Snapshot JSONB, Cache Pago e PDF

**Feature**: `018-consulta-placa-historico-veicular`  
**Date**: 2026-08-30  
**Status**: Ready for Execution  

---

## 1. Visão Geral da Arquitetura e Stack

A implementação segue os 12 princípios da **Constituição AF Motos**, priorizando segurança de credenciais, tipagem estrita com TypeScript, desacoplamento por adapters, RLS no Supabase e fidelidade visual institucional com Tailwind CSS e `@react-pdf/renderer`.

```text
[Browser / Admin UI]
   │  
   ├── /admin/consulta-placa (Busca, Cache, Modal de Confirmação, Listagem)
   ├── /admin/consulta-placa/[id] (Visualização Detalhada em 9 Abas)
   └── /api/admin/vehicle-lookup/[id]/pdf (Download do Laudo em PDF)
   │
[Next.js App Router (Server Actions & Route Handlers)]
   │
   ├── lib/vehicle-lookup/
   │     ├── plate.ts (Normalizadores e formatadores)
   │     ├── schema.ts & types.ts (Tipagem e Zod tolerante)
   │     ├── config.ts (Feature flags e variáveis de ambiente)
   │     ├── service.ts (Orquestrador de Cache, Lock e Execução)
   │     ├── adapters/ (Transformação do JSON bruto para DTOs seguros)
   │     ├── sanitizers/ (Mascaramento de CPF, CNPJ, Chassi, Renavam)
   │     ├── fixtures/ (vehicle-total.mock.json)
   │     └── pdf/ (Template institucional @react-pdf/renderer)
   │
[Supabase / PostgreSQL Database]
   │
   └── public.vehicle_plate_consultations (Snapshot raw_response + colunas resumidas + RLS)
```

---

## 2. Estrutura de Arquivos Proposta

```text
app/
├── admin/
│   └── (protected)/
│       └── consulta-placa/
│           ├── page.tsx                               # Página principal (Busca + Listagem)
│           ├── [id]/
│           │   └── page.tsx                           # Página de detalhes com abas temáticas
│           └── loading.tsx                            # Skeleton de carregamento
└── api/
    └── admin/
        └── vehicle-lookup/
            └── [id]/
                └── pdf/
                    └── route.ts                       # Route Handler para geração de PDF server-side

components/
└── admin/
    └── vehicle-lookup/
        ├── plate-search-card.tsx                      # Card de busca de placa com verificação de cache
        ├── consultation-confirm-modal.tsx             # Modal de confirmação explícita de custo
        ├── consultation-history-table.tsx             # Tabela de histórico resumido com filtros
        ├── consultation-badge.tsx                     # Badges de risco, modo (mock/live) e status
        ├── vehicle-detail-header.tsx                  # Cabeçalho da página de detalhes com ações (PDF, Vínculo)
        ├── vehicle-link-modal.tsx                     # Modal para vincular consulta a moto/proposta
        └── tabs/
            ├── tab-summary.tsx                        # Aba 1: Resumo Executivo & Riscos
            ├── tab-vehicle-data.tsx                   # Aba 2: Dados do Veículo & Cadastrais
            ├── tab-debts.tsx                          # Aba 3: Situação & Débitos Estaduais
            ├── tab-restrictions.tsx                   # Aba 4: Restrições & Gravames
            ├── tab-history.tsx                        # Aba 5: Histórico de Donos, Leilão & Sinistro
            ├── tab-fipe-pricing.tsx                   # Aba 6: Preço & Tabela FIPE
            ├── tab-ads-mileage.tsx                    # Aba 7: Anúncios & Quilometragem
            ├── tab-technical-specs.tsx                # Aba 8: Dados Técnicos de Engenharia
            └── tab-raw-json.tsx                       # Aba 9: Visualizador Seguro do JSON Técnico

lib/
├── actions/
│   └── vehicle-lookup.ts                             # Server Actions (buscar cache, executar, vincular)
├── queries/
│   └── vehicle-lookup.ts                             # Queries de listagem e detalhes otimizadas
└── vehicle-lookup/
    ├── types.ts                                       # Tipos TypeScript do domínio e API
    ├── schema.ts                                      # Schemas de validação Zod
    ├── plate.ts                                       # Normalização e validação de placas brasileiras
    ├── config.ts                                      # Configuração de timeout, tokens e feature flags
    ├── service.ts                                     # Orquestrador com lock concorrente
    ├── adapters/
    │   ├── apibrasil-vehicle-total.ts                 # Parser tolerante do payload bruto
    │   ├── vehicle-summary.ts                         # Extrator de colunas escalares
    │   ├── vehicle-risk.ts                            # Classificador da matriz de risco
    │   ├── vehicle-debts.ts                           # Agregador financeiro de débitos
    │   ├── vehicle-history.ts                         # Agregador de histórico e leilões
    │   └── vehicle-pdf.ts                             # DTO para geração de PDF
    ├── sanitizers/
    │   ├── mask-cpf.ts
    │   ├── mask-cnpj.ts
    │   ├── mask-chassis.ts
    │   ├── mask-renavam.ts
    │   └── mask-engine.ts
    ├── fixtures/
    │   └── vehicle-total.mock.json                    # Fixture autêntica para modo mock
    ├── pdf/
    │   └── vehicle-report-pdf.tsx                     # Template @react-pdf/renderer institucional
    └── __tests__/
        ├── plate.test.ts                              # Testes de normalização e validação de placa
        ├── sanitizers.test.ts                         # Testes de mascaramento LGPD
        ├── adapters.test.ts                           # Testes de tolerância a payloads e arrays vazios
        └── cache-and-concurrency.test.ts              # Testes de isolamento mock/live e lock
```

---

## 3. Fases de Implementação

### Fase 1: Domínio Core, Normalizadores e Mascaramento LGPD
- Criar `lib/vehicle-lookup/plate.ts` com funções puras para validar e formatar placas (antiga `ABC-1234` e Mercosul `ABC1D23`).
- Criar `lib/vehicle-lookup/sanitizers/` para mascarar CPF, CNPJ, Chassi, Motor e Renavam.
- Criar testes unitários para a camada core.

### Fase 2: Schemas Zod Tolerantes e Adapters de Payload
- Criar `lib/vehicle-lookup/types.ts` e `schema.ts` com Zod schemas permissivos para absorver variações no retorno da API.
- Criar adapters especializados (`vehicle-summary.ts`, `vehicle-risk.ts`, `vehicle-debts.ts`, etc.) para derivar DTOs sem mutações destrutivas.
- Criar fixture estática completa em `lib/vehicle-lookup/fixtures/vehicle-total.mock.json`.

### Fase 3: Gateway de Execução, Cache e Prevenção de Concorrência
- Implementar `lib/vehicle-lookup/service.ts` com suporte à feature flag `VEHICLE_LOOKUP_MODE=mock|live`.
- Implementar verificação de cache por placa normalizada.
- Implementar controle de concorrência com *Advisory Lock* no banco de dados.
- Tratar status `CHARGE_STATUS_UNKNOWN` em falhas após envio HTTP.

### Fase 4: Banco de Dados, Migração e RLS
- Preparar a migration `20260830100000_create_vehicle_plate_consultations.sql`.
- Configurar índices B-Tree e índice único condicional.
- Configurar políticas RLS para `is_admin()`.

### Fase 5: Server Actions e Queries
- Criar Server Actions em `lib/actions/vehicle-lookup.ts` com validação de sessão e permissões.
- Criar queries de listagem paginada e detalhada em `lib/queries/vehicle-lookup.ts` (garantindo que listagens não carreguem `raw_response`).

### Fase 6: Interface Administrativa (Busca, Cache e Listagem)
- Criar `/admin/consulta-placa/page.tsx` com visual moderno, responsivo e intuitivo.
- Componentizar `plate-search-card.tsx` com feedback instantâneo de cache.
- Componentizar `consultation-confirm-modal.tsx` com checkbox de conferência e custo estimado.
- Componentizar `consultation-history-table.tsx` com filtros e badges de risco.

### Fase 7: Interface de Detalhes em 9 Abas Temáticas
- Criar `/admin/consulta-placa/[id]/page.tsx`.
- Implementar as 9 abas: Resumo, Dados do Veículo, Débitos, Restrições & Gravames, Histórico, Preço FIPE, Anúncios & Km, Dados Técnicos e JSON Técnico.
- Implementar modal de vínculo com motos (`motorcycles`), propostas (`sell_requests`) e leads (`leads`).

### Fase 8: Motor de PDF Institucional
- Desenvolver o template `@react-pdf/renderer` em `lib/vehicle-lookup/pdf/vehicle-report-pdf.tsx` com A4 profissional, sem dados pessoais de terceiros e com disclaimer legal.
- Criar o Route Handler `app/api/admin/vehicle-lookup/[id]/pdf/route.ts` com streaming de buffer.

### Fase 9: Testes Automatizados e Homologação
- Executar suíte de testes com `node:test`.
- Validar proteção contra SQL Injection, XSS e vazamento de tokens.
