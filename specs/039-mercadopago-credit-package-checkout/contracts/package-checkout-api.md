# Contract: Package Checkout API (Client-facing)

## Início de Checkout de Pacote Comercial

`POST /api/cliente/credit-packages/[offerId]/checkout`

**Autenticação**: Requer sessão de cliente autenticada (`supabase.auth.getUser()`).

### Parâmetros de Rota
- `offerId`: UUID v4 da oferta comercial desejada.

### Request Body

```json
{
  "offerId": "550e8400-e29b-41d4-a716-446655440000",
  "idempotencyKey": "a9d72e40-5e36-4c22-b531-1555df319a71"
}
```

> [!IMPORTANT]
> O backend ignora sumariamente qualquer tentativa de envio de `price`, `discount`, `creditsQuantity`, `unitPrice` ou `currency` pelo cliente. O preço e os créditos são lidos estritamente do banco de dados na oferta ativa.

### Regras de Negócio e Validações
1. O usuário deve estar logado. Retorna `401 Unauthorized` se não autenticado.
2. A oferta deve existir no banco de dados. Retorna `404 Not Found` se inexistente.
3. A oferta deve ter `is_active = true`. Retorna `422 Unprocessable Entity` com código `OFFER_INACTIVE` se inativa.
4. A oferta NÃO pode ter `contact_only = true`. Retorna `422 Unprocessable Entity` com código `OFFER_REQUIRES_WHATSAPP` se for oferta customizada de WhatsApp.
5. Idempotência: se já existir uma ordem para este usuário com esta `idempotencyKey` criada nos últimos 15 minutos com status `pending`, o backend reutiliza a ordem existente e sua preferência em vez de criar duplicata.

### Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "orderId": "770e8400-e29b-41d4-a716-446655440022",
  "transactionId": "880e8400-e29b-41d4-a716-446655440033",
  "preferenceId": "123456789-abcdef-1234-5678",
  "redirectUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456789-abcdef-1234-5678",
  "environment": "production"
}
```

### Respostas de Erro

```json
// Tentativa de compra de pacote customizado WhatsApp via checkout automático
{
  "success": false,
  "error": "Este pacote é sob medida e requer negociação direta pelo WhatsApp.",
  "code": "OFFER_REQUIRES_WHATSAPP"
}

// Pacote inativo
{
  "success": false,
  "error": "Esta oferta não está mais disponível para compra.",
  "code": "OFFER_INACTIVE"
}
```
