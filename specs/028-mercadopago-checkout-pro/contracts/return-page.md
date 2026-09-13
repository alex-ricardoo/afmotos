# UI & Route Contract: Customer Return Page

**Route**: `GET /cliente/pagamento/retorno/[transactionId]`  
**Rendering**: Next.js App Router (Server Component + Client Status Poller)  
**Authentication**: Mandatory (Supabase Session)  

---

## 1. Descrição

Página receptora para onde o cliente é redirecionado após interagir com o ambiente de pagamento hospedado do Mercado Pago Checkout Pro (`back_urls`).

---

## 2. Parâmetros de Entrada

### Parâmetros de Rota (Path Params)
- `transactionId`: `string` (UUID da transação interna em `payment_transactions`)

### Parâmetros de Consulta (Query Params - Informativos Apenas)
O Mercado Pago pode anexar parâmetros na URL de retorno como:
- `collection_id`: ID do pagamento
- `collection_status`: Status (`approved`, `pending`, `rejected`)
- `external_reference`: ID interno enviado na preferência
- `payment_type`: Método (`credit_card`, `bank_transfer`, etc.)
- `merchant_order_id`
- `preference_id`
- `result`: `success | pending | failure`

> **REGRA DE SEGURANÇA CRÍTICA**: Os parâmetros de query acima são estritamente considerados **não confiáveis**. A página NUNCA aprova o pagamento ou libera o laudo veicular com base em query params. Ela consulta exclusivamente o banco de dados oficial via API interna autenticada.

---

## 3. Estados Visuais da Interface

A página exibe 5 estados possíveis com design consistente ao sistema visual da AF Motos:

### 1. Pagamento Confirmado & Laudo Liberado (`approved` + `completed`)
- **Ícone**: Check verde (`CheckCircle2`).
- **Título**: "Pagamento Confirmado com Sucesso!"
- **Descrição**: "Sua consulta veicular da placa [PLACA] já está disponível para visualização completa."
- **Ação Principal**: Botão destacado "Visualizar Laudo Completo" direcionando para `/cliente/consultas/[consultationId]`.

### 2. Pagamento Confirmado & Laudo em Processamento (`approved` + `processing`)
- **Ícone**: Spinner animado (`Loader2`).
- **Título**: "Pagamento Confirmado! Gerando Laudo..."
- **Descrição**: "Recebemos a confirmação do seu pagamento. Estamos consultando as bases oficiais de dados do veículo. Isso leva apenas alguns instantes."
- **Ação**: Polling ativo a cada 3 segundos (máximo de 15 tentativas).

### 3. Aguardando Confirmação do Provedor (`pending` / `in_process`)
- **Ícone**: Relógio em tom âmbar (`Clock` / `AlertCircle`).
- **Título**: "Aguardando Confirmação do Pagamento"
- **Descrição**: "Se você pagou via Pix ou Boleto, a compensação pode levar alguns instantes ou horas. Assim que confirmada, seu laudo será liberado automaticamente."
- **Ação**: Polling lento (a cada 5 segundos durante 60 segundos) + botão "Atualizar Status" + link para "Minhas Consultas".

### 4. Pagamento Não Autorizado ou Cancelado (`rejected` / `cancelled`)
- **Ícone**: Alerta vermelho (`XCircle`).
- **Título**: "Pagamento Não Concluído"
- **Descrição**: "A operadora ou o meio de pagamento não autorizou a transação. Nenhuma cobrança foi efetuada."
- **Ação Principal**: Botão "Tentar Novamente" (que redireciona para a página de pagamento para criar uma nova preferência segura) + link de suporte WhatsApp.

### 5. Transação Não Encontrada ou Não Pertence ao Usuário (Erro 404/403)
- **Mensagem Amigável**: "Não foi possível localizar esta transação. Verifique suas consultas na área do cliente."
- **Ação**: Botão "Voltar para Minhas Consultas".

---

## 4. Mecanismo de Sondagem (Polling)

- O componente cliente executa chamadas para `GET /api/mp/transactions/[transactionId]/status`.
- **Intervalo inicial**: 3 segundos.
- **Limite de tentativas**: 10 iterações (30 segundos).
- **Condição de parada**: Estado terminal atingido (`approved` com laudo, `rejected`, `cancelled`) ou timeout atingido.
- Se o timeout for atingido em estado `pending`, interrompe as requisições automáticas e exibe o botão "Verificar Novamente".
