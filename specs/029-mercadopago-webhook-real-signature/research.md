# Research & Architecture Decisions: Validação de Assinatura Real Mercado Pago e Reconciliação

**Feature**: `029-mercadopago-webhook-real-signature`  
**Date**: 2026-09-13  
**Status**: Completed  

---

## 1. Contexto do Incidente em Produção

Em ambiente de produção (`https://afmotos.vercel.app`):
- A criação de Preferências no Mercado Pago Checkout Pro é concluída com sucesso via API oficial.
- O cliente é redirecionado, conclui o pagamento no ambiente do Mercado Pago e retorna para a URL de retorno com sucesso.
- O Mercado Pago envia a notificação HTTP POST para `https://afmotos.vercel.app/api/webhooks/mercadopago`.
- A rota responde com **HTTP 401 Unauthorized**:
  - `checkout_pro.webhook_received`
  - `checkout_pro.webhook_signature_rejected`
  - `errorMessage: "Assinatura criptográfica não confere."`
- O incidente persiste mesmo após rotação do segredo `MERCADO_PAGO_WEBHOOK_SECRET` na Vercel e novos deploys.
- O simulador de webhooks do painel do Mercado Pago responde **HTTP 200** com `paymentId: 123456`, enquanto eventos de pagamento reais (ex.: `paymentId: 177857907601`) falham sistematicamente.

---

## 2. Análise de Causa Raiz e Hipóteses

### Hipótese 1: Resolução e formato do Identificador de Recurso (`resourceId` / `data.id`)
- **Situação no código atual**:
  ```ts
  const resourceId = String(
    (bodyJson.data as Record<string, unknown>)?.id ||
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      bodyJson.id ||
      '',
  ).trim();
  ```
- **Problema identificado**:
  Em notificações reais de pagamento do Mercado Pago v1/v2:
  1. O corpo JSON contém `id` (ID numérico do evento de notificação, ex: `9876543210`) e `data.id` (ID do recurso, ex: `177857907601`). Se `bodyJson.data` for omitido ou vier formatado de forma aninhada diferente, `bodyJson.id` pode ser capturado indevidamente como fallback prioritário antes da query string!
  2. Em notificações reais, o Mercado Pago frequentemente despacha os parâmetros de query `?data.id=177857907601&type=payment`. Na documentação oficial, o manifesto é construído a partir do `data.id` da URL ou do payload. Se houver discrepância na extração ou formatação, o hash diverge.
  3. Falta normalização explícita e isolada através de uma função pura determinística (`resolveMercadoPagoWebhookResourceId`).

### Hipótese 2: Fragilidade no Parser do Cabeçalho `x-signature`
- **Situação no código atual**:
  ```ts
  const parts = signatureHeader.split(',');
  for (const part of parts) {
    const [key, val] = part.trim().split('=');
    if (key === 'ts') ts = val;
    if (key === 'v1') v1 = val;
  }
  ```
- **Problema identificado**:
  Se o cabeçalho contiver espaços antes ou depois do `=` (ex.: `ts = 1704..., v1 = abc...`), o split gera `key = "ts "` ou `key = "v1 "`, que falham na comparação estrita `key === 'ts'`. Além disso, se houver chaves adicionais desconhecidas ou múltiplos valores separados por vírgula, a extração pode falhar silenciosamente atribuindo `undefined`.

### Hipótese 3: Comparação Criptográfica Inadequada de Buffers
- **Situação no código atual**:
  `timingSafeCompare(computedHash, v1)` em `lib/mercadopago/security.ts`:
  ```ts
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return crypto.timingSafeEqual(bufA, bufB);
  ```
- **Problema identificado**:
  A comparação é feita em strings convertidas para UTF-8 em vez de buffers decodificados em hexadecimal (`Buffer.from(hex, 'hex')`). Não há validação prévia de que `v1` é estritamente hexadecimal nem de que possui o comprimento exato de um hash SHA-256 (64 caracteres hexadecimais / 32 bytes). Se `v1` tiver formato corrompido, a comparação pode falhar de maneira imprevisível.

### Hipótese 4: Divergência de Ambiente nos Logs (`environment: development`)
- **Situação no código atual**:
  `environment: context.environment || process.env.MERCADO_PAGO_CHECKOUT_MODE || 'development'`
