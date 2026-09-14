# Implementation Plan: Relatório Financeiro e Operacional de Histórico Veicular para Gestão e Contador

**Feature Directory**: `specs/037-vehicle-history-financial-accountant-reports`  
**Branch**: `feat/vehicle-history-financial-accountant-reports`  
**Date**: 2026-09-14  
**Status**: Ready for Review  

---

## 1. Visão Geral e Arquitetura da Solução

O objetivo desta feature é criar uma **Central Administrativa de Relatórios Financeiros e Operacionais de Histórico Veicular** para a AF Motos, com controle de versão imutável para preços e custos da API Brasil, segregação de receitas do Mercado Pago e pacotes B2B, snapshots de custo por consulta, cards analíticos de margem e faturamento, e emissão do **Informe Anual para o Contador** com exportação em CSV.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 /admin/configuracoes                    │
                  │   Bloco: Precificação e Custo do Histórico Veicular     │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────┐
                    │      vehicle_history_pricing_versions (Postgres)     │
                    │      - public_price_cents                           │
                    │      - apibrasil_live_cost_cents                    │
                    │      - effective_from / effective_to                │
                    └─────────────────────────┬───────────────────────────┘
                                              │
                    ┌─────────────────────────┴───────────────────────────┐
                    │                                                     │
                    ▼                                                     ▼
     ┌──────────────────────────────┐                      ┌──────────────────────────────┐
     │  Consulta Live API Brasil    │                      │      Cache Hit Local         │
     │  - snapshot custo da versão  │                      │  - custo snapshot R$ 0,00    │
     │  - actual_cost_cents         │                      │  - reaproveita laudo prévio  │
     │  - vehicle_lookup_provider_  │                      │  - status: not_applicable    │
     │    costs (idempotente)       │                      └──────────────┬───────────────┘
     └──────────────┬───────────────┘                                     │
                    │                                                     │
                    └─────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │                 admin_vehicle_history_financial_view    │
                  └───────────────────────────┬─────────────────────────────┘
                                              │
                    ┌─────────────────────────┴───────────────────────────┐
                    │                                                     │
                    ▼                                                     ▼
┌───────────────────────────────────────┐             ┌───────────────────────────────────────┐
│       /admin/relatorios?tab=          │             │         Informe Anual Contador        │
│          historico-veicular           │             │      /admin/relatorios/.../anual      │
│  - Cards superiores (Receita, Custo)  │             │  - Resumo de faturamento e estornos   │
│  - Aba 1: Consultas & Custos          │             │  - Tabela mensal estruturada          │
│  - Aba 2: Pagamentos & Estornos       │             │  - Exportação CSV (UTF-8 com BOM)     │
│  - Aba 3: Pacotes B2B & Créditos      │             │  - Disclaimer gerencial obrigatório   │
└───────────────────────────────────────┘             └───────────────────────────────────────┘
```

---

## 2. Fases de Execução e Componentes Envolvidos

### Fase 1: Camada de Dados e Migrations Aditivas
- **Arquivo**: `supabase/migrations/20260914160000_create_vehicle_history_financial_reports.sql`
- **Ações**:
  1. Criação de `vehicle_history_pricing_versions` com índice único para versão ativa.
  2. Criação de `vehicle_lookup_provider_costs` com idempotência e status de tarifação.
  3. Adição de colunas de snapshot em `customer_plate_consultations`.
  4. Criação da view `admin_vehicle_history_financial_view`.
  5. Políticas de RLS exclusivas para administradores (`admin_profiles.auth_user_id = auth.uid()`).
  6. Backfill seguro: sem recalcular dados passados com preços atuais. Seed inicial da versão ativa (Preço: R$ 39,90, Custo: R$ 30,00).

### Fase 2: Configuração e Versionamento de Preço/Custo no Painel
- **Arquivos**:
  - `lib/settings/pricing-service.ts`: Helper server-side `getVehicleHistoryPricingConfig()` e mutação versionada.
  - `lib/actions/settings.ts`: Server action de atualização com confirmação e auditoria.
  - `components/admin/settings/vehicle-history-tab.tsx`: Adição do novo bloco "Precificação e custo do Histórico Veicular" com margem calculada, vigência e histórico de versões.

### Fase 3: Instrumentação do Custo de Provedor e Fila de Entrega
- **Arquivos**:
  - `lib/vehicle-lookup/config.ts`: Substituir valor hardcoded `estimatedCostPerLookup: 30.0` pela leitura da versão de precificação.
  - `lib/vehicle-lookup/service.ts`: Gravação de snapshot do custo vigente no momento da chamada live e registro em `vehicle_lookup_provider_costs`.
  - `lib/vehicle-delivery/delivery-service.ts`: Gravação explícita de custo R$ 0,00 para Cache Hits e tratamento correto de saldo insuficiente (`not_incurred`).

### Fase 4: Central de Relatórios de Histórico Veicular
- **Arquivos**:
  - `lib/reports/vehicle-history-queries.ts`: Queries de agregação de KPIs e listagens paginadas das 3 abas.
  - `components/admin/reports/tabs/vehicle-history-tab.tsx`: Componente com cards de resumo, filtros server-side e navegação entre as 3 visões (Consultas, Pagamentos, Pacotes).
  - `components/admin/reports/reports-dashboard.tsx`: Registro da nova aba `historico-veicular` na barra de navegação da Central de Relatórios.

### Fase 5: Informe Anual para o Contador e Exportações
- **Arquivos**:
  - `lib/reports/annual-accountant-queries.ts`: Agregação por ano e competência mensal (Janeiro a Dezembro).
  - `components/admin/reports/tabs/vehicle-history-annual-tab.tsx`: Tela de visualização anual com seleção de ano, resumo executivo, tabela mensal e disclaimer de apoio gerencial.
  - `app/api/admin/reports/vehicle-history/export-csv/route.ts`: Endpoint de streaming de arquivo CSV sanitizado e formatado para planilhas.

### Fase 6: Testes Automatizados e Homologação
- **Arquivos**:
  - `lib/settings/__tests__/pricing-versioning.test.ts`: Testes unitários do versionamento imutável.
  - `lib/vehicle-lookup/__tests__/cost-snapshot.test.ts`: Testes de gravação de snapshot e exclusão de cache hits.
  - `lib/reports/__tests__/vehicle-history-reports.test.ts`: Testes de cálculo de receita líquida, custos efetivos e segregação de pacotes B2B.

---

## 3. Estratégia de Rollback e Contingência

1. **Rollback de Banco de Dados**: A migration é 100% aditiva (novas tabelas e colunas com defaults). Caso necessário, a view e tabelas novas podem ser revertidas sem afetar o funcionamento das consultas veiculares existentes.
2. **Fallback do Helper de Precificação**: Caso a tabela `vehicle_history_pricing_versions` esteja temporariamente indisponível durante migrações, o helper `getVehicleHistoryPricingConfig()` possui fallback seguro documentado em código.
3. **Imutabilidade de Histórico**: Sob nenhuma circunstância a aplicação executará `UPDATE` destrutivo em registros históricos de consultas já processadas.
