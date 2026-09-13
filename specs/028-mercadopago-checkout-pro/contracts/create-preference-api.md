# API Contract: Create Preference API

**Endpoint**: `POST /api/mp/checkout-pro/preferences`  
**Authentication**: Mandatory (Supabase Session Token / Cookie)  
**Role**: Authenticated Customer (Owner of consultation)  

---

## 1. Descrição

Cria uma preferência de pagamento hospedada no Mercado Pago Checkout Pro para uma consulta veicular pendente de pagamento do usuário autenticado.

---

## 2. Request

### Headers
```http
Content-Type: application/json
```

### Request Body
```json
{
  "consultationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### Validações de Entrada (Zod Schema)
```ts
import { z } from 'zod';

export const createPreferenceSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
});
```

### Parâmetros Estritamente Ignorados do Cliente
Se o cliente enviar `amount`, `unit_price`, `currency`, `userId`, `payerEmail`, `external_reference`, `back_urls` ou `notification_url`, esses campos são descartados imediatamente e derivados no servidor.

---

## 3. Fluxo de Execução no Servidor

1. Obter usuário autenticado via `createClient().auth.getUser()`.
2. Buscar a consulta veicular pelo `consultationId` e `user_id = user.id`.
   - Se não existir: retornar HTTP 404.
   - Se `status = 'completed'` ou `payment_status = 'paid'`: retornar HTTP 400 (`CONSULTATION_ALREADY_PAID`).
3. Buscar preço canônico oficial via `getVehicleConsultationPrice()`.
4. Verificar se já existe uma transação `pending` recente (criada nos últimos 15 min) com `mp_preference_id` válido para essa consulta.
   - Se existir e for válida: reutilizar a preferência para evitar duplicações.
   - Caso contrário: gerar novo registro em `payment_transactions` com status `pending`.
5. Construir o payload de preferência para o Mercado Pago via `Preference.create()` com:
   - `items`: 1 item com valor canônico e `currency_id: "BRL"`.
   - `payer`: e-mail do usuário autenticado.
   - `external_reference`: UUID da transação interna (`payment_transactions.id`).
   - `back_urls`: URLs de retorno apontando para `/cliente/pagamento/retorno/[transactionId]`.
   - `auto_return`: `"approved"`.
   - `notification_url`: URL pública HTTPS de webhook.
6. Atualizar `payment_transactions` com o `mp_preference_id`.
7. Retornar a URL de redirecionamento hospedada (`init_point` em produção ou `sandbox_init_point` em teste).

---

## 4. Response

### Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "transactionId": "d9887711-2233-4455-6677-8899aabbccdd",
  "preferenceId": "123456789-abcdef01-2345-6789-abcd-ef0123456789",
  "redirectUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789-abcdef01-2345-6789-abcd-ef0123456789",
  "environment": "test"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Usuário não autenticado."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Consulta veicular não encontrada ou não pertence a você."
}
```

#### 400 Bad Request (Consulta Já Paga)
```json
{
  "success": false,
  "error": "Esta consulta já foi paga e concluída.",
  "code": "CONSULTATION_ALREADY_PAID"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Não foi possível iniciar o checkout no momento. Tente novamente em instantes.",
  "code": "PREFERENCE_CREATION_FAILED"
}
```
*(Nenhum dado sensível ou stack trace é exposto no erro).*
