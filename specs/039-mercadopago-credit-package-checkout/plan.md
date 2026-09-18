# Implementation Plan: Mercado Pago Checkout for Credit Packages

## Technical Context

A aplicação AF Motos opera em uma stack moderna baseada em Next.js App Router, hospedada na Vercel e integrada ao Supabase (PostgreSQL, Auth e Storage) e ao Mercado Pago SDK para processamento de pagamentos.

- **Next.js & React**: `Next.js 16.3.2` (App Router com Server Components, Server Actions e Route Handlers assíncronos) e `React 19.2.8`.
- **SDK Mercado Pago**: `mercadopago@2.12.0` utilizando o padrão oficial de inicialização com `MercadoPagoConfig({ accessToken, options: { timeout: 10000 } })`, `Preference` e `Payment` clients (`lib/mercadopago/client.ts`).
- **Padrão de Route Handlers**: Rotas de API no App Router (`app/api/**/route.ts`) com exportações explícitas de verbos HTTP (`GET`, `POST`, `PUT`, `PATCH`), parsing de corpo seguro, validação de schema em tempo de execução via `zod@^4.4.3` e retorno de `NextResponse.json`.
- **Supabase Client Architecture**:
  - `createClient()` (`lib/supabase/server.ts`): Cliente contextualizado à sessão do usuário com cookies para validação de `auth.getUser()` e aplicação de Row Level Security (RLS).
  - `createAdminClient()` (`lib/supabase/admin.ts`): Cliente privilegiado com `SUPABASE_SERVICE_ROLE_KEY` para tarefas críticas do servidor (webhooks, workers e RPCs).
- **Tratamento de Modos de Ambiente no Código Existente**:
  - `VERCEL_ENV`: Identifica o ambiente de hospedagem (`production`, `preview`, `development`). Utilizado em `lib/mercadopago/observability.ts` e `lib/mercadopago/checkout-pro-urls.ts` para aplicar regras de fail-closed (proibindo `localhost` ou `http://` em production/preview).
  - `MERCADO_PAGO_CHECKOUT_MODE` & Credenciais: Avaliado via `getCredentialMode()` (`lib/mercadopago/client.ts`). Tokens com prefixo `TEST-` ativam modo sandbox/test; prefixos `APP_USR-` ou variável `MERCADO_PAGO_CHECKOUT_MODE=production` forçam modo de produção.
  - `VEHICLE_LOOKUP_MODE`: Controla a integração com o provedor de placas API Brasil (`mock` ou `live`) via `lib/vehicle-lookup/config.ts`.
- **Infraestrutura de Créditos Existente**:
  - Implementada na spec 036 (`lib/credits/credit-service.ts`), possui tabelas `customer_credit_packages`, `customer_credit_balances`, `customer_credit_reservations` e `customer_credit_ledger`.
  - Concessões manuais prévias utilizam a RPC atômica `grant_credit_package`.
- **Observabilidade**: Sistema centralizado em `lib/mercadopago/observability.ts` com sanitização estrita de dados sensíveis (sem tokens, CPF, segredos HMAC ou números de cartão).

---

## Current-State Findings

A inspeção detalhada do repositório revelou os seguintes fatos arquiteturais:

1. **Criação de Preference de Checkout Pro Existente**:
   - Localizada em `app/api/mp/checkout-pro/preferences/route.ts`.
   - Constrói o corpo da preferência através de `buildPreferenceBody()` (`lib/mercadopago/preference-builder.ts`), validando a consulta de placa do usuário, preço canônico via `getVehicleConsultationPrice()` e resolvendo URLs via `resolveCheckoutProUrls()`.
2. **Campos Enviados ao Mercado Pago**:
   - `items`: array contendo `id`, `title`, `quantity` (fixo 1), `unit_price`, `currency_id: 'BRL'`.
   - `payer`: `{ email }`.
   - `external_reference`: atualmente preenchido com o `transactionId` interno.
   - `metadata`: `{ transaction_id, consultation_id, user_id, product }`.
   - `back_urls`: `{ success, pending, failure }` apontando para `/cliente/pagamento/retorno/[transactionId]`.
   - `notification_url`: URL do webhook público da aplicação.
3. **Validação Criptográfica de Webhook**:
   - Em `app/api/webhooks/mercadopago/route.ts`, o cabeçalho `x-signature` é inspecionado com extração de `ts` e `v1`. O manifesto é construído e validado com HMAC SHA-256 (`validateWebhookSignature` em `lib/mercadopago/webhook-service.ts`).
   - Eventos recebidos são deduplicados na tabela `public.webhook_events`.
4. **Reconciliação e Consulta Autoritativa**:
   - O webhook nunca confia no payload recebido; ele executa `fetchAuthoritativePayment(resourceId)` buscando o registro oficial em `GET /v1/payments/{id}` do Mercado Pago.
5. **Estrutura de `payment_transactions`**:
   - Definida na migration `20260912110000_mercadopago_transactions_and_audit.sql`.
   - Atualmente possui coluna `consultation_id UUID NOT NULL REFERENCES public.customer_plate_consultations(id)`.
   - Não possui distinção explícita entre pagamento de consulta individual e compra de pacote de créditos.
