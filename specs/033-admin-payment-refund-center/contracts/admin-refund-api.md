# Contrato de API: Estorno Administrativo Seguro

## 1. Rota
`POST /api/admin/payments/[transactionId]/refund`

## 2. Autenticação e Autorização
- **Nível**: `admin` ou `super_admin` ativo em `admin_profiles`.

---

## 3. Esquema de Requisição (Zod Validation)

```ts
import { z } from 'zod';

export const AdminRefundReasonEnum = z.enum([
  'APIBRASIL_INSUFFICIENT_CREDITS',
  'APIBRASIL_AUTH_ERROR',
  'APIBRASIL_CONFIGURATION_ERROR',
  'APIBRASIL_RETRIES_EXHAUSTED',
  'APIBRASIL_PROVIDER_UNAVAILABLE',
  'LAUDO_NAO_ENTREGAVEL',
  'DECISAO_MANUAL_SUPORTE',
  'OUTRO',
]);

export const AdminRefundRequestSchema = z
  .object({
    reasonCode: AdminRefundReasonEnum,
    adminNote: z.string().trim().max(500).optional(),
    confirmationText: z.literal('ESTORNAR', {
      errorMap: () => ({ message: 'A confirmação deve ser exatamente a palavra ESTORNAR em maiúsculas.' }),
    }),
  })
  .refine(
    (data) => {
      if (data.reasonCode === 'OUTRO') {
        return Boolean(data.adminNote && data.adminNote.length >= 10);
      }
      return true;
    },
    {
      message: 'A nota administrativa é obrigatória (mínimo 10 caracteres) quando o motivo for OUTRO.',
      path: ['adminNote'],
    }
  );

export type AdminRefundRequest = z.infer<typeof AdminRefundRequestSchema>;
```

---

## 4. Exemplo de Payload de Envio (JSON)

```json
{
  "reasonCode": "APIBRASIL_INSUFFICIENT_CREDITS",
  "adminNote": "Cliente solicitou estorno imediato após falha de saldo no provedor veicular.",
  "confirmationText": "ESTORNAR"
}
```

---

## 5. Respostas

### 5.1. Sucesso (HTTP 200 OK)

```json
{
  "success": true,
  "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
  "refundId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "providerRefundId": "123456789",
  "status": "confirmed",
  "amountCents": 4990,
  "currency": "BRL",
  "alreadyProcessed": false,
  "message": "Estorno integral de R$ 49,90 confirmado com sucesso pelo Mercado Pago."
}
```

### 5.2. Erro de Validação de Confirmação (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "A confirmação deve ser exatamente a palavra ESTORNAR em maiúsculas.",
  "code": "INVALID_CONFIRMATION"
}
```

### 5.3. Transação Inelegível (HTTP 422 Unprocessable Entity)

```json
{
  "success": false,
  "error": "Laudo veicular já concluído e entregue ao cliente; estorno cancelado.",
  "code": "REFUND_INELIGIBLE"
}
```

### 5.4. Estorno Duplicado Evitado (HTTP 409 Conflict)

```json
{
  "success": false,
  "refundId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "error": "Já existe uma solicitação de estorno em andamento para esta transação.",
  "code": "REFUND_ALREADY_ACTIVE"
}
```
