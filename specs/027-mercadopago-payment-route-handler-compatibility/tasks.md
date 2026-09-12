# Tasks: Reimplementação do Pagamento Mercado Pago no padrão Moura’s Pizzas

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**Status**: Completed  

---

## Task Group 1: Dependências e Aliasing do SDK Node v2

- [x] **TSK-101**: Adicionar alias `mercadopago-v2: "npm:mercadopago@2.12.0"` ao `package.json` mantendo `mercadopago: "^3.6.1"`.
- [x] **TSK-102**: Executar `npm install` e validar resolução limpa das dependências sem conflito.
- [x] **TSK-103**: Executar `npm run typecheck` para assegurar que nenhum tipo foi quebrado pela introdução do alias.

---

## Task Group 2: Arquitetura de Adaptadores (`MercadoPagoPaymentProvider`)

- [x] **TSK-201**: Criar `lib/mercadopago/payment-provider.ts` definindo a interface `MercadoPagoPaymentProvider`, tipos de entrada `CreateCardPaymentInput` e saída `CreateCardPaymentResult`.
- [x] **TSK-202**: Implementar `lib/mercadopago/payment-provider-v2.ts` utilizando `mercadopago-v2` (`MercadoPagoConfig` e `Payment`), reproduzindo exatamente o contrato do Moura’s Pizzas.
- [x] **TSK-203**: Implementar `lib/mercadopago/payment-provider-v3.ts` utilizando `mercadopago` (`^3.6.1`), isolando a implementação v3.
- [x] **TSK-204**: Implementar factory function `getPaymentProvider()` que lê `process.env.MERCADO_PAGO_PROVIDER_ADAPTER` com fallback seguro para `v3`.
- [x] **TSK-205**: Atualizar `lib/mercadopago/request-snapshot.ts` para registrar `providerAdapter` (`v2` | `v3`) e garantir `issuer.origin = 'brick'` quando o emissor vier do formulário.

---

## Task Group 3: Route Handler Server-Side (`POST /api/mp/process-payment`)

- [x] **TSK-301**: Criar schema de validação Zod estrito em `lib/mercadopago/schemas.ts` para a requisição de pagamento via Route Handler.
- [x] **TSK-302**: Implementar `lib/mercadopago/payment-processing-service.ts` com a orquestração completa:
  - Verificação de propriedade da consulta e status `pending_payment`.
  - Busca do valor canônico em `site_settings`.
  - Persistência prévia da transação com status `pending` e idempotência UUID.
  - Invocação do `MercadoPagoPaymentProvider` ativo.
  - Atualização do status da transação com sanitização do erro.
  - Liberação da consulta veicular e disparo do enriquecimento veicular apenas se `approved`.
- [x] **TSK-303**: Criar o Route Handler em `app/api/mp/process-payment/route.ts`:
  - Extração e validação do usuário logado via Supabase Auth (`supabase.auth.getUser()`).
  - Chamada ao `payment-processing-service.ts`.
  - Resposta HTTP padronizada sem vazamento de stack traces ou dados sensíveis.

---

## Task Group 4: Alinhamento e Montagem Determinística do Payment Brick

- [x] **TSK-401**: Garantir que `components/customer/payment-brick.tsx` utilize `buildPaymentBrickConfig` de `lib/mercadopago/brick-config.ts`.
- [x] **TSK-402**: Confirmar remoção de `fontFamily`, `preferenceId` e validação estrita de `entityType: 'individual'`.
- [x] **TSK-403**: Alterar o `onSubmit` do Brick para enviar `POST /api/mp/process-payment` via `fetch`.
- [x] **TSK-404**: Implementar bloqueio visual de double-submit e feedback de erro com renovação forçada de token (`mountKey`).

---

## Task Group 5: Webhook, Observabilidade e Health Check

- [x] **TSK-501**: Atualizar `app/api/internal/mercadopago/health/route.ts` para reportar o adapter ativo (`v2` ou `v3`) e versão do pacote.
- [x] **TSK-502**: Verificar que `app/api/webhooks/mercadopago/route.ts` consulta a API oficial e atua de forma estritamente idempotente.
- [x] **TSK-503**: Assegurar que nenhum dado sensível (token, CPF completo, e-mail completo, CVV) seja persistido ou logado.

---

## Task Group 6: Testes, Validação e Qualidade

- [x] **TSK-601**: Escrever testes unitários em `lib/mercadopago/__tests__/payment-provider.test.ts` para testar os adapters v2 e v3 com mocks de SDK.
- [x] **TSK-602**: Escrever testes de integração em `lib/mercadopago/__tests__/process-payment-route.test.ts` cobrindo cenários: aprovado, recusado, erro 500 do provedor e acesso não autorizado.
- [x] **TSK-603**: Executar suíte completa: `npm test`.
- [x] **TSK-604**: Executar `npm run typecheck`.
- [x] **TSK-605**: Executar `npm run lint` e corrigir eventuais avisos.
- [x] **TSK-606**: Executar `npm run build` e validar compilação sem erros.
