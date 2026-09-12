# Auditoria Comparativa: Integração Mercado Pago — AF Motos vs Moura’s Pizzas

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**AF Motos Commit SHA**: `eb080da82c4b92a056de8fe542e58d7620679f08`  
**Moura’s Pizzas Commit SHA**: `15407381c974c4406dd0f54f5cafc3cae675ec6f` (branch `main`)  

---

## 1. Tabela Comparativa dos 24 Pontos do Contrato

| Concern | AF Motos Current | Moura’s Pizzas Reference | Planned AF Motos Target | Evidence / Classification |
|---|---|---|---|---|
| **1. Frontend SDK version** | `https://sdk.mercadopago.com/js/v2` (script vanilla) | `@mercadopago/sdk-react: ^1.0.7` | `https://sdk.mercadopago.com/js/v2` via `buildPaymentBrickConfig` (determinístico) ou `@mercadopago/sdk-react` | **Confirmed by code & package.json** |
| **2. Node SDK version** | `mercadopago: ^3.6.1` | `mercadopago: ^2.12.0` | `mercadopago: ^3.6.1` (Track A) com alias `mercadopago-v2: npm:mercadopago@2.12.0` (Track B) | **Confirmed by package/type** |
| **3. Brick initialization** | `initMercadoPago(key, { locale: 'pt-BR' })` com `amount`, `payer.entityType` | `initMercadoPago(key, { locale: 'pt-BR' })` com `amount`, `preferenceId` pré-criado | Inicialização determinística via `buildPaymentBrickConfig` sem warnings | **Confirmed by code** |
| **4. Preference usage** | Sem preference no fluxo direto de cartão | Criação prévia de `preferenceId` no backend (`POST /checkout/preferences`) | Tokenização direta sem preference, ou preference opcional se comprovado necessário | **Confirmed by code** |
| **5. `mercadoPago` prop usage** | Removido de `paymentMethods` para evitar warning | Presente (`mercadoPago: 'all'`) pois havia `preferenceId` | Omitido no modo transparente de cartão | **Confirmed by code & provider documentation** |
| **6. `entityType` usage** | Normalizado estritamente para `'individual'` | Não especificado explicitamente | Normalizado estritamente para `'individual'` | **Confirmed by code & provider documentation** |
| **7. Text customization** | Tipografia movida para classe CSS contêiner (`font-sans`) | `texts` apenas para títulos de parcelas | Sem `fontFamily` em nenhum nível de configuração | **Confirmed by code & provider documentation** |
| **8. Token generation** | Gerado via Brick no navegador a cada clique | Gerado via Brick no navegador | Token novo a cada submissão, remounting automático após erro | **Confirmed by code** |
| **9. Double submit prevention** | `isSubmittingRef` + `isProcessing` com unmount pós-erro | `isProcessing` com overlay blur de carregamento | `isProcessing` + `isSubmittingRef` com bloqueio no cliente e backend | **Confirmed by code** |
| **10. Browser-to-server transport** | Server Action Next.js (`processBrickPaymentAction`) | `fetch('/api/mp/process-payment', { method: 'POST' })` | `fetch('/api/mp/process-payment', { method: 'POST' })` explícito | **Confirmed by code** |
| **11. Server-side endpoint** | Server Action em `lib/mercadopago/actions.ts` | Route Handler em `app/api/mp/process-payment/route.ts` | Route Handler dedicado em `app/api/mp/process-payment/route.ts` | **Confirmed by code** |
| **12. Auth mechanism** | Supabase Auth server-side (`createClient()`) | Supabase Auth admin / session | Supabase Auth via `supabase.auth.getUser()` no Route Handler | **Confirmed by code** |
| **13. Price source of truth** | Servidor (`getVehicleConsultationPrice()`) | Servidor (cálculo de pedido e taxas) | Servidor exclusivamente (`getVehicleConsultationPrice()`) | **Confirmed by code** |
| **14. Payment client initialization** | `new MercadoPagoConfig({ accessToken })` + `new Payment(client)` | `new MercadoPagoConfig({ accessToken, options: { timeout: 15000 } })` + `new Payment(client)` | `MercadoPagoPaymentProvider` com adapter v2 ou v3 | **Confirmed by code** |
| **15. `Payment.create` call shape** | `{ body, requestOptions: { idempotencyKey } }` | `{ body, requestOptions: { idempotencyKey } }` | `{ body, requestOptions: { idempotencyKey } }` via adapter | **Confirmed by package/type** |
| **16. Idempotency forwarding** | UUID v4 gerado por tentativa no servidor | `brick-${preferenceId}` no servidor | UUID v4 persistido em `payment_transactions.idempotency_key` | **Confirmed by code** |
| **17. `issuer_id` handling** | Validado como inteiro positivo se vindo do Brick, senão omitido | Repassado via spread de `formData` do Brick | Enviado apenas se presente e validado como inteiro positivo | **Confirmed by code** |
| **18. Provider error mapping** | Mapeado para `provider_error` (sem aprovação artificial) | Retorna status 500 com mensagem genérica | Mapeado para `provider_error` ou `pending_reconciliation` | **Confirmed by code** |
| **19. Transaction persistence** | `payment_transactions` criada antes da chamada com status `pending` | `mp_pending_checkouts` validada antes da chamada | `payment_transactions` persistida com auditoria completa | **Confirmed by code** |
| **20. Release condition** | Apenas com `status === 'approved'` e `mp_payment_id` real | Com `status === 'approved'` chama `confirmMPPayment` | Laudo liberado estritamente com `approved` e `mp_payment_id` real | **Confirmed by code** |
| **21. Webhook verification** | HMAC SHA-256 via `x-signature` + busca na API oficial | Validação de evento e chamada a `confirmMPPayment` | HMAC SHA-256 + busca obrigatória via server Access Token | **Confirmed by code** |
| **22. Reconciliation** | Reconciliação com busca ativa da API oficial | Reconciliação via webhook | Reconciliação idempotente compartilhando o mesmo serviço de domínio | **Confirmed by code** |
| **23. Logging/sanitization** | Snapshot sanitizado com hashes truncados | Logs de console com mascaramento básico de cartão | Snapshot sanitizado estrito (sem token, CVV, CPF ou e-mail completo) | **Confirmed by code** |
| **24. SDK/runtime differences** | Next.js 16.3.2, SDK Node 3.6.1, React 19.2.8 | Next.js 16.2.1, SDK Node 2.12.0, React 19.2.4 | Isolamento via Route Handler; compatibilidade com SDK v2 via alias | **Hypothesis requiring controlled local test** |

