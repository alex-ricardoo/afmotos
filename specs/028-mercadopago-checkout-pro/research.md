# Research & Architecture Decisions: Checkout Pro Mercado Pago

**Feature**: `028-mercadopago-checkout-pro`  
**Date**: 2026-09-12  
**Status**: Completed  

---

## 1. Contexto e Motivação da Mudança

A implementação anterior baseada no Mercado Pago Checkout Bricks (Payment Brick) foi completamente descontinuada e revertida após falhas reincidentes de `HTTP 500 internal_error` originadas no endpoint direto `Payment.create()` do provedor. Essas falhas foram reproduzidas com múltiplas variações de chamada (Server Actions, Route Handlers, SDK Node v3.6.1, SDK Node v2.12.0, tokens novos gerados pelo Brick, chave de idempotência e credenciais de teste).

A migração para o **Mercado Pago Checkout Pro** elimina radicalmente esse ponto de falha:
- A interface de pagamento, seleção de método (Pix, Cartão de Crédito/Débito, Boleto, Saldo Mercado Pago), validação de bandeira, cálculo de parcelas e tokenização ocorrem no ambiente seguro e controlado pelo próprio Mercado Pago.
- A aplicação AF Motos não gerencia formulários de cartão, não executa scripts de tokenização no navegador e não invoca `Payment.create()` no fluxo do cliente.
- A AF Motos interage exclusivamente com a API de **Preferências** (`Preference.create`) para iniciar o fluxo e com a API de **Pagamentos** (`Payment.get`) para validar notificações assíncronas do webhook.

---

## 2. Escolha e Versão do SDK Mercado Pago

### Avaliação de Versões

| Opção | Vantagens | Desvantagens | Decisão |
|---|---|---|---|
| **mercadopago@2.12.0** (Node SDK Oficial) | API estável, tipagem TypeScript formal, suporte a `MercadoPagoConfig`, `Preference` e `Payment`. Testado amplamente na comunidade. | Dependência externa de ~15MB. | **Recomendada** para chamadas tipadas no servidor |
| **mercadopago@3.6.1** | Versão recente. | Sofreu instabilidades no ecossistema de tipos e deprecation de sub-módulos em ambientes Next.js App Router / Edge. | Descartada |
| **Native Fetch Wrapper (Zero-dependency HTTP)** | Extremamente rápido, zero dependência extra, controle total sobre timeouts, headers e compatibilidade com Next.js 16 / React 19. | Requer definição manual de interfaces TypeScript para `PreferenceCreateRequest` e `PaymentResponse`. | **Alternativa de contingência válida** |

### Decisão Técnica:
Adotar a versão fixada exata `mercadopago@2.12.0` (sem range `^`) no `package.json`. A inicialização do cliente ocorrerá em módulo isolado (`lib/mercadopago/client.ts`), garantindo singleton e validação de inicialização com `MERCADO_PAGO_ACCESS_TOKEN`.

```ts
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export function getMercadoPagoClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado no servidor.');
  }
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10000 },
  });
}
```

---

## 3. Especificação da Preferência Checkout Pro

A criação de preferência segue o contrato oficial da API v1 do Mercado Pago:

### Endpoint Provedor
`POST https://api.mercadopago.com/checkout/preferences`

### Estrutura do Payload Sanitizado

```json
{
  "items": [
    {
      "id": "vehicle-consultation",
      "title": "Consulta Veicular AF Motos",
      "description": "Consulta de histórico veicular por placa",
      "quantity": 1,
      "unit_price": 39.90,
      "currency_id": "BRL"
    }
  ],
  "payer": {
    "email": "cliente@email.com"
  },
  "external_reference": "uuid-da-transacao-interna",
  "metadata": {
    "transaction_id": "uuid-da-transacao-interna",
    "consultation_id": "uuid-da-consulta",
    "user_id": "uuid-do-usuario",
    "product": "vehicle_consultation"
  },
  "back_urls": {
    "success": "https://afmotos.com.br/cliente/pagamento/retorno/uuid-da-transacao?result=success",
    "pending": "https://afmotos.com.br/cliente/pagamento/retorno/uuid-da-transacao?result=pending",
    "failure": "https://afmotos.com.br/cliente/pagamento/retorno/uuid-da-transacao?result=failure"
  },
  "auto_return": "approved",
  "notification_url": "https://afmotos.com.br/api/webhooks/mercadopago",
  "payment_methods": {
    "installments": 12,
    "excluded_payment_types": [],
    "excluded_payment_methods": []
  }
}
```