6. **Política de Estorno (Refund) Existente**:
   - Implementada em `lib/mercadopago/refund-service.ts` e `specs/033-admin-payment-refund-center/`.
   - Trata estornos na API do Mercado Pago e cancela entrega de laudos via `consultation_delivery_jobs`.
7. **Concessão de Créditos Manuais B2B**:
   - Localizada em `lib/credits/credit-service.ts` (`grantCreditsToUser`), executa a RPC `grant_credit_package`.
   - Salva em `customer_credit_packages` com `payment_channel` ('whatsapp', 'pix_manual', etc.) e lança entrada no ledger `customer_credit_ledger`.
8. **Visualização de Pacotes na Interface Atual**:
   - Em `app/cliente/creditos/page.tsx` e `components/customer/customer-credits-view.tsx`.
   - Os cards de pacotes (Inicial 5, Lojista 15, Frotista 30, Customizado 50+) estão **completamente hardcoded** dentro do componente React, calculando descontos sobre variáveis locais (`starterUnit`, `proUnit`, etc.) e gerando links diretos de WhatsApp (`https://wa.me/...`).
   - Não existe consulta a uma tabela de ofertas comerciais vendáveis no banco de dados.
9. **Autorização Administrativa**:
   - Implementada em `lib/admin/admin-auth.ts` (`checkAdminProfileAccess`).
   - Valida estritamente `admin_profiles.auth_user_id = auth.uid()`, `is_active = true` e `role IN ('admin', 'super_admin')`.
10. **Relatórios Financeiros e Contábeis Existentes**:
    - Definidos na migration `20260914160000_create_vehicle_history_financial_reports.sql` (`admin_vehicle_history_financial_view`).
    - Distinguem consultas pagas por cartão via `payment_transactions` daquelas atendidas por créditos pré-pagos via `customer_credit_packages` (`package_unit_price_cents`, `package_total_paid_cents`).

**O que pode ser reutilizado**:
- SDK Mercado Pago (`lib/mercadopago/client.ts`).
- Validação HMAC e serviço de busca autoritativa de pagamentos (`lib/mercadopago/webhook-service.ts`).
- Tabela `payment_transactions` e auditoria `webhook_events`.
- Livro razão (`customer_credit_ledger`) e balanço agregado (`customer_credit_balances`).
- Verificação de perfis administrativos (`lib/admin/admin-auth.ts`).

**O que exige nova estrutura**:
- Tabela de catálogo comercial de ofertas vendáveis (`credit_package_offers`).
- Tabela de pedidos financeiros de pacotes (`credit_package_orders`).
- Flexibilização de `payment_transactions` (`consultation_id` opcional, adição de `purpose` e `credit_package_order_id`).
- RPC atômica idempotente de concessão de pacote originado de pedido aprovado (`grant_credit_package_from_paid_order`).
- Endpoints de checkout e status para pacotes.
- Componente de vitrine de pacotes dinâmico conectado ao banco e tela de retorno de compra.

---

## Business Scope and Rules

### Escopo de Pacotes Comerciais

1. **Pacotes Comerciais Padrão (Pré-configurados e Vendáveis)**:
   - Quantidade fixa de créditos (ex: 5, 15, 30 consultas).
   - Preço final fixado pelo administrador (armazenado em centavos no banco).
   - Compra direta pelo cliente autenticado via Mercado Pago Checkout Pro.
   - Créditos liberados de forma 100% automatizada e imediata após notificação de `payment.status = approved`.
   - Pode possuir prazo de validade configurado (em dias) ou não expirar (`validity_days IS NULL`).
2. **Pacote Personalizado (Volume Customizado / Frotas)**:
   - Quantidade referencial de 50+ consultas ou volume negociado sob demanda.
   - Preço e condições comerciais variáveis.
   - **NÃO possui checkout automático**. O botão de compra é desabilitado em favor de CTA para WhatsApp (`https://wa.me/...`).
   - Após negociação externa, a concessão é efetuada manualmente pelo administrador no painel administrativo existente (`source = 'manual_admin'`).

### Regra de Ouro de Precificação

- O administrador cadastra no painel administrativo:
  - Quantidade de créditos (`credits_quantity > 0`).
  - Preço final do pacote (`price_cents > 0`).
  - Preço individual de referência (`reference_individual_price_cents`).
  - Canal de venda (`online_checkout` vs `whatsapp_only`).
- O sistema calcula e exibe:
  - Preço unitário por consulta (`unit_price_cents = Math.round(price_cents / credits_quantity)`).
  - Economia total em relação ao preço avulso de referência.
  - Percentual de desconto comparativo (`discount_percent`).
- **A fonte da verdade para cobrança e checkout é estritamente o `price_cents` salvo no banco pelo administrador.**

---

## Constitution Check

Conformidade com a Constituição da AF Motos e boas práticas arquiteturais:

