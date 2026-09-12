# Implementation Plan: Reimplementação do Pagamento Mercado Pago no padrão Moura’s Pizzas

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**Status**: Draft  

---

## 1. Visão Geral e Arquitetura

Este plano de implementação estabelece a migração segura da chamada síncrona de criação de pagamento por cartão no AF Motos, substituindo o caminho atual de Server Action direta por uma arquitetura desacoplada baseada em Route Handler HTTP (`POST /api/mp/process-payment`) e adaptadores de provedor (`MercadoPagoPaymentProvider`), replicando o padrão comprovadamente funcional do projeto `alex-ricardoo/mouras-pizzas`.

```text
[Frontend Payment Brick]
       │
       ▼ (Fetch POST JSON com token)
[Route Handler: /api/mp/process-payment]
       │
       ▼ (Autenticação Supabase, Validação Zod, Preço Canônico)
[PaymentProcessingService]
       │
       ├─► Criação da transação local (status: pending)
       │
       ▼ (Chaveamento via MERCADO_PAGO_PROVIDER_ADAPTER)
[MercadoPagoPaymentProvider Interface]
       │
   ┌───┴────────────────────────┐
   ▼                            ▼
[Adapter V2: mercadopago@2.12.0]  [Adapter V3: mercadopago@^3.6.1]
(Padrão Moura's Pizzas)           (Isolado para comparação/rollback)
   │                            │
   └───────────┬────────────────┘
               ▼ (Payment.create())
     [Mercado Pago Gateway]
```

---

## 2. Fases de Execução

### Fase 1: Dependências e Aliasing do SDK Node v2
1. Configurar alias npm em `package.json` para permitir coexistência segura dos dois SDKs sem conflito de namespace:
   ```json
   "dependencies": {
     "mercadopago": "^3.6.1",
     "mercadopago-v2": "npm:mercadopago@2.12.0"
   }
   ```
2. Executar `npm install` e validar compilação TypeScript com `npm run typecheck`.

### Fase 2: Abstração de Provedores e Adaptadores
1. Criar `lib/mercadopago/payment-provider.ts`:
   - Interface `MercadoPagoPaymentProvider`.
   - Fábrica `getPaymentProvider(version?: 'v2' | 'v3')`.
2. Criar `lib/mercadopago/payment-provider-v2.ts`:
   - Import de `mercadopago-v2`.
   - Configuração de `MercadoPagoConfig` e instância `Payment`.
   - Mapeamento exato do payload validado no Moura’s Pizzas.
3. Criar `lib/mercadopago/payment-provider-v3.ts`:
   - Encapsular a lógica atual do SDK 3.6.1 na mesma interface.
4. Atualizar `lib/mercadopago/request-snapshot.ts`:
   - Incluir identificação do adapter ativo (`v2` ou `v3`).
   - Assegurar `issuer.origin = 'brick'` quando fornecido na submissão.

### Fase 3: Route Handler Server-Side (`POST /api/mp/process-payment`)
1. Implementar `app/api/mp/process-payment/route.ts`:
   - Autenticação de sessão do Supabase (`createClient()`).
   - Validação de payload via schema Zod estrito.
   - Verificação de propriedade e status da consulta (`customer_plate_consultations`).
   - Leitura de preço canônico no banco via `getVehicleConsultationPrice()`.
   - Gravação de `payment_transactions` em status `pending`.
   - Delegação para `payment-processing-service.ts`.
   - Atualização do banco de dados com base na resposta do provider.
   - Em caso de `approved`, disparo da consulta API Brasil e finalização.
   - Em caso de erro/500, marcação como `provider_error` sem expor detalhes técnicos ao cliente.

### Fase 4: Alinhamento do Frontend (Payment Brick)
1. Atualizar `components/customer/payment-brick.tsx`:
   - Consumir a fábrica determinística `buildPaymentBrickConfig` de `lib/mercadopago/brick-config.ts`.
   - Garantir 0 warnings de console (`fontFamily`, `preferenceId`, `entityType`).
   - Redirecionar o submit do formulário para chamar `fetch('/api/mp/process-payment', { method: 'POST', body: JSON.stringify(...) })`.
   - Implementar tratamento visual de loading, recusa e erro técnico com reset forçado do token (`mountKey`).

### Fase 5: Webhook e Health Check
1. Manter `app/api/webhooks/mercadopago/route.ts`:
   - Validar HMAC `x-signature`.
   - Consultar pagamento na API oficial e reconciliar idempotentemente.
2. Manter `app/api/internal/mercadopago/health/route.ts`:
   - Expor informações estruturadas de diagnóstico (versão ativa do SDK, adapter selecionado, status do webhook, sem dados sensíveis).

### Fase 6: Testes Automatizados e Homologação
1. Criar testes unitários para o adapter v2, v3 e fábrica de provedores.
2. Criar testes de integração para o Route Handler simulando cenários: aprovado, recusado, erro 500 do provedor, usuário não autorizado e consulta inexistente.
3. Executar `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.

---

## 3. Estratégia de Rollback

1. **Rollback de Adapter em Runtime**:
   - Caso o adapter `v2` apresente comportamento inesperado em homologação, a variável de ambiente `MERCADO_PAGO_PROVIDER_ADAPTER=v3` reverte imediatamente a execução para o adapter v3 sem necessidade de novo deploy.
2. **Preservação de Código**:
   - A Server Action legada em `actions.ts` permanece como fallback durante os testes e pode ser deprecada de forma faseada.
3. **Rollback de Branch**:
   - As alterações estão isoladas na branch `027-mercadopago-payment-route-handler-compatibility` e `fix/mercadopago-payment-brick-500`, sem merge em `master`.

---

## 4. Plano de Verificação

| Etapa | Comando / Ação | Critério de Sucesso |
|---|---|---|
| **Tipagem** | `npm run typecheck` | 0 erros de compilação TypeScript |
| **Linting** | `npx eslint lib/mercadopago/ app/api/mp/ components/customer/` | 0 erros de lint nos arquivos da feature |
| **Testes** | `npm test` | Todos os testes passando sem quebras |
| **Build** | `npm run build` | Build estático e otimizado concluído com sucesso |
| **Console** | Inspecionar DevTools em janela anônima | Zero warnings de `fontFamily`, `preferenceId` e `entityType` |
| **Pagamento Real** | Submissão de cartão de teste `5480 8328 0103 3311` | Status `approved`, `mp_payment_id` real gerado e laudo liberado |