---

## 2. Diferenças Estruturais Cruciais

### Diferença A: Transporte Browser-to-Server (Server Action vs Route Handler)
- No **AF Motos**, a criação do pagamento utilizava Server Actions do Next.js (`"use server"`). O runtime do App Router para Server Actions empacota argumentos em payloads internos multipart/RSC.
- No **Moura’s Pizzas**, o formulário utilizava uma chamada `fetch()` tradicional direta para `POST /api/mp/process-payment`. A migração para Route Handler elimina qualquer interferência de runtime do Next.js.

### Diferença B: Motor HTTP Interno do SDK Node (`mercadopago 2.12.0` vs `3.6.1`)
- O SDK `mercadopago@2.12.0` utilizava o motor clássico de requisições HTTP do Mercado Pago, com serialização direta de headers e corpo.
- O SDK `mercadopago@3.6.1` reescreveu o cliente HTTP (`RestClient`) em TypeScript, injetando cabeçalhos de telemetria adicionais (`X-Product-Id`, `X-Tracking-Id`). A introdução do adapter v2 permite isolar essa diferença sem downgrade destrutivo.

### Diferença C: Ausência de Vínculo com Buyer Account no Supabase
- **Fato Comprovado**: Em nenhum dos dois repositórios há exigência ou existência de tabela de usuários compradores ("Buyer Accounts") do Mercado Pago no Supabase. O pagamento com cartão de teste funciona com e-mail e CPF informados no checkout.

---

## 3. Resolução dos 3 Warnings de Configuração do Browser

1. **`fontFamily is not valid`**:
   - *Origem*: Propriedade `fontFamily` informada dentro de `customVariables` do Brick.
   - *Resolução*: Removida do objeto do SDK; estilização transferida para classes CSS externas (`font-sans`).
2. **`parameters preferenceId and mercadoPago must be provided together`**:
   - *Origem*: O Brick continha `mercadoPago: 'all'` sem um `preferenceId` pré-criado no Mercado Pago.
   - *Resolução*: `mercadoPago` removido de `paymentMethods` e `preferenceId` purgado do fluxo direto.
3. **`entityType only receives individual or association`**:
   - *Origem*: Falta de definição de `payer.entityType` na inicialização do Brick.
   - *Resolução*: Normalizado estritamente para `'individual'` via `normalizeEntityType` em `lib/mercadopago/brick-config.ts`.