- [x] **Princípio I (Product First)**: Compra de créditos sem fricção em poucos cliques com liberação imediata 24/7.
- [x] **Princípio II (Mobile First)**: Telas de pacotes, modal de compra e página de retorno responsivas, otimizadas para navegadores móveis.
- [x] **Princípio III (Type Safety)**: TypeScript strict, schemas Zod em todas as fronteiras de API e validação forte de integridade.
- [x] **Princípio IV (Segurança)**: O frontend NUNCA envia preço, créditos ou descontos. `MERCADO_PAGO_ACCESS_TOKEN` restrito ao servidor. RLS ativo em todas as tabelas.
- [x] **Princípio V (Supabase como Fonte de Dados)**: Persistência em PostgreSQL no Supabase com transações atômicas e RPCs com `SECURITY DEFINER`.
- [x] **Princípio VII (Integrações Desacopladas)**: Camadas de serviço para o Mercado Pago com adapters limpos e isolados da interface.
- [x] **Princípio IX (Performance & SEO)**: Páginas públicas e rotas do cliente com metadados semânticos e carregamento otimizado via Server Components.
- [x] **Princípio X (Testabilidade)**: Lógica de checkout, cálculo de descontos, validação HMAC e concessão idempotente cobertos por testes unitários e de integração.
- [x] **Princípio XI (Observabilidade)**: Trilha de auditoria completa com mascaramento de dados sensíveis e eventos estruturados.
- [x] **Princípio XII (Evolução Incremental)**: Nenhuma alteração destrutiva em esquemas existentes. Fluxo de consulta individual preservado sem regressão.

---

## Target Architecture

### Fluxo 1: Compra Online de Pacote Comercial (Checkout Pro)

```text
[Cliente Autenticado]
        │
        ▼ 1. Visualiza vitrine (GET /api/cliente/credit-package-offers)
[Página de Pacotes /creditos]
        │
        ▼ 2. Clica em "Comprar com Mercado Pago" (envia apenas offerId + idempotencyKey)
[POST /api/cliente/credit-packages/[offerId]/checkout]
        │
        ├── 3. Valida sessão do usuário (auth.getUser())
        ├── 4. Busca oferta ativa no banco (WHERE id = offerId AND is_active = true AND contact_only = false)
        ├── 5. Cria ordem imutável em `credit_package_orders` (snapshot de price_cents e credits)
        ├── 6. Cria registro financeiro em `payment_transactions` (purpose = 'credit_package')
        ├── 7. Monta Preference no Mercado Pago (quantity = 1, unit_price = price_cents / 100, external_reference = order.id)
        └── 8. Retorna init_point do Mercado Pago
        │
        ▼ 9. Redirecionamento ao Checkout Pro
[Mercado Pago Gateway]
        │
        ├── 10. Pagador conclui pagamento (Pix / Cartão)
        ├── 11. Redirecionamento de retorno: /cliente/pacotes/retorno/[orderId]
        └── 12. Notificação assíncrona HTTP POST
                │
                ▼
        [POST /api/webhooks/mercadopago]
                │
                ├── 13. Valida assinatura HMAC (x-signature)
                ├── 14. Deduplica evento em `webhook_events`
                ├── 15. Consulta autoritativa: GET /v1/payments/{id}
                ├── 16. Valida equivalência: status == 'approved', external_reference == order.id, amount == order.price_cents
                ├── 17. Atualiza `credit_package_orders.status = 'paid'` e `payment_transactions.status = 'approved'`
                └── 18. Executa RPC atômica: `grant_credit_package_from_paid_order(orderId)`
                        │
                        ├── Cria `customer_credit_packages` (source = 'mercadopago_package')
                        ├── Insere lançamento contábil em `customer_credit_ledger` (entry_type = 'grant')
                        └── Atualiza saldo em `customer_credit_balances` (+ credits_quantity)
```

### Fluxo 2: Pacote Personalizado (WhatsApp)

```text
[Cliente Autenticado]
        │
        ▼ Seleciona "Volume Customizado (50+ consultas)"
[Botão "Negociar no WhatsApp"]
        │
        ▼ Abre WhatsApp Oficial (site_settings.whatsapp_phone) com texto contextualizado
[Negociação Humana Externa com Diretoria]
        │
        ▼ Pagamento acordado fora da plataforma (Pix PJ / Faturamento)
[Admin Acessa Painel /admin/creditos]
        │
        ▼ Executa concessão manual existente (grantCreditsToUser)
[RPC grant_credit_package]
        │
        ├── Cria `customer_credit_packages` (source = 'manual_admin', payment_channel = 'whatsapp')
        ├── Registra lançamento em `customer_credit_ledger`
        └── Atualiza saldo em `customer_credit_balances`
```

---

## Catalog Offers Versus Customer Packages

Para assegurar o princípio da separação de responsabilidades:

