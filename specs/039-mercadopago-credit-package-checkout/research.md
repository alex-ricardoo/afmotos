# Research: Checkout Pro para Pacotes de Créditos B2B com Gestão Administrativa

## 1. Contexto e Diagnóstico da Base Atual

A aplicação AF Motos possui uma infraestrutura de pagamentos e créditos já estabelecida, composta por:
1. **Mercado Pago Checkout Pro para Consultas Individuais**:
   - Rota de preferência: `app/api/mp/checkout-pro/preferences/route.ts`
   - Rota de webhook: `app/api/webhooks/mercadopago/route.ts`
   - Rota de reconciliação: `app/api/mp/transactions/[transactionId]/reconcile/route.ts`
   - Serviço central de confirmação: `lib/mercadopago/payment-processing-service.ts`
   - Tabela de persistência financeira: `payment_transactions`
2. **Sistema de Créditos B2B e Consultas Veiculares**:
   - Tabela de instâncias de pacotes concedidos: `customer_credit_packages`
   - Livro razão contábil (ledger) append-only: `customer_credit_ledger`
   - Balanços agregados com concorrência: `customer_credit_balances`
   - Reservas transitórias por consulta: `customer_credit_reservations`
   - Serviços de negócio: `lib/credits/credit-service.ts`
3. **Página de Pacotes do Cliente**:
   - `app/cliente/creditos/page.tsx` e `components/customer/customer-credits-view.tsx`
   - Atualmente possui pacotes hardcoded no componente com botões direcionando exclusivamente para o WhatsApp.

---

## 2. Decisões Arquiteturais Fundamentais

### 2.1 Catálogo Comercial (`credit_package_offers`) vs Instâncias Concedidas (`customer_credit_packages`)

**Problema**: A tabela existente `customer_credit_packages` foi concebida para armazenar a *concessão realizada a um cliente específico* (`user_id`, `credits_granted`, `credits_remaining`, `status`, `granted_by`). Ela não atua como catálogo comercial parametrizável.

**Decisão**:
- Criar a tabela `public.credit_package_offers` para atuar como o **catálogo de ofertas de pacotes vendáveis**.
- Manter `customer_credit_packages` como o **lote efetivo de créditos pertencente ao cliente**.
- Adicionar colunas aditivas em `customer_credit_packages`:
  - `offer_id UUID NULL REFERENCES credit_package_offers(id)`
  - `purchase_order_id UUID NULL REFERENCES credit_package_orders(id)`
  - `source TEXT NOT NULL DEFAULT 'manual_admin'` (valores: `manual_admin`, `mercadopago_package`, `promotional`, `partner`, `test`)
  - `purchase_price_cents INTEGER NULL`
  - `purchase_currency TEXT NOT NULL DEFAULT 'BRL'`
  - `purchased_at TIMESTAMPTZ NULL`

### 2.2 Pedido de Pacote (`credit_package_orders`) e Integração com `payment_transactions`

**Problema**: Um pedido de compra de pacote possui um ciclo de vida financeiro e de concessão próprio:
- O cliente seleciona a oferta.
- O backend cria a ordem com snapshot do preço (`price_cents`) e quantidade de créditos.
- A ordem gera a Preference no Mercado Pago com `external_reference = order.id`.
- O webhook ou a reconciliação autoritativa confirma o pagamento e atualiza a ordem para `paid`.
- A concessão atômica dos créditos é acionada exatamente uma vez.

**Decisão de Modelagem**:
- Criar `public.credit_package_orders` como o registro canônico do pedido do cliente.
- Reutilizar a tabela `public.payment_transactions` para unificar relatórios financeiros, auditoria contábil e reconciliação centralizada, aplicando modificações aditivas:
  - Tornar `payment_transactions.consultation_id` opcional (`DROP NOT NULL`).
  - Adicionar coluna `purpose TEXT NOT NULL DEFAULT 'vehicle_consultation' CHECK (purpose IN ('vehicle_consultation', 'credit_package'))`.
  - Adicionar coluna `credit_package_order_id UUID NULL REFERENCES public.credit_package_orders(id) ON DELETE SET NULL`.
  - Vincular `credit_package_orders.payment_transaction_id UUID REFERENCES public.payment_transactions(id)`.

**Vantagens**:
- Central de pagamentos e estornos administrativa (`specs/033`) já consome `payment_transactions` e relatórios contábeis (`specs/037`), mantendo total consistência.
- Nenhuma criação de pseudo-transação. O pagamento de pacote é uma transação financeira autêntica do gateway.

---

## 3. Segurança e Prevenção de Fraude Financeira

### 3.1 Fonte Única da Verdade (Single Source of Truth)

O frontend do cliente envia estritamente:
```json
{
  "offerId": "481a5c60-84a1-432d-a128-406bb1857904",
  "idempotencyKey": "e1f13b19-4bb4-49c0-9a3d-495066a7b1cb"
}
```

O backend:
1. Rejeita imediatamente qualquer tentativa do cliente de injetar `price`, `discount`, `credits`, `unitPrice` ou `currency`.
2. Busca a oferta ativa no banco:
   ```sql
   SELECT * FROM public.credit_package_offers
   WHERE id = $1 AND is_active = true AND contact_only = false;
   ```
