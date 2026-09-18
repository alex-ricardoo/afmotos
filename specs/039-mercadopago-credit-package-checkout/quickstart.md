# Quickstart: Checkout Pro para Pacotes de Créditos B2B

## 1. Pré-requisitos e Variáveis de Ambiente

Certifique-se de que as seguintes variáveis de ambiente estão configuradas no seu `.env.local`:

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
MERCADOPAGO_WEBHOOK_SECRET="sua_chave_hmac_webhook"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-..."

# URL da Aplicação (usada para Back URLs e Webhook)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_anon_key"
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
```

---

## 2. Execução das Migrations

Para aplicar o modelo de dados de pacotes, execute as migrations no Supabase local ou staging:

```bash
npx supabase migration up
```

Ou execute os scripts SQL via Supabase SQL Editor:
- `supabase/migrations/20260918100000_create_credit_package_offers_and_orders.sql`
- `supabase/migrations/20260918110000_evolve_payments_and_credit_grant_rpc.sql`

---

## 3. Testando o Fluxo de Compra (Visão do Cliente)

1. Faça login na área do cliente: `http://localhost:3000/cliente/login`.
2. Acesse a vitrine de pacotes: `http://localhost:3000/cliente/creditos` ou `/cliente/pacotes`.
3. Verifique os 4 pacotes padrão:
   - **Pacote Inicial (5 consultas)**: botão "Comprar com Mercado Pago".
   - **Pacote Lojista & Revenda (15 consultas)**: destaque "Mais Recomendado".
   - **Pacote Frotista & Despachante (30 consultas)**: melhor custo-benefício.
   - **Volume Customizado (50+ consultas)**: botão "Negociar no WhatsApp".
4. Clique em **"Comprar com Mercado Pago"** no Pacote Inicial.
5. Você será redirecionado para o Sandbox do Mercado Pago.
6. Realize o pagamento de teste com cartão aprovado ou Pix Sandbox.
7. Ao concluir, você será redirecionado para:
   `http://localhost:3000/cliente/pacotes/retorno/[orderId]`
8. O status passará de "Confirmando..." para "Créditos liberados!".
9. Verifique seu saldo no cabeçalho ou na página de créditos: ele deverá ter aumentado em 5 créditos.

---

## 4. Simulando Webhook do Mercado Pago Localmente

Para simular o recebimento de notificação assíncrona do Mercado Pago:

```bash
curl -X POST http://localhost:3000/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1726588800,v1=..." \
  -d '{
    "type": "payment",
    "action": "payment.created",
    "data": { "id": "1234567890" }
  }'
```

---

## 5. Gestão Administrativa de Ofertas

1. Acesse o painel com usuário administrador: `http://localhost:3000/admin`.
2. Navegue até: `http://localhost:3000/admin/configuracoes/pacotes-consultas`.
3. Para criar ou alterar uma oferta:
   - Defina nome, quantidade de créditos e **preço final em R$**.
   - Observe o cálculo automático do valor por consulta e economia.
   - Alterne o status entre Ativo / Inativo e verifique a atualização imediata na área do cliente.
