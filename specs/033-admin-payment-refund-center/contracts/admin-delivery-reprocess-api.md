# Contrato de API: Reprocessamento de Entrega de Laudo

## 1. Rota
`POST /api/admin/payments/[transactionId]/reprocess`

## 2. Autenticação e Autorização
- **Nível**: `admin` ou `super_admin` ativo em `admin_profiles`.

---

## 3. Esquema de Requisição (Zod Validation)

```ts
import { z } from 'zod';

export const AdminReprocessRequestSchema = z.object({
  confirmProviderFunded: z.boolean().default(false),
  adminNote: z.string().trim().max(300).optional(),
});

export type AdminReprocessRequest = z.infer<typeof AdminReprocessRequestSchema>;
```

---

## 4. Regras de Elegibilidade e Bloqueio

O reprocessamento é **estritamente rejeitado** caso qualquer uma das seguintes condições ocorra:
1. A transação não estiver com status `approved`.
2. O laudo veicular já tiver sido concluído e disponibilizado ao cliente.
3. Houver qualquer estorno em andamento ou confirmado (`requested`, `pending`, `confirmed`) para a transação.
4. O job de entrega estiver com processamento ativo em execução (`status = 'processing'` com lock válido).
5. O erro anterior for `APIBRASIL_INSUFFICIENT_CREDITS` e `confirmProviderFunded` for falso.

---

## 5. Respostas

### 5.1. Sucesso: Laudo Emitido com Sucesso (HTTP 200 OK)

```json
{
  "success": true,
  "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
  "consultationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "completed",
  "message": "Laudo veicular consultado e disponibilizado com sucesso ao cliente."
}
```

### 5.2. Sucesso: Enfileirado para Execução Assíncrona (HTTP 202 Accepted)

```json
{
  "success": true,
  "transactionId": "4c8e1227-293b-41a7-a3f4-f3f0437f8e46",
  "consultationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "processing",
  "message": "Job de reprocessamento iniciado e em andamento."
}
```

### 5.3. Erro: Falta Confirmação de Saldo (HTTP 400 Bad Request)

```json
{
  "success": false,
  "error": "É necessário confirmar que a conta da API Brasil possui saldo recarregado antes de reprocessar.",
  "code": "PROVIDER_FUNDS_NOT_CONFIRMED"
}
```

### 5.4. Erro: Inelegível por Estorno em Andamento (HTTP 422 Unprocessable Entity)

```json
{
  "success": false,
  "error": "Não é permitido reprocessar uma entrega que possui estorno solicitado ou confirmado.",
  "code": "REPROCESS_BLOCKED_BY_REFUND"
}
```