### Regras Mandatórias de Higienização:
1. **Nunca aceitar parâmetros monetários ou de roteamento do cliente**: O navegador apenas envia `{ consultationId }`. O backend deriva `unit_price`, `external_reference`, `back_urls`, `notification_url` e `email`.
2. **Campos nulos ou indefinidos**: A biblioteca ou construtor deve omitir chaves vazias para evitar rejeição de schema pelo Mercado Pago.
3. **URL de notificação**: Deve obrigatoriamente ser HTTPS público e não localhost.

---

## 4. Algoritmo de Validação de Assinatura de Webhook (HMAC-SHA256)

O Mercado Pago envia o cabeçalho `x-signature` contendo timestamp (`ts`) e hash HMAC (`v1`), além do cabeçalho `x-request-id`.

### Algoritmo de Verificação Oficial:

1. Extrair os valores `ts` e `v1` do cabeçalho `x-signature`:
   - Formato do cabeçalho: `ts=1704067200,v1=abcdef0123456789...`
2. Extrair o identificador do recurso da query string ou do payload:
   - Notificações de pagamento enviam `data.id` no corpo JSON ou `id` / `data.id` na URL.
3. Montar o manifesto de validação exatamente como padronizado pelo Mercado Pago:
   ```text
   manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
   ```
4. Calcular o HMAC-SHA256 do manifesto usando a chave secreta `MERCADO_PAGO_WEBHOOK_SECRET`:
   ```ts
   import crypto from 'crypto';

   const calculatedSignature = crypto
     .createHmac('sha256', secret)
     .update(manifest)
     .digest('hex');
   ```
5. Comparar `calculatedSignature` com `v1` utilizando `crypto.timingSafeEqual` para prevenir ataques de temporização (Timing Attacks).
6. Se a assinatura for válida: prosseguir com a busca do pagamento na API oficial via `Payment.get({ id: dataId })`. Se for inválida: retornar imediatamente HTTP 401/400 e registrar o evento como `signature_valid = false`.

---

## 5. Máquina de Estados e Mapeamento de Transações

O status de pagamento recebido do Mercado Pago é mapeado para o domínio da AF Motos de acordo com as seguintes regras de transição estrita:

```text
[pending] ───> [in_process] ───> [approved] ───> (unlock report)
   │               │                │
   ├──> [rejected] └──> [rejected]  ├───> [refunded]
   ├──> [cancelled]                 └───> [charged_back]
   └──> [provider_error / pending_reconciliation]
```

### Regras de Transição:
- Um status `approved` é **terminal para autorização**: nunca sofre downgrade para `pending` ou `in_process` caso notificações fora de ordem cheguem com atraso.
- Apenas a transição para `approved` com `mp_payment_id` válido e verificado na API pode acionar a rotina `releaseVerifiedPaidConsultation`.
- O webhook processa o evento de forma idempotente: se a transação já estiver `approved` e o laudo já estiver concluído, o webhook registra o evento e responde HTTP 200 sem disparar nova consulta à API de veículos.

---

## 6. Prevenção de Concorrência e Liberação Atômica do Laudo

Para evitar que requisições paralelas (ex.: clique duplo do cliente no retorno + processamento simultâneo do webhook) disparem duas consultas veiculares na API Brasil:

1. **Lock Otimista/Atômico no Supabase**:
   A atualização de `customer_plate_consultations` utiliza condição:
   ```sql
   UPDATE public.customer_plate_consultations
   SET payment_status = 'paid', status = 'processing', updated_at = NOW()
   WHERE id = $consultation_id
     AND payment_status = 'unpaid'
     AND status = 'pending'
   RETURNING id;
   ```
   Se nenhuma linha for retornada, significa que outro processo (webhook ou worker) já iniciou o processamento, abortando execuções redundantes.
2. **Idempotência de Transações Abertas**:
   Se o usuário clicar novamente em "Pagar com Mercado Pago" para a mesma consulta que já possui uma transação `pending` com preferência gerada nos últimos 15 minutos, a preferência existente é reutilizada, evitando inflar o banco com dezenas de transações órfãs.
