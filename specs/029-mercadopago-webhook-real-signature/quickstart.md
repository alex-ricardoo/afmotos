# Quickstart & Validation Guide: Webhook Real Mercado Pago e Reconciliação

**Feature**: `029-mercadopago-webhook-real-signature`  
**Date**: 2026-09-13  
**Status**: Ready  

---

## 1. Pré-Requisitos

1. **Variáveis de Ambiente Mínimas** (em `.env.local` para testes locais e Vercel para produção):
   ```env
   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
   MERCADO_PAGO_WEBHOOK_SECRET=<segredo-da-aplicacao>
   NEXT_PUBLIC_APP_URL=https://afmotos.vercel.app
   MERCADO_PAGO_APP_URL=https://afmotos.vercel.app
   MERCADO_PAGO_WEBHOOK_URL=https://afmotos.vercel.app/api/webhooks/mercadopago
   ```
2. **Dependências**: Node.js v20+, npm, `package.json` com `mercadopago@2.12.0`.
3. **Serviço de Banco de Dados**: Supabase conectado com permissões administrativas de serviço (`SUPABASE_SERVICE_ROLE_KEY`).

---

## 2. Cenários de Validação Automatizada

### 2.1. Execução de Testes Automatizados da Suíte
Execute o script de testes para verificar a validação matemática de assinaturas, ordenação de cabeçalhos e tratamento de identificadores:

```bash
npm test
```

**Resultado esperado**:
- Todos os testes unitários e de integração em `lib/mercadopago/__tests__/*.test.ts` passam com 100% de sucesso.
- 0 falhas, 0 exceções de buffers criptográficos.

---

## 3. Cenários de Validação Manual e End-to-End

### Cenário 1: Notificação de Webhook com Assinatura Real Válida
**Objetivo**: Confirmar que o endpoint aceita a assinatura no template oficial `id:{data.id};request-id:{x-request-id};ts:{ts};`.

1. Disparar uma requisição POST para `/api/webhooks/mercadopago`:
   ```bash
   # Exemplo simulando notificação legítima com hash gerado pelo segredo de teste
   curl -X POST "http://localhost:3000/api/webhooks/mercadopago?data.id=177857907601&type=payment" \
     -H "Content-Type: application/json" \
     -H "x-request-id: 7c9e6679-7425-40de-944b-e07fc1f90ae7" \
     -H "x-signature: ts=1704067200,v1=<HMAC_CALCULADO_CORRETO>" \
     -d '{"action":"payment.created","data":{"id":"177857907601"},"type":"payment"}'
   ```
2. **Resultado esperado**:
   - Resposta HTTP 200 `{ "received": true, "status": "processed" }`.
   - Log no terminal: `[CHECKOUT_PRO] {"event":"checkout_pro.webhook_signature_verified",...}`.

---

### Cenário 2: Rejeição Criptográfica de Assinatura Adulterada
**Objetivo**: Garantir que requisições forjadas ou sem segredo continuem bloqueadas.

1. Disparar requisição com hash adulterado:
   ```bash
   curl -X POST "http://localhost:3000/api/webhooks/mercadopago" \
     -H "Content-Type: application/json" \
     -H "x-request-id: 7c9e6679-7425-40de-944b-e07fc1f90ae7" \
     -H "x-signature: ts=1704067200,v1=0000000000000000000000000000000000000000000000000000000000000000" \
     -d '{"action":"payment.created","data":{"id":"177857907601"},"type":"payment"}'
   ```
2. **Resultado esperado**:
   - Resposta HTTP 401 `{ "error": "Assinatura de notificação inválida ou ausente." }`.
   - Log: `[CHECKOUT_PRO] {"event":"checkout_pro.webhook_signature_rejected","reasonCode":"signature_mismatch",...}`.

---

### Cenário 3: Reconciliação Sob Demanda na Tela de Retorno
**Objetivo**: Garantir que o cliente com pagamento aprovado no Mercado Pago desbloqueie seu laudo mesmo se o webhook atrasar.

1. Acessar `/cliente/pagamento/retorno/[transactionId]?result=success` autenticado com o usuário proprietário da transação.
2. A página executa a chamada `POST /api/mp/transactions/[transactionId]/reconcile`.
3. O servidor busca o pagamento no Mercado Pago pela referência externa ou `mp_payment_id`.
4. **Resultado esperado**:
   - A transação é atualizada para `approved`.
   - A consulta é desbloqueada e transita para `completed`.
   - A interface altera o estado para "Pagamento Confirmado com Sucesso!" e exibe o botão "Visualizar Laudo Completo".