- **Problema identificado**:
  Em ambiente Vercel de produção, a variável `MERCADO_PAGO_CHECKOUT_MODE` não é injetada por padrão, fazendo com que o log assuma `development` mesmo em deploys reais. A detecção correta deve verificar primariamente `process.env.VERCEL_ENV === 'production'`.

---

## 3. Decisões Arquiteturais

### Decisão 1: Algoritmo Oficial de Assinatura do Mercado Pago
- **Decisão**: Adotar estritamente o template oficial:
  ```text
  id:{data.id};request-id:{x-request-id};ts:{ts};
  ```
- **Regras**:
  1. Extrair `data.id` através da função `resolveMercadoPagoWebhookResourceId(request, payload)`.
  2. Extrair `x-request-id` do cabeçalho HTTP.
  3. Extrair `ts` e `v1` de `x-signature` com parser regex tolerante a espaços.
  4. Gerar hash HMAC-SHA256: `crypto.createHmac('sha256', secret).update(manifest, 'utf8').digest('hex')`.
  5. Validar que `v1` tem 64 caracteres hexadecimais antes de instanciar o buffer.
  6. Comparar `Buffer.from(computed, 'hex')` e `Buffer.from(v1, 'hex')` com `crypto.timingSafeEqual`.
- **Alternativas consideradas**:
  - *Assinar o payload JSON completo*: Rejeitado, pois não é o protocolo do Mercado Pago.
  - *Desativar validação em produção*: Rejeitado sumariamente, violação grave de segurança.

### Decisão 2: Centralização da Confirmação de Pagamento (Shared Domain Service)
- **Decisão**: Criar/unificar a função transacional de confirmação autoritativa para ser compartilhada estritamente entre o webhook (`/api/webhooks/mercadopago`) e a reconciliação (`/api/mp/transactions/[transactionId]/reconcile`).
- **Regras**:
  1. Busca autoritativa na API do Mercado Pago via `Payment.get({ id })` ou busca por `external_reference`.
  2. Validação estrita de valor (usando centavos/`Math.round(amount * 100)` para evitar imprecisão de ponto flutuante), moeda e `external_reference`.
  3. Transição atômica de status em `payment_transactions` respeitando a máquina de estados (proibido downgrade de `approved` para `pending`).
  4. Execução de `releaseVerifiedPaidConsultation(transactionId)` exatamente uma vez, aproveitando a trava otimista em `customer_plate_consultations.payment_status = 'unpaid'`.
- **Alternativas consideradas**:
  - *Lógicas separadas para webhook e reconciliação*: Rejeitado, criaria risco de inconsistência e comportamento divergente.

### Decisão 3: Fallback de Reconciliação no Retorno do Cliente
- **Decisão**: Implementar a rota `POST /api/mp/transactions/[transactionId]/reconcile` autenticada via sessão do Supabase, restrita ao dono da transação ou administradores.
- **Regras**:
  1. Limitar chamadas com rate-limiting em memória por transação (ex.: 1 requisição a cada 3 segundos).
  2. Se a transação já estiver `approved`, responder com sucesso imediato sem chamada externa.
  3. A página de retorno (`app/cliente/pagamento/retorno/[transactionId]/page.tsx`) aciona o reconcile na montagem caso o status inicial seja pendente, combinando com polling decrescente (backoff: 0s, 3s, 8s, 15s) e botão manual "Verificar Status".
- **Alternativas consideradas**:
  - *Confiar na URL de retorno (`result=success`)*: Rejeitado, abriria brecha para liberação fraudulenta de consultas veiculares.

### Decisão 4: Observabilidade com Sanitização Absoluta
- **Decisão**: Padronizar todos os logs com o prefixo `[CHECKOUT_PRO]` e criar helpers de mascaramento e hash de curta duração (`maskId`, `shortHash`, `getRuntimeEnvironment`, `sanitizeError`).
- **Garantias**:
  - `MERCADO_PAGO_WEBHOOK_SECRET` e `MERCADO_PAGO_ACCESS_TOKEN` nunca são impressos.
  - A assinatura `v1` e o digest esperado nunca são exibidos na totalidade (apenas tamanho e prefixo truncado quando necessário).
  - O manifesto gerado tem apenas seu hash SHA-256 truncado registrado (`manifestHash: shortHash(manifest)`).
  - Dados pessoais do cliente (CPF, e-mail, telefone) e corpo bruto do webhook jamais são serializados.
