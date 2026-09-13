# Matriz de Ambientes: Mercado Pago Checkout Pro

**Projeto**: AF Motos
**Atualização**: 2026-09-13
**Status**: Produção Ativa e Homologada


---

## 1. Variáveis de Ambiente Exatas por Estágio

### Produção (Vercel Production)
Configurar estritamente no painel da Vercel para o ambiente **Production**:

```env
NEXT_PUBLIC_APP_URL=https://afmotos.vercel.app
MERCADO_PAGO_APP_URL=https://afmotos.vercel.app
MERCADO_PAGO_WEBHOOK_URL=https://afmotos.vercel.app/api/webhooks/mercadopago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=...
MERCADO_PAGO_CHECKOUT_MODE=production
```

> [!IMPORTANT]
> - Em Production, o resolver central `lib/mercadopago/checkout-pro-urls.ts` **falha fechado** (HTTP 503 com `CONFIGURATION_ERROR` e reason code `CHECKOUT_PRO_INVALID_PRODUCTION_APP_URL`) se a URL base for `localhost`, `127.0.0.1` ou protocolo inseguro `http:`.
> - `auto_return: 'approved'` é garantido apenas para URLs HTTPS válidas.
> - Se `MERCADO_PAGO_WEBHOOK_URL` não for explicitada em Production, ela será automaticamente derivada a partir da URL base HTTPS homologada (`https://afmotos.vercel.app/api/webhooks/mercadopago`).

### Ambiente Local de Desenvolvimento (Localhost)
Configurar no `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_WEBHOOK_URL=  # Omitida ou túnel HTTPS público (ex: ngrok/cloudflared)
MERCADO_PAGO_CHECKOUT_MODE=test
```

> [!NOTE]
> - Em ambiente local (`http://localhost:3000`), `auto_return` é omitido pelo builder porque a API do Mercado Pago rejeita estritamente `auto_return: 'approved'` em retornos sem HTTPS.
> - `notification_url` é omitida se não houver túnel HTTPS público, emitindo log seguro de aviso.

### Ambiente Vercel Preview (Staging / PRs)
Configurar no painel da Vercel para o escopo **Preview**:

```env
NEXT_PUBLIC_APP_URL=https://afmotos-git-preview.vercel.app # ou derivado de VERCEL_URL
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_CHECKOUT_MODE=test
```

> [!WARNING]
> - Credenciais de produção (`APP_USR-...`) são **estritamente bloqueadas** em ambientes Preview para evitar transações reais em domínios efêmeros.

---

## 2. Resolução Centralizada de URLs (`checkout-pro-urls.ts`)

A ordem de precedência para resolução da URL base da aplicação no Checkout Pro é:
1. `MERCADO_PAGO_APP_URL`
2. `NEXT_PUBLIC_APP_URL`
3. `APP_URL`
4. `VERCEL_PROJECT_PRODUCTION_URL` (resolvido como `https://${VERCEL_PROJECT_PRODUCTION_URL}` em Production)
5. `VERCEL_URL` (resolvido como `https://${VERCEL_URL}` em Preview)
6. Fallback `http://localhost:3000` (**estritamente restrito a Development local**)

---

## 3. Formato das URLs de Retorno e Notificação

### Back URLs (Navegador do Cliente)
- **Sucesso**: `https://afmotos.vercel.app/cliente/pagamento/retorno/[transactionId]?result=success`
- **Pendente**: `https://afmotos.vercel.app/cliente/pagamento/retorno/[transactionId]?result=pending`
- **Falha**: `https://afmotos.vercel.app/cliente/pagamento/retorno/[transactionId]?result=failure`

### Notification URL (Webhook Server-to-Server)
- **Endpoint**: `https://afmotos.vercel.app/api/webhooks/mercadopago`

---

## 4. Variáveis e Chaves Descontinuadas (Não Utilizadas)

As seguintes variáveis configuradas no passado para a integração do Checkout Bricks estão inativas e não devem ser consumidas pelo código do Checkout Pro:

- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_PROVIDER_ADAPTER`
- `ENABLE_DEV_PAYMENT_SIMULATION`
- `ENABLE_MP_DIAGNOSTIC_TESTS`