| Conceito | Tabela | Finalidade | Cardinalidade |
|---|---|---|---|
| **Catálogo Comercial de Venda** | `public.credit_package_offers` | Vitrine de produtos disponíveis para contratação. Define regras de precificação, marketing, badges, ordenação e canal de venda. | 1 oferta para N pedidos. |
| **Instância Concedida ao Cliente** | `public.customer_credit_packages` | Lote de créditos real e individualizado pertencente à carteira de um cliente específico. Controla saldo consumido, remanescente e expiração. | 1 pacote por concessão/compra aprovada. |

### Atributos de `public.credit_package_offers`

- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `slug`: `TEXT NOT NULL UNIQUE` (ex: `pacote-inicial-5`, `pacote-lojista-15`)
- `name`: `TEXT NOT NULL` (ex: "Pacote Inicial")
- `short_label`: `TEXT NULL` (ex: "Autônomo", "Mais Recomendado")
- `description`: `TEXT NULL`
- `package_type`: `TEXT NOT NULL DEFAULT 'standard' CHECK (package_type IN ('standard', 'agency', 'reseller', 'fleet', 'custom'))`
- `credits_quantity`: `INTEGER NOT NULL CHECK (credits_quantity > 0)`
- `price_cents`: `INTEGER NOT NULL CHECK (price_cents >= 0)`
- `currency`: `TEXT NOT NULL DEFAULT 'BRL'`
- `reference_individual_price_cents`: `INTEGER NULL` (snapshot do preço de consulta avulsa para cálculo de desconto)
- `discount_percent`: `NUMERIC(5,2) NULL`
- `display_order`: `INTEGER NOT NULL DEFAULT 0`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `is_featured`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `contact_only`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `requires_whatsapp`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `validity_days`: `INTEGER NULL CHECK (validity_days IS NULL OR validity_days > 0)`
- `benefits`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
- `terms_summary`: `TEXT NULL`
- `created_by`: `UUID REFERENCES auth.users(id)`
- `updated_by`: `UUID REFERENCES auth.users(id)`
- `created_at` / `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
- `published_at`: `TIMESTAMPTZ NULL`

---

## Order and Payment Data Model

### Tabela `public.credit_package_orders`

Registra o pedido de compra do pacote e atua como intermediário entre a oferta comercial e o gateway de pagamento.

```sql
CREATE TABLE IF NOT EXISTS public.credit_package_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES public.credit_package_offers(id) ON DELETE RESTRICT,
    offer_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity = 1),
    credits_quantity INTEGER NOT NULL CHECK (credits_quantity > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents > 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
    reference_individual_price_cents INTEGER,
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    discount_percent NUMERIC(5,2),
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'payment_in_process', 'paid', 'rejected', 'cancelled', 'refunded', 'manual_review')),
    payment_transaction_id UUID,
    mp_preference_id TEXT UNIQUE,
    mp_payment_id TEXT UNIQUE,
    external_reference TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    granted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);
