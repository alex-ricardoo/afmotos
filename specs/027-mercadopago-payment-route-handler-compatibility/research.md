# Research: Reimplementação do Pagamento Mercado Pago no padrão Moura’s Pizzas

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**Status**: Complete  

---

## 1. Contexto e Motivação

O projeto AF Motos tem enfrentado sistematicamente a resposta `MPServerError: HTTP 500 internal_error` da API do Mercado Pago durante a execução de `Payment.create()` no backend via Server Action (`lib/mercadopago/actions.ts`), mesmo com token válido de 32 caracteres, sem reutilização, com CPF limpo de 11 dígitos, valor canônico (R$ 49,99) e sem `null` ou `undefined` no payload.

Por outro lado, o projeto de referência `alex-ricardoo/mouras-pizzas` (branch `main`), desenvolvido pelo mesmo autor, processou pagamentos de teste com sucesso usando Payment Brick e cartão de teste sem exigir conta de comprador ("Buyer Account") cadastrada no Supabase.

Esta pesquisa analisa as diferenças técnicas, estruturais e de protocolo entre ambos os sistemas, fornecendo o embasamento para a nova arquitetura baseada em Route Handler e adaptadores de SDK.

---

## 2. Comparativo Estrutural: AF Motos vs Moura’s Pizzas

| Dimensão | AF Motos (Atual) | Moura’s Pizzas (Referência) | Análise & Impacto |
|---|---|---|---|
| **Ponto de Entrada Backend** | Server Action Next.js (`"use server"`) em `actions.ts` | Route Handler HTTP dedicado: `POST /api/mp/process-payment` | Server Actions no Next.js App Router injetam contexto de serialização multipart/form-data ou JSON de RSC, que pode interagir de forma sutil com o runtime de requisições ou headers HTTP. O Route Handler padrão oferece isolamento total e determinismo de requisição HTTP REST pura. |
| **SDK Node Backend** | `mercadopago ^3.6.1` | `mercadopago ^2.12.0` | A versão `3.x` do SDK Node passou por refatoração interna do cliente HTTP (usando fetch ou Axios internamente), mudando como `requestOptions` e headers customizados são tratados. A versão `2.12.0` foi a versão estável validada no Moura’s Pizzas. |
| **SDK React Frontend** | `@mercadopago/sdk-react ^0.0.29` | `@mercadopago/sdk-react ^1.0.7` | No frontend do AF Motos, warnings como `fontFamily`, `preferenceId and mercadoPago must be provided together` e `entityType` poluíam a inicialização do Brick. No Moura’s Pizzas, o Brick foi montado com configurações estritas. |
| **Configuração do Brick** | Passava `customVariables` com `fontFamily`, tentava passar `preferenceId` e `mercadoPago: 'all'` | Apenas `amount`, `payer.email` básico, sem `preferenceId` no fluxo de cartão direto, sem `fontFamily` | Eliminar esses warnings impede que o iframe do Brick gere tokens com metadados inconsistentes para a API do Mercado Pago. |
| **Payer Entity Type** | Ausente na inicialização | Não especificado ou padrão | O mercado brasileiro exige `entityType: 'individual'` para pessoas físicas (CPF). Sua ausência causava warning explícito. |
| **Idempotência** | `requestOptions: { idempotencyKey }` | `requestOptions: { idempotencyKey }` | Ambos usam UUID v4. O formato do objeto é equivalente em ambas as versões, porém o envio de cabeçalhos no v2 e v3 é mapeado de forma diferente no transporte. |
| **Issuer ID** | Passado como número quando presente | Repassado do Brick quando presente | Nenhum dos projetos força issuer hardcoded. Se ausente, não deve ser enviado. |
| **Vínculo com Buyer Supabase** | Não existe | Não existe | **Fato comprovado**: Não é necessário ter cadastro de conta Mercado Pago para o comprador no Supabase. O Brick tokeniza o cartão no navegador e o backend apenas cobra com o e-mail e CPF informados. |

---

## 3. Investigação dos Warnings do Payment Brick

