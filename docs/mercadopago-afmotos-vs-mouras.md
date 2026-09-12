# Auditoria Comparativa: Integração Mercado Pago — AF Motos vs Moura’s Pizzas

Este documento apresenta uma análise técnica estrutural e factual comparando a integração do Mercado Pago no projeto **AF Motos** (`alex-ricardoo/afmotos`, branch `fix/mercadopago-payment-brick-500`) com a integração funcional do projeto de referência **Moura’s Pizzas** (`alex-ricardoo/mouras-pizzas`, branch `main`).

---

## 1. Tabela Comparativa dos 13 Pontos do Contrato

| Item | AF Motos (`alex-ricardoo/afmotos`) | Moura’s Pizzas (`alex-ricardoo/mouras-pizzas`) | Status da Evidência |
| :--- | :--- | :--- | :--- |
| **1. Versão SDK Node** | `mercadopago: ^3.6.1` | `mercadopago: ^2.12.0` | **Comprovado** (Breaking changes entre v2 e v3) |
| **2. Criação `MercadoPagoConfig`** | `new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } })` | `new MercadoPagoConfig({ accessToken, options: { timeout: 15000 } })` | **Comprovado** (Mesmo padrão de inicialização) |
| **3. Criação `Payment`** | `new Payment(client)` via singleton `getPaymentClient()` | `new Payment(client)` instanciado no handler da rota | **Comprovado** (Equivalente) |
| **4. Assinatura `payment.create`** | `paymentClient.create({ body, requestOptions })` | `paymentApi.create({ body, requestOptions })` | **Comprovado** (Assinatura v2 e v3 idêntica na superfície) |
| **5. Formato `requestOptions`** | `{ idempotencyKey: string }` | `{ idempotencyKey: \`brick-${preferenceId}\` }` | **Comprovado** (Ambos usam `requestOptions.idempotencyKey`) |
| **6. Idempotência** | Header HTTP `X-Idempotency-Key` gerado via UUID v4 por tentativa | Header HTTP `X-Idempotency-Key` prefixado com `brick-<preferenceId>` | **Comprovado** |
| **7. Body Obrigatório** | `transaction_amount`, `payment_method_id`, `token`, `installments`, `payer.email`, `payer.identification` | `...formData` vindo diretamente do Brick, sem remontagem manual | **Comprovado** |
| **8. Body Opcional** | `description`, `external_reference`, `metadata`, `notification_url`, `issuer_id` (se presente) | `external_reference`, `metadata: { preference_id }` | **Comprovado** (AF Motos enviava mais campos opcionais) |
| **9. Transformação de `issuer_id`** | Extraído, convertido para `Number` estrito se válido, ou omitido | Repassado verbatim como retornado pelo Brick no spread `...formData` | **Comprovado** |
| **10. Token do Brick** | Gerado via SDK JS v2 (`sdk.mercadopago.com/js/v2`) vanilla | Gerado via `@mercadopago/sdk-react: ^1.0.7` | **Comprovado** |
| **11. Configuração do Brick** | Inicializado apenas com `amount` quando sem preference id pré-criado | **SEMPRE inicializado com `preferenceId` pré-criado no Mercado Pago** | **COMPROVADO E CRUCIAL** |
| **12. Runtime Next/Vercel** | Next.js 16.3.2 (Turbopack, Server Actions + Route Handlers) | Next.js 16.2.1 (API Route Handler POST tradicional) | **Comprovado** |
| **13. Headers Implícitos da SDK** | `X-Product-Id`, `X-Tracking-Id`, `User-Agent: Node.js SDK v3.6.1`, `X-Idempotency-Key` | `X-Product-Id`, `X-Tracking-Id`, `User-Agent: Node.js SDK v2.12.0`, `X-Idempotency-Key` | **Comprovado** |

---

## 2. Destaque das Diferenças Cruciais

### Diferença Crítica A: Inicialização do Brick com ou sem Preferência MP Prévia
- **No Moura’s Pizzas:**
  O componente `MPPaymentBrick` **nunca** renderiza o Brick de cartão sem antes criar uma `preference` na API do Mercado Pago via backend (`POST /checkout/preferences`). O ID retornado (`prefResult.id`) é passado diretamente na inicialização do Brick:
  ```typescript
  // Moura's Pizzas: MPPaymentBrick.tsx
  const initialization = {
    amount: Number(amount.toFixed(2)),
    preferenceId: mpPreferenceId, // ID retornado pelo Mercado Pago
    ...(userEmail ? { payer: { email: userEmail } } : {}),
  };
  ```
  Quando o Brick gera o token com base em uma `preferenceId` real do Mercado Pago, a transação fica previamente ancorada na conta vendedora no backend do provedor, garantindo contexto de split, taxas e antifraude idênticos aos esperados pelo checkout transparente.

- **No AF Motos:**
  Se a criação da preferência falhar ou estiver ausente, o Payment Brick era inicializado com `preferenceId: undefined`. O SDK JS v2 gera um token genérico desvinculado de preferência.

### Diferença Crítica B: Remontagem Manual vs Spread do `formData`
- **No Moura’s Pizzas:**
  ```typescript
  // Moura's Pizzas: route.ts
  const mpPaymentBody = {
    ...formData,
    external_reference: preferenceId,
    metadata: { preference_id: preferenceId },
  };
  ```
  O Moura’s Pizzas envia exatamente a estrutura de `payer`, `identification`, `token`, `payment_method_id` e `issuer_id` gerada pelo próprio Brick do SDK React oficial, sem modificar nomes de chaves ou estrutura interna.

- **No AF Motos:**
  O backend reconstruía o `payer` montando um objeto novo com `first_name`, `last_name`, `identification`, e às vezes campos `undefined`. A adição de `cleanPayload` corrigiu as chaves `undefined`, mas a presença condicional de `issuer_id` como número vs ausência precisa ser testada de forma isolada (Variação 2).

### Diferença Crítica C: Versão do SDK Mercado Pago (`2.12.0` vs `3.6.1`)
- O SDK `mercadopago@2.12.0` usava o cliente HTTP interno legado com tratamentos específicos para `POST /v1/payments`.
- O SDK `mercadopago@3.6.1` utiliza um `RestClient` reescrito que injeta headers adicionais de telemetria (`X-Product-Id: bc32b6ntrpp001u8nhkg`, `X-Tracking-Id`).

---

## 3. Conclusão Factual

1. **Hipótese de "usuário Buyer Mercado Pago cadastrado no Supabase":**
   **DESMENTIDA**. Moura’s Pizzas não possuía nenhum cadastro de comprador prévio ou vínculo de usuário MP no Supabase. O pagamento com cartão em sandbox utilizava apenas os dados do formulário do Brick.
2. **Diferença comprovada 1:** Moura’s Pizzas sempre usava `preferenceId` pré-gerado para inicializar o Payment Brick no frontend.
3. **Diferença comprovada 2:** Moura's Pizzas não enviava `description` customizado longo nem `notification_url` para cobranças síncronas de cartão de crédito.
4. **Diferença comprovada 3:** O ciclo de vida do token: no Moura's, cada clique gerava uma tentativa com loading bloqueante impedindo novo submit com o mesmo token já invalidado.
