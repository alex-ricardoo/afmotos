# Implementation Plan: Hotfix Bloqueio de Cache Mock em Produção

**Branch**: `fix/block-mock-cache-in-production`  
**Feature**: `specs/032-block-mock-cache-in-production`  
**Status**: In Progress  

---

## 1. Visão Geral da Arquitetura

O hotfix atua em quatro camadas críticas para garantir que compras de produção nunca recebam dados simulados:

```
[Cliente / Checkout Pro / Webhook / Reconciliação]
                       │
                       ▼
          [Job de Entrega Persistido]
                       │
                       ▼
          [isCacheEntryEligibleForPaidProduction]
            ├── ELEGÍVEL LIVE  ──> [Reutiliza Cache Live] ──> [Laudo Oficial]
            └── MOCK / INVÁLIDO ──> [Log: cache_rejected]
                                          │
                                          ▼
                               [API Brasil Live Server-Side]
                                 ├── SUCESSO ──> [Persiste Live] ──> [Laudo Oficial]
                                 └── ERRO ─────> [Retry ou Estorno Idempotente]
```

---

## 2. Fases de Execução

### Fase 1: Motor de Elegibilidade de Cache
- Criar `lib/vehicle-delivery/cache-eligibility.ts`:
  - Implementar a função pura `isCacheEntryEligibleForPaidProduction`.
  - Definir tipos e regras de validação para `production`, `preview` e `development`.
  - Rejeitar incondicionalmente qualquer cache com `is_mock === true`, `mode === 'mock'`, `provider === 'mock'` ou fixtures em produção ou compras reais.
- Atualizar `lib/vehicle-lookup/service.ts`:
  - Adicionar suporte a `{ requireLiveOnly?: boolean }` em `findExistingConsultation`.
  - Garantir que `executeVehiclePlateLookup` não recorra a mock quando invocado em contexto de entrega paga de produção.

### Fase 2: Integração com Worker de Entrega & Auditoria
- Atualizar `lib/vehicle-delivery/delivery-service.ts`:
  - Substituir checagem ingênua de cache pelo avaliador de elegibilidade `isCacheEntryEligibleForPaidProduction`.
  - Adicionar log estruturado `vehicle_delivery.cache_rejected` com `reasonCode: 'MOCK_CACHE_IN_PRODUCTION'`, `nextAction: 'CALL_LIVE_PROVIDER'` e IDs mascarados.
  - Inserir evento de auditoria `cache_mock_rejected_in_production` na tabela `consultation_audit_logs`.
  - Se a Vercel Production estiver em modo mock (`config.mode === 'mock'` em `VERCEL_ENV === 'production'`), impedir entrega de mock e falhar com `APIBRASIL_MOCK_MODE_IN_PRODUCTION` iniciando estorno seguro.

### Fase 3: UI e Proteção de Laudo Oficial
- Atualizar `components/customer/customer-vehicle-detail.tsx`:
  - Condicionar selos "Laudo Oficial Emitido" e "Base Senatran" a `dto.is_mock === false && dto.mode === 'live'`.
  - Se `dto.is_mock === true`, renderizar badge "Dados de demonstração (Ambiente de Teste)" e alterar texto do botão para "Baixar Prévia de Demonstração".
- Atualizar `app/api/cliente/consultas/[id]/pdf/route.ts`:
  - Bloquear geração de "Laudo Oficial" em produção se `is_mock === true`.

### Fase 4: Rotina de Recuperação da Consulta Afetada
- Criar `scripts/reprocess-mocked-paid-consultation.ts`:
  - Script idempotente que recebe o ID da consulta ou transação (`edaf3e59-fb2e-48ee-aa0d-c652bfedd886`).
  - Valida o pagamento aprovado no Mercado Pago (`177868720379`).
  - Confirma que o laudo atual veio do mock `4b6f3e33-ce83-43a6-b146-fc27b9b3d129`.
  - Desassocia o mock da consulta paga (`vehicle_data = null`, `source_consultation_id = null`, `status = 'processing'`).
  - Reexecuta o job de entrega com chamada live à API Brasil.
  - Registra auditoria completa.

### Fase 5: Testes Unitários e Validação Rigorosa
- Criar `lib/vehicle-delivery/__tests__/mock-cache-blocking.test.ts`:
  - Testes unitários para todos os cenários da matriz de elegibilidade de cache.
  - Testes de integração simulando rejeição de cache mock e transição para chamada live.
  - Teste garantindo que selo oficial não aparece para mock.
  - Teste de sanitização de tokens e logs.
- Executar:
  - `npm test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