```

### Relacionamento com `public.payment_transactions`

Para evitar pseudo-transações e manter relatórios financeiros contábeis centralizados:

1. **Alteração em `payment_transactions`**:
   - `consultation_id UUID NULL REFERENCES public.customer_plate_consultations(id)` (tornado opcional).
   - `purpose TEXT NOT NULL DEFAULT 'vehicle_consultation' CHECK (purpose IN ('vehicle_consultation', 'credit_package'))`.
   - `credit_package_order_id UUID NULL REFERENCES public.credit_package_orders(id) ON DELETE SET NULL`.
   - Constraint de coerência:
     ```sql
     CHECK (
         (purpose = 'vehicle_consultation' AND consultation_id IS NOT NULL) OR
         (purpose = 'credit_package' AND credit_package_order_id IS NOT NULL)
     )
     ```
2. **Nota Importante sobre Moeda**: A coluna `currency` não é adicionada à tabela `payment_transactions` para manter total compatibilidade com o schema existente; ela pertence estritamente ao pedido (`credit_package_orders.currency`) e ao payload da Preference Mercado Pago (`currency_id = 'BRL'`).

---

## Pricing and Discount Strategy

1. **Fonte Única da Verdade**:
   - O preço persistido em centavos (`price_cents`) é o único valor canônico considerado pelo backend.
   - Ao alterar o preço de uma oferta no admin, o novo preço passa a valer apenas para **novas ordens**.
2. **Snapshot Imutável no Pedido**:
   - No momento do checkout, a ordem congela: `price_cents`, `credits_quantity`, `unit_price_cents`, `reference_individual_price_cents`, `discount_cents` e `discount_percent`.
   - Edições posteriores de ofertas comerciais nunca alteram pedidos anteriores ou pendentes.
3. **Cálculos Automáticos do Sistema**:
   - `unit_price_cents = Math.round(price_cents / credits_quantity)`
   - `discount_cents = Math.max(0, (reference_individual_price_cents * credits_quantity) - price_cents)`
   - `discount_percent = ((reference_individual_price_cents * credits_quantity) - price_cents) / (reference_individual_price_cents * credits_quantity) * 100`

---

## Checkout Pro Integration

1. **Endpoint**: `POST /api/cliente/credit-packages/[offerId]/checkout`
2. **Payload Aceito**:
   ```json
   {
     "idempotencyKey": "a9d72e40-5e36-4c22-b531-1555df319a71"
   }
   ```
   *(Campos como `price`, `credits`, `discount`, `currency` são sumariamente rejeitados/ignorados).*
3. **Construção da Preference no Mercado Pago**:
   - `items`:
     - `id`: `offer.slug`
     - `title`: `offer.name`
     - `quantity`: 1
     - `unit_price`: `order.price_cents / 100`
     - `currency_id`: `'BRL'`
   - `external_reference`: `order.id` (UUID canônico do pedido)
   - `metadata`:
     - `purpose`: `'credit_package'`
     - `order_id`: `order.id`
     - `offer_id`: `offer.id`
     - `user_id`: `user.id`
     - `credits_quantity`: `order.credits_quantity`
   - `back_urls`: Resolvidas com prefixo `/cliente/pacotes/retorno/${order.id}`
   - `notification_url`: Endpoint de webhook configurado.

---

## Webhook and Reconciliation Strategy

1. **Recepção e Roteamento**:
   - O endpoint oficial `app/api/webhooks/mercadopago/route.ts` recebe o evento, valida a assinatura HMAC SHA-256 e deduplica em `webhook_events`.
   - Executa `fetchAuthoritativePayment(resourceId)` para obter os dados oficiais do Mercado Pago.
2. **Identificação da Finalidade (`purpose`)**:
   - Localiza a transação ou ordem a partir de `payment.external_reference`.
   - Se `external_reference` corresponder a um `credit_package_orders.id` (ou `payment_transactions.purpose === 'credit_package'`), roteia para o processamento de pacote.
3. **Validação Rigorosa**:
   - `payment.status === 'approved'`
   - `Math.round(payment.transaction_amount * 100) === order.price_cents`
   - `payment.currency_id === order.currency`
4. **Fallback de Reconciliação sob Demanda**:
   - Endpoint `GET /api/cliente/credit-packages/orders/[orderId]/status`: consulta o status da ordem e dispara a reconciliação ativa se o pagamento estiver pendente.
   - Endpoint administrativo `POST /api/admin/credit-package-orders/[orderId]/reconcile`: permite que o operador force a verificação imediata na API oficial.

---

## Idempotent Credit Grant Strategy

O serviço central de concessão é formalizado como uma **função RPC atômica no PostgreSQL**:

`public.grant_credit_package_from_paid_order(p_order_id UUID) -> JSONB`

### Regras de Execução

1. **Apenas Backend / Service Role**: Executada exclusivamente pelo webhook ou rotas de reconciliação com `SECURITY DEFINER`.
2. **Lock Pessimista**: `SELECT * FROM credit_package_orders WHERE id = p_order_id FOR UPDATE`.
3. **Pré-requisitos Obrigatórios**:
   - `order.status == 'paid'`
   - `order.mp_payment_id IS NOT NULL`
4. **Proteção Anti-Duplicação**:
   - Verifica se já existe um `customer_credit_packages` com `purchase_order_id = p_order_id`. Se existir, retorna `{ success: true, code: 'ALREADY_GRANTED' }`.
5. **Efeitos Produzidos em Transação Única**:
   - Cria o registro em `customer_credit_packages` com `source = 'mercadopago_package'`.
   - Insere o lançamento no ledger `customer_credit_ledger` com `entry_type = 'grant'`, `reason_code = 'PACKAGE_PURCHASE_APPROVED'` e chave determinística `idempotency_key = 'package-grant:' || p_order_id::text`.
   - Executa upsert em `customer_credit_balances` incrementando `available_credits`.
   - Atualiza `credit_package_orders.granted_at = now()`.

---

## Customer Purchase Experience

1. **Tela de Pacotes (`/cliente/creditos` e `/cliente/pacotes`)**:
   - Carrega as ofertas ativas do banco de dados via Server Component.
   - Cards responsivos com visual premium: nome, selo de recomendação, preço final formatado em R$, valor por consulta e benefícios.
   - **Pacotes Padrão**: Botão com estado de loading "Comprar com Mercado Pago" (protegido contra múltiplos cliques).
   - **Pacote Customizado**: Botão "Negociar no WhatsApp" com ícone dedicado e link gerado a partir do telefone oficial da empresa.
2. **Tela de Retorno (`/cliente/pacotes/retorno/[orderId]`)**:
   - Exibe feedback em tempo real com os estados:
     - *Aguardando confirmação do pagamento...*
     - *Pagamento confirmado! Liberando seus créditos...*
     - *Créditos liberados com sucesso! (+5 créditos disponíveis)*
     - *Pagamento recusado ou cancelado.*
   - Mecanismo de polling suave a cada 2,5 segundos (máximo 8 tentativas) até a confirmação do grant.
   - Atualização automática do saldo visível no header sem necessidade de novo login.

---

## Administrative Offer Management

Rota administrativa dedicada: `/admin/configuracoes/pacotes-consultas`

### Funcionalidades do Módulo Administrativo

1. **Listagem de Ofertas**: Visualização em tabela com badges de status (Ativo/Inativo), tipo de pacote, destaque, ordem de exibição e canal de venda.
2. **Criação e Edição de Oferta**:
   - Campos: Nome público, slug, quantidade de créditos, preço final em R$, preço individual de referência, validade em dias, benefícios e nota interna.
   - Cálculo reativo em tempo real de preço unitário por consulta e desconto percentual.
3. **Controle de Ciclo de Vida**:
   - Ações rápidas para ativar/desativar oferta com efeito imediato na vitrine de clientes.
   - Proibição de exclusão de ofertas que já possuem pedidos vinculados (utiliza desativação/arquivamento lógico).
4. **Visão de Pedidos e Vendas**:
   - Painel integrado listando compras de pacotes via Mercado Pago e concessões manuais de WhatsApp.
   - Botão para reconciliação forçada de pedidos pendentes.

---

## Custom Package WhatsApp Flow

1. **Comportamento da Interface**:
   - A oferta customizada possui `contact_only = true` e `requires_whatsapp = true`.
   - Não renderiza botão de checkout; renderiza botão verde de contato direto via WhatsApp.
2. **Mensagem Segura**:
   - Mensagem pré-formatada sem exposição de tokens ou dados confidenciais:
     ```text
     "Olá! Sou {Nome} e tenho interesse em um pacote personalizado de consultas veiculares (50+ consultas) na AF Motos."
     ```
3. **Concessão Pós-Negociação**:
   - O administrador utiliza o fluxo manual existente (`grantCreditsToUser`), registrando o canal como `'whatsapp'` e a origem como `'manual_admin'`. Nenhum pedido Mercado Pago é gerado para essa modalidade.

---

## Refund and Post-Purchase Credit Policy

| Cenário de Consumo | Comportamento Técnico e Comercial |
|---|---|
| **Pagamento Recusado / Cancelado** | Nenhum crédito é concedido. Ordem marcada como `rejected` ou `cancelled`. |
| **Estorno Antes de Qualquer Uso** (`credits_remaining == credits_granted`) | Revogação total: o pacote é cancelado (`status = 'cancelled'`), o saldo disponível é deduzido via lançamento de `revoke` no ledger, e a ordem é marcada como `refunded`. |
| **Estorno Após Consumo Parcial** (`0 < credits_remaining < credits_granted`) | O sistema bloqueia estorno automático. O pacote é marcado como `suspended` e direcionado para **`manual_review`**. O saldo remanescente é travado para evitar novos usos, e os laudos já entregues são integralmente preservados no histórico contábil. Requer deliberação administrativa para reembolso pro-rata. |
| **Créditos Totalmente Consumidos** (`credits_remaining == 0`) | Estorno automático rejeitado. Qualquer contestação é tratada como disputa manual de chargeback. |

> [!IMPORTANT]
> Em nenhuma hipótese registros do livro razão (`customer_credit_ledger`) são deletados durante um estorno. O ledger é estritamente append-only.

---

## Security, Authorization, and RLS

### Matriz de Acesso (RBAC)

1. **Cliente Autenticado**:
   - Pode listar ofertas onde `is_active = true`.
   - Pode iniciar checkout apenas para ofertas com `is_active = true AND contact_only = false`.
   - Pode consultar e reconciliar **apenas seus próprios pedidos** (`auth.uid() = user_id`).
   - Não pode alterar preços, criar ordens com status `paid` ou chamar a RPC de concessão de créditos.
2. **Administrador**:
   - Autorização verificada via `admin_profiles.auth_user_id = auth.uid()`, `is_active = true` e `role IN ('admin', 'super_admin')`.
   - Acesso irrestrito a criar/editar ofertas, visualizar pedidos de todos os clientes e acionar reconciliações e estornos.

### Políticas de RLS (PostgreSQL)

```sql
-- credit_package_offers
ALTER TABLE public.credit_package_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active offers" ON public.credit_package_offers 
    FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage offers" ON public.credit_package_offers 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles 
            WHERE auth_user_id = auth.uid() AND is_active = true AND role IN ('admin', 'super_admin')
        )
    );