3. Se a oferta estiver inativa ou configurada como `contact_only = true`, rejeita a criação do checkout com código `OFFER_NOT_ELIGIBLE_FOR_CHECKOUT`.
4. Utiliza o `price_cents` persistido no banco para:
   - Persistir em `credit_package_orders.price_cents`
   - Persistir em `payment_transactions.transaction_amount` (dividido por 100)
   - Definir o `unit_price` na Preference do Mercado Pago (`price_cents / 100`)

### 3.2 Validação Autoritativa no Webhook / Reconciliação

Ao receber notificação de pagamento do Mercado Pago:
1. Validação obrigatória da assinatura criptográfica HMAC (`x-signature` + manifesto com `ts` e `v1`).
2. Deduplicação em `webhook_events`.
3. Busca autoritativa na API do Mercado Pago (`GET /v1/payments/{id}`) via backend seguro com Access Token restrito ao servidor.
4. Validação estrita de equivalência:
   - `payment.status == 'approved'`
   - `payment.external_reference == credit_package_order.id`
   - `Math.round(payment.transaction_amount * 100) == order.price_cents`
   - `payment.currency_id == order.currency`
5. Se qualquer parâmetro divergir, o pedido não é marcado como pago e nenhum crédito é liberado.

---

## 4. Concessão Idempotente de Créditos (`grant_credit_package_from_paid_order`)

Para garantir que a liberação ocorra estritamente uma vez, criamos uma função RPC atômica no PostgreSQL:
- Recebe `p_order_id UUID`.
- Aplica `SELECT FOR UPDATE` na linha de `credit_package_orders`.
- Verifica se a ordem está com `status = 'paid'`.
- Verifica se já existe um `customer_credit_packages` vinculado a este `purchase_order_id`.
  - Se já existir, retorna imediatamente `{ success: true, already_granted: true }` de forma segura e idempotente.
- Insere o registro em `customer_credit_packages` com:
  - `source = 'mercadopago_package'`
  - `credits_granted = order.credits_quantity`
  - `credits_remaining = order.credits_quantity`
  - `unit_price_cents = order.unit_price_cents`
  - `total_paid_cents = order.price_cents`
- Insere o lançamento contábil no livro razão `customer_credit_ledger`:
  - `entry_type = 'grant'`
  - `reason_code = 'PACKAGE_PURCHASE_APPROVED'`
  - `idempotency_key = 'package-grant:' || p_order_id::text`
- Atualiza atomicamente o balanço do cliente em `customer_credit_balances`:
  - `available_credits = available_credits + order.credits_quantity`
- Atualiza `credit_package_orders.granted_at = now()`.
- Registra evento de auditoria no log de auditoria.

---

## 5. Política Comercial e Técnica de Estorno (Refund) de Pacotes

Conforme estipulado no levantamento de requisitos:

| Cenário de Consumo | Comportamento do Sistema |
|---|---|
| **Zero créditos consumidos** (`credits_remaining == credits_granted`) | Revogação total automática ou aprovada: pacote cancelado (`status = 'cancelled'`), ledger registra `revoke`, balanço deduz `available_credits`, pedido marcado como `refunded`. |
| **Créditos consumidos parcialmente** (`0 < credits_remaining < credits_granted`) | Bloqueio imediato do saldo restante: pacote marcado como `suspended` / `manual_review`, saldo remanescente retirado de `available_credits`, laudos veiculares concluídos são integralmente preservados no histórico contábil. Requer decisão administrativa para reembolso pro-rata. |
| **Créditos totalmente consumidos** (`credits_remaining == 0`) | Rejeição automática de estorno no gateway, ou direcionamento para auditoria manual de contestação de cobrança (chargeback). |

---

## 6. Fluxo de Navegação do Cliente e Área Administrativa

1. **Cliente (`/cliente/creditos` ou `/cliente/pacotes`)**:
   - As ofertas comerciais são obtidas via query/API que consulta `credit_package_offers` onde `is_active = true`.
   - Cards com design moderno exibem: nome, quantidade de consultas, preço final formatado em R$, preço unitário por consulta, selo de destaque ("Mais Recomendado"), e lista de benefícios.
   - Pacotes padrão ativos (ex: 5, 15, 30 consultas) possuem botão de ação **"Comprar com Mercado Pago"**.
   - Pacote customizado (ex: 50+ consultas) possui botão **"Negociar no WhatsApp"**, que monta mensagem parametrizada e abre o canal oficial.
2. **Página de Retorno (`/cliente/pacotes/retorno/[orderId]`)**:
   - Exibe status dinâmico com mecanismo de polling leve/reativo e botão manual "Atualizar status".
   - Executa reconciliação server-side se o status interno ainda estiver pendente.
   - Não aceita e ignora parâmetros `collection_status` ou `status` injetados na query string.
3. **Área Administrativa (`/admin/configuracoes/pacotes-consultas` ou `/admin/pacotes-consultas`)**:
   - Gestão de Ofertas: criar, editar, alternar ativação, marcar destaque, definir ordem, configurar `contact_only`.
   - Listagem de Pedidos: visualizar compras via Mercado Pago vs concessões manuais de WhatsApp, status de conciliação e botões para forçar reconciliação e emitir estorno controlado.