### 3.1 Warning 1: `Bricks Customize Texts: property 'fontFamily' is not valid.`
- **Causa Raiz**: O objeto `customization.visual.texts` ou `customVariables` continha `fontFamily: 'inherit'` ou similar. No SDK v2 do Brick, a customização de fontes aceita apenas variáveis pré-definidas (`baseColor`, `borderRadius`, etc.), rejeitando propriedades de fonte não mapeadas.
- **Solução**: Remover totalmente `fontFamily` de qualquer objeto repassado ao SDK do Mercado Pago. Aplicar tipografia (`font-sans`) exclusivamente na `<div>` contêiner externa no HTML.

### 3.2 Warning 2: `[BRICKS] [Payment Brick] parameters preferenceId and mercadoPago must be provided together.`
- **Causa Raiz**: A configuração incluía o método de pagamento `mercadoPago` (carteira digital/Mercado Pago Wallet) ou repassava uma propriedade `preferenceId` opcional/falsa. Para ativar a carteira Mercado Pago no Brick, a API exige obrigatoriamente um `preferenceId` gerado via Checkout Pro. Como o AF Motos realiza **checkout transparente direto** com cartão de crédito, a presença de `mercadoPago: 'all'` gerava conflito.
- **Solução**: Remover `mercadoPago` dos métodos de pagamento e remover qualquer menção ou repasse de `preferenceId` no fluxo de cartão direto.

### 3.3 Warning 3: `Bricks Payment: entityType only receives the value individual or association.`
- **Causa Raiz**: O SDK do Mercado Pago no Brasil valida o tipo de entidade fiscal do pagador. Quando omitido ou indefinido, o script gera o warning alertando que são aceitos apenas `individual` ou `association`.
- **Solução**: Definir explicitamente `payer.entityType = 'individual'` via função de normalização estrita `normalizeEntityType`.

---

## 4. Análise do Erro HTTP 500 (`MPServerError: internal_error`)

O erro HTTP 500 retornado pelo Mercado Pago não possui `payment_id`, `requestId` ou `causes`. A duração observada da requisição foi de ~8,7 segundos, indicando timeout interno ou falha no processador de autorização/antifraude do Mercado Pago.

### Hipóteses Técnicas:
1. **Incompatibilidade de transporte do SDK v3.6.1**: A versão 3.6.1 do Node SDK pode estar enviando headers (como `User-Agent`, `X-Idempotency-Key` ou `Content-Type`) com encoding ou serialização que causa falha no gateway de cartões do Mercado Pago Sandbox.
2. **Token gerado com contexto defeituoso do Brick**: Os warnings de console indicavam que o Brick estava montado em modo ambíguo (misturando Wallet e Transparente). Tokens gerados nesse estado podem falhar na reconciliação interna do Mercado Pago.
3. **Execução em contexto de Server Action do Next.js**: Dependendo da versão do Next.js e de middlewares, Server Actions podem ter limites ou headers que afetam chamadas HTTP externas de longa duração.
4. **Ausência de parâmetros fiscais mínimos**: A falta de `entityType: 'individual'` no contexto do pagador pode acionar regras de antifraude estritas no gateway.

---

## 5. Decisões Arquiteturais

1. **Adotar Route Handler dedicado (`POST /api/mp/process-payment`)**: Alinha o AF Motos ao modelo do Moura’s Pizzas, eliminando qualquer interferência de runtime de Server Actions.
2. **Implementar Arquitetura de Adaptadores (`v2` e `v3`)**:
   - `MercadoPagoPaymentProvider` como interface única.
   - `payment-provider-v2.ts` implementa o SDK `mercadopago@2.12.0` (usando alias npm `mercadopago-v2: npm:mercadopago@2.12.0`).
   - `payment-provider-v3.ts` preserva a implementação atual do `mercadopago@^3.6.1`.
   - Chaveamento server-side por variável `MERCADO_PAGO_PROVIDER_ADAPTER`.
3. **Isolamento de Segurança e RLS**:
   - Manter todas as mutações no banco restritas ao backend.
   - Jamais expor Access Token ou segredos de webhook.
   - Em caso de 500, manter transação como `provider_error` e não liberar o laudo veicular.