-- credit_package_orders
ALTER TABLE public.credit_package_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON public.credit_package_orders 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.credit_package_orders 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles 
            WHERE auth_user_id = auth.uid() AND is_active = true AND role IN ('admin', 'super_admin')
        )
    );
```

---

## Logging and Audit Trail

Eventos estruturados com emissor seguro:

```text
[CREDIT_PACKAGE_CHECKOUT] credit_package_checkout_started
[CREDIT_PACKAGE_CHECKOUT] credit_package_order_created
[CREDIT_PACKAGE_CHECKOUT] credit_package_preference_created
[CREDIT_PACKAGE_CHECKOUT] credit_package_payment_pending
[CREDIT_PACKAGE_CHECKOUT] credit_package_payment_approved
[CREDIT_PACKAGE_CHECKOUT] credit_package_payment_rejected
[CREDIT_PACKAGE_CHECKOUT] credit_package_grant_started
[CREDIT_PACKAGE_CHECKOUT] credit_package_granted
[CREDIT_PACKAGE_CHECKOUT] credit_package_grant_duplicate_prevented
[CREDIT_PACKAGE_CHECKOUT] credit_package_reconcile_started
[CREDIT_PACKAGE_CHECKOUT] credit_package_reconcile_completed
[CREDIT_PACKAGE_CHECKOUT] credit_package_refund_detected
[CREDIT_PACKAGE_CHECKOUT] credit_package_refund_manual_review
```

- **Campos Sanitizados**: `flowId`, `orderIdMasked`, `offerIdMasked`, `transactionIdMasked`, `paymentIdMasked`, `userIdMasked`, `creditsQuantity`, `amountCents`, `status`, `reasonCode`, `timestamp`.
- **Campos Estritamente Proibidos nos Logs**: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, tokens HMAC, números de cartão de crédito e CPF.

---

## API and Server Action Contracts

### 1. Cliente: Checkout de Pacote
- **Rota**: `POST /api/cliente/credit-packages/[offerId]/checkout`
- **Validação**: Zod `{ idempotencyKey: z.string().uuid() }`
- **Erros**: `401 Unauthorized`, `404 Offer Not Found`, `422 OFFER_INACTIVE`, `422 OFFER_REQUIRES_WHATSAPP`
- **Resposta (200)**: `{ success: true, orderId, transactionId, preferenceId, redirectUrl }`

### 2. Cliente: Status do Pedido
- **Rota**: `GET /api/cliente/credit-packages/orders/[orderId]/status`
- **Validação**: Titularidade (`user_id = auth.uid()`)
- **Resposta (200)**: `{ success: true, orderId, status, isPaid, isGranted, creditsQuantity, amountFormatted }`

### 3. Cliente: Catálogo de Ofertas Ativas
- **Rota**: `GET /api/cliente/credit-package-offers`
- **Resposta (200)**: `{ success: true, offers: [...] }`

### 4. Admin: Gestão de Ofertas
- **Rotas**: `GET /api/admin/credit-package-offers` e `POST /api/admin/credit-package-offers`
- **Validação**: Zod para campos comerciais; autorização admin ativa.

### 5. Admin: Reconciliação Forçada
- **Rota**: `POST /api/admin/credit-package-orders/[orderId]/reconcile`
- **Resposta (200)**: `{ success: true, reconciled: true, currentStatus: 'paid', creditsGranted: 15 }`

---

## Data Migrations and Backfill

Serão criadas duas migrations SQL aditivas e idempotentes:

1. `supabase/migrations/20260918100000_create_credit_package_offers_and_orders.sql`:
   - Criação de `credit_package_offers` e `credit_package_orders`.
   - Índices para performance e restrições de unicidade.
   - Seed idempotente das 4 ofertas padrão (5, 15, 30 consultas e 50+ customizado).
2. `supabase/migrations/20260918110000_evolve_payments_and_credit_grant_rpc.sql`:
   - Adição das colunas `purpose` e `credit_package_order_id` em `payment_transactions`, tornando `consultation_id` nullable.
   - Adição de `offer_id`, `source`, `purchase_order_id`, `purchase_price_cents` em `customer_credit_packages`.
   - Criação da RPC `grant_credit_package_from_paid_order`.
   - Configuração das políticas RLS em todas as tabelas.

---

## Implementation Phases

### Phase 0 — Baseline e Contratos
- Mapeamento completo dos artefatos e especificações existentes (`specs/028`, `specs/033`, `specs/036`, `specs/037`).
- Validação do checklist de requisitos da spec 039.

### Phase 1 — Catálogo e Migrations
- Execução das migrations aditivas no Supabase.
- Verificação das tabelas, índices e integridade referencial.

### Phase 2 — Serviços de Domínio e Validações
- Implementação de `lib/credits/offers-service.ts` e `lib/credits/orders-service.ts`.
- Implementação de `lib/mercadopago/package-preference-builder.ts`.
- Adaptação de `lib/mercadopago/payment-processing-service.ts` para suporte ao `purpose = 'credit_package'`.

### Phase 3 — Endpoints de API e Webhook
- Criação das rotas de checkout e status do cliente.
- Atualização do webhook do Mercado Pago para roteamento multiobjetivo.
- Criação das rotas administrativas de catálogo e reconciliação.

### Phase 4 — Área do Cliente e Página de Retorno
- Atualização de `components/customer/customer-credits-view.tsx` para carregar ofertas do banco.
- Implementação dos botões "Comprar com Mercado Pago" e "Negociar no WhatsApp".
- Criação da tela `/cliente/pacotes/retorno/[orderId]/page.tsx` com polling reativo e atualização de saldo.

### Phase 5 — Painel Administrativo
- Criação da tela `/admin/configuracoes/pacotes-consultas/page.tsx` para gestão de ofertas.
- Integração da listagem de pedidos com diferenciação entre compras online e concessões manuais.

### Phase 6 — Testes, Observabilidade e Rollout
- Bateria de testes automatizados com `node --test`.
- Validação em ambiente Preview com credenciais de teste do Mercado Pago.
- Homologação de ponta a ponta e preparação para deploy.

---

## Test Strategy

A validação de qualidade será realizada via suíte de testes automatizados com `node --experimental-strip-types --test`:

1. **Testes de Catálogo e Segurança de Preços**:
   - Validação de que parâmetros adulterados de preço/créditos enviados pelo cliente são ignorados (`lib/credits/__tests__/checkout-security.test.ts`).
   - Validação de que ofertas inativas ou com `contact_only = true` rejeitam checkout automático.
2. **Testes de Idempotência e Concessão**:
   - Validação de que chamadas repetidas da RPC `grant_credit_package_from_paid_order` retornam `ALREADY_GRANTED` sem duplicar pacotes ou saldo (`lib/credits/__tests__/grant-idempotency.test.ts`).
   - Simulação de concorrência e webhooks retransmitidos.
3. **Testes de Política de Estorno**:
   - Validação de cancelamento/revogação para pacotes não utilizados e suspensão para `manual_review` em pacotes parcialmente usados.
4. **Verificações de Qualidade Obrigatórias**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

---

## Deployment, Monitoring, and Rollback

### Processo de Rollout Seguro

1. **Desenvolvimento na Branch**: `feat/mercadopago-credit-package-checkout`.
2. **Revisão das Migrations**: Validação de idempotência e ausência de bloqueios em tabelas de produção.
3. **Deploy em Ambiente Preview**:
   - Validação com vendedor/comprador de teste no Sandbox do Mercado Pago.
   - Teste de compra de pacote de 5 créditos.
   - Validação de recebimento do webhook e incremento correto no saldo.
4. **Deploy em Produção**:
   - Configuração do Webhook oficial no portal do desenvolvedor Mercado Pago.
   - Aplicação das migrations.
   - Verificação em tempo real dos logs estruturados.

### Plano de Contingência e Rollback

- **Desativação Imediata**: Se houver qualquer anomalia no gateway, basta desativar as ofertas no admin (`is_active = false`) ou marcá-las como `contact_only = true`. A interface do cliente voltará instantaneamente a direcionar todos os pacotes para o WhatsApp, sem necessidade de novo deploy.
- **Rollback de Banco**: Por serem 100% aditivas, as tabelas novas e colunas opcionais não causam quebras no fluxo legado de consultas individuais.
- **Pedidos em Andamento**: Ordens pendentes são preservadas no banco para auditoria e resolução manual através da tela administrativa.

---

## Operational Runbook

1. **Cadastrar Nova Oferta Promocional**:
   - Acessar `/admin/configuracoes/pacotes-consultas` e clicar em "Nova Oferta".
   - Informar nome, créditos e preço final em R$. O sistema calcula os descontos automaticamente.
   - Ativar e marcar como destaque se desejado.
2. **Reconciliar Compra de Cliente com Atraso na Notificação**:
   - Localizar o pedido pelo e-mail do cliente ou ID da ordem na central administrativa.
   - Clicar no botão **"Reconciliar Pagamento"**.
   - O sistema buscará o pagamento oficial no Mercado Pago e acionará a concessão atômica de créditos imediatamente.
3. **Processar Solicitação de Estorno**:
   - Verificar a quantidade de créditos restantes do cliente.
   - Se nenhuma consulta foi realizada com o pacote: aprovar estorno total pelo painel.
   - Se houver consumo parcial: avaliar o valor residual com a diretoria para estorno pro-rata manual, mantendo a integridade dos laudos já emitidos.

---

## Risks and Open Questions

| Item | Status | Decisão / Encaminhamento Proposto |
|---|---|---|
| **Validade dos Créditos Comprados Online** | Decisão de Negócio Pendente | Proposta padrão: créditos de pacotes comprados online **não expiram** (`validity_days = NULL`), seguindo o padrão atual da plataforma. Configurável pelo admin. |
| **Preços Iniciais Recomendados** | Decisão de Negócio Pendente | 5 créditos: R$ 180,00 (R$ 36/consulta); 15 créditos: R$ 510,00 (R$ 34/consulta); 30 créditos: R$ 960,00 (R$ 32/consulta); 50+ customizado: WhatsApp. Todos editáveis no painel. |
| **Compra de Múltiplos Pacotes no Mesmo Checkout** | Fechado (Escopo Inicial) | Proposta: quantidade fixada em 1 por pedido (`quantity = 1`). Compras adicionais geram novo pedido individual. |
| **Transferência de Créditos entre Contas** | Fechado (Escopo Inicial) | Proibido. Os créditos são intransferíveis e vinculados à conta compradora. |
| **Emissão Fiscal / Recibos** | Fora do Escopo Inicial | A plataforma registra o comprovante de pagamento e transação financeira; notas fiscais consolidadas são emitidas pela contabilidade externa. |
| **Contas Compartilhadas Corporativas** | Fora do Escopo Inicial | Será avaliado em módulo futuro para frotistas multiusuário. |
