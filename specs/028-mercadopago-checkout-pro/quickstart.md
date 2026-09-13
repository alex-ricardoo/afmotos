# Developer Quickstart: Mercado Pago Checkout Pro

**Feature**: `028-mercadopago-checkout-pro`  
**Target Audience**: Engenheiros de Software AF Motos  

---

## 1. Pré-requisitos e Dependências

Certifique-se de que a biblioteca oficial do Mercado Pago está fixada na versão `2.12.0`:

```bash
npm install mercadopago@2.12.0
```

---

## 2. Configuração das Variáveis de Ambiente (`.env.local`)

Adicione as variáveis necessárias em seu arquivo `.env.local`:

```env
# URLs da Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Credenciais Mercado Pago (Sandbox / Teste)
MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADO_PAGO_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADO_PAGO_CHECKOUT_MODE=test

# URL de Webhook pública (necessária para receber notificações em desenvolvimento)
MERCADO_PAGO_WEBHOOK_URL=https://<seu-tunnel>.ngrok-free.app/api/webhooks/mercadopago
```

---

## 3. Configuração do Túnel de Webhook Local (ngrok ou Cloudflared)

Como o Mercado Pago não consegue entregar requisições POST para `localhost`, abra um túnel público:

```bash
ngrok http 3000
```

Copie a URL HTTPS gerada (ex.: `https://abc-123.ngrok-free.app`) e:
1. Configure `MERCADO_PAGO_WEBHOOK_URL=https://abc-123.ngrok-free.app/api/webhooks/mercadopago` no `.env.local`.
2. Acesse o [Painel do Desenvolvedor Mercado Pago](https://www.mercadopago.com.br/developers/panel) > Suas Aplicações > Notificações Webhooks.
3. Configure a URL de notificação para o ambiente de testes apontando para o seu túnel.
4. Obtenha a Chave Secreta de Assinatura (Webhook Secret) e salve em `MERCADO_PAGO_WEBHOOK_SECRET`.

---

## 4. Fluxo de Teste Manual Passo a Passo

### Passo 1: Criar uma Consulta Veicular
1. Acesse `http://localhost:3000/cliente/consultas`.
2. Digite uma placa de teste (ex.: `ABC1D23`).
3. O sistema cria a consulta com status `pending` e `payment_status = 'unpaid'` e redireciona para `/cliente/pagamento/[consultationId]`.

### Passo 2: Iniciar o Pagamento com Checkout Pro
1. Na tela de pagamento, clique em **"Pagar com Mercado Pago"**.
2. O servidor cria a transação pendente em `payment_transactions`, gera a preferência com o Mercado Pago e redireciona para a página segura hospedada `sandbox_init_point`.

### Passo 3: Concluir o Pagamento no Sandbox
1. No checkout do Mercado Pago:
   - Para teste com Cartão: use os dados de cartões de teste da documentação oficial do Mercado Pago (com bandeira Master/Visa de teste).
   - Para teste com Pix: conclua a simulação de aprovação no ambiente de testes.
2. Após o pagamento, o Mercado Pago redireciona automaticamente para `/cliente/pagamento/retorno/[transactionId]`.

### Passo 4: Recepção de Webhook e Liberação do Laudo
1. O Mercado Pago envia a notificação para `/api/webhooks/mercadopago`.
2. O servidor valida o HMAC-SHA256, consulta a API via `Payment.get()`, atualiza a transação para `approved` e dispara `releaseVerifiedPaidConsultation()`.
3. A tela de retorno na AF Motos detecta a aprovação via polling e exibe o botão **"Visualizar Laudo Completo"**.

---

## 5. Validação Automatizada

Para validar a integridade do código e dos tipos:

```bash
# Validação de Tipos TypeScript
npm run typecheck

# Validação de Linting
npm run lint

# Execução de Testes Automatizados
npm test
```
