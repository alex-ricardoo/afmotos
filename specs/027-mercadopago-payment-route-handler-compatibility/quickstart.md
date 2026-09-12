# Quickstart: Reimplementação do Pagamento Mercado Pago (Moura’s Pizzas Pattern)

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  

---

## 1. Configuração do Ambiente

Certifique-se de que o arquivo `.env.local` contém as variáveis mínimas necessárias para a integração do Mercado Pago:

```env
# Credenciais oficiais de teste do Mercado Pago
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-...
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_WEBHOOK_SECRET=...

# Configuração do Adapter (v2 = Padrão Moura's Pizzas, v3 = Padrão Atual)
MERCADO_PAGO_PROVIDER_ADAPTER=v2

# URL de Webhook pública ou fallback
MERCADO_PAGO_WEBHOOK_URL=https://afmotos.vercel.app/api/webhooks/mercadopago
NEXT_PUBLIC_APP_URL=https://afmotos.vercel.app

# Diagnóstico local desabilitado por padrão
ENABLE_MP_DIAGNOSTIC_TESTS=false
```

---

## 2. Inicialização Local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Verifique a saúde do serviço Mercado Pago:
   ```bash
   curl http://localhost:3000/api/internal/mercadopago/health
   ```
   (A rota exige sessão de admin ou cabeçalho `x-internal-ops-token`).

---

## 3. Fluxo de Teste Manual Controlado

1. Abra o navegador em uma **janela anônima**.
2. Abra o **DevTools (Console e Network)**.
3. Faça login com um usuário de teste e inicie uma consulta de placa na Área do Cliente (`/cliente/consultas/nova`).
4. Acesse a tela de pagamento `/cliente/pagamento/[consultationId]`.
5. **Verificação do Console**:
   - Confirme que **nenhum** dos seguintes avisos aparece:
     - `Bricks Customize Texts: property 'fontFamily' is not valid.`
     - `[BRICKS] [Payment Brick] parameters preferenceId and mercadoPago must be provided together.`
     - `Bricks Payment: entityType only receives the value individual or association.`
6. Preencha os dados do formulário com o cartão de teste oficial do Mercado Pago:
   - **Número**: `5480 8328 0103 3311` (Mastercard)
   - **Nome do Titular**: `APRO`
   - **Validade**: `11/30`
   - **CVV**: `123`
   - **CPF**: `12345678909`
   - **Parcelas**: `1x`
7. Clique em **Pagar Consulta**.
8. **Validação da Resposta**:
   - Inspecione a requisição no Network tab: `POST /api/mp/process-payment`.
   - Status HTTP retornado: `200 OK`.
   - O usuário deve ser redirecionado para o laudo veicular liberado.
