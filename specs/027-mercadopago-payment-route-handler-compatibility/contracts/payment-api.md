# Contract: Payment Processing API

**Route**: `POST /api/mp/process-payment`  
**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  

---

## 1. Descrição do Endpoint

Endpoint HTTP seguro responsável por receber a submissão do Payment Brick (token de cartão de crédito), validar os dados, verificar a propriedade da consulta no banco de dados e acionar a criação do pagamento junto ao Mercado Pago via adapter configurado (`v2` ou `v3`).

---

## 2. Autenticação & Autorização

- **Método de Autenticação**: Sessão de usuário via cookies do Supabase Auth.
- **Autorização**: O usuário autenticado deve ser o proprietário da consulta (`customer_plate_consultations.user_id === user.id`).
- **Status Permitido da Consulta**: `pending_payment`.

---

## 3. Especificação do Request

### Headers
```http
POST /api/mp/process-payment
Content-Type: application/json
```

### Body Payload
```json
{
  "consultationId": "26f22f28-1f47-4773-bd14-f0814af16de9",
  "token": "95a6b0c2a8c084f7b4931a0b33b934c9",
  "paymentMethodId": "master",
  "issuerId": 25,
  "installments": 1,
  "payer": {
    "identification": {
      "type": "CPF",
      "number": "12345678909"
    }
  },
  "clientObservability": {
    "tokenCreatedAt": 1726176500000,
    "tokenHashTruncated": "95a6b0c2",
    "submitAttemptNumber": 1
  }
}
```

### Campos Proibidos no Request (Rejeitados por Zod / Ignorados)
- `transaction_amount` / `amount` / `price` (preço é determinado exclusivamente pelo servidor)
- `currency`
- `status`
- `userId`
- `mp_payment_id`
- `access_token`

---

## 4. Especificação das Respostas

### 4.1 Sucesso - Pagamento Aprovado (200 OK)
```json
{
  "success": true,
  "transactionId": "5c9b7405-2423-4556-91e8-6e54f9a39dfa",
  "paymentId": "98765432101",
  "status": "approved",
  "statusDetail": "accredited",
  "consultationStatus": "completed"
}
```

### 4.2 Sucesso Parcial - Pagamento Pendente / Em Análise (200 OK)
```json
{
  "success": false,
  "pending": true,
  "transactionId": "5c9b7405-2423-4556-91e8-6e54f9a39dfa",
  "paymentId": "98765432101",
  "status": "pending",
  "message": "Seu pagamento está em análise pela operadora do cartão. Assim que for confirmado, o laudo será liberado automaticamente."
}
```

### 4.3 Recusa de Cartão (400 Bad Request)
```json
{
  "success": false,
  "retryable": true,
  "transactionId": "5c9b7405-2423-4556-91e8-6e54f9a39dfa",
  "status": "rejected",
  "statusDetail": "cc_rejected_insufficient_amount",
  "message": "Pagamento não aprovado pela emissora do cartão. Verifique os dados ou utilize outro cartão."
}
```

### 4.4 Erro Técnico do Provedor (502 Bad Gateway / 500)
```json
{
  "success": false,
  "retryable": true,
  "transactionId": "5c9b7405-2423-4556-91e8-6e54f9a39dfa",
  "status": "provider_error",
  "message": "Não foi possível processar o pagamento com a operadora no momento. Nenhuma cobrança foi confirmada. Por favor, tente novamente em instantes."
}
```

### 4.5 Não Autorizado (401 Unauthorized)
```json
{
  "success": false,
  "error": "Sessão não encontrada ou expirada. Faça login para continuar."
}
```
