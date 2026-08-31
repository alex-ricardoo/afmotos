# API & Interface Contracts: Contrato de Compra de Motocicleta

**Feature Directory**: `specs/019-contrato-compra-motocicleta`  
**Date**: 2026-08-31  

---

## 1. Endpoints Administrativos

### 1.1 `POST /api/admin/purchase-agreements/generate`

Emite um novo Contrato de Compra de Motocicleta com snapshot imutável, gera o PDF no Storage e retorna a URL assinada temporária.

- **Autenticação**: Obrigatória via Supabase Auth Cookie.
- **Autorização**: Restrita a administradores ativos (`public.is_admin()`).
- **Idempotência**: Suporta header `X-Idempotency-Key` e chave de geração única transacional.

#### Request Body
Veja a definição completa em [generate-purchase-agreement.schema.json](./generate-purchase-agreement.schema.json).

#### Success Response (`201 Created` / `200 OK`)
```json
{
  "success": true,
  "agreement_id": "8f3b2c1a-4e5d-6a7b-8c9d-0e1f2a3b4c5d",
  "agreement_number": "AFM-COMPRA-20260831-A1B2",
  "agreement_version": 1,
  "pdf_url": "https://<supabase-project>.supabase.co/storage/v1/object/sign/agreements/purchases/...",
  "expires_in": 3600,
  "created_at": "2026-08-31T13:00:00.000Z"
}
```

#### Error Responses
- **`400 Bad Request`**: Dados de entrada inválidos ou confirmações obrigatórias ausentes.
  ```json
  {
    "success": false,
    "error": "É obrigatório confirmar que o pagamento integral foi realizado ao vendedor.",
    "field": "confirmed_payment_realized"
  }
  ```
- **`401 Unauthorized`**: Usuário não autenticado.
- **`403 Forbidden`**: Usuário sem privilégios administrativos.
- **`409 Conflict`**: Tentativa de emissão concorrente com a mesma chave de idempotência.
- **`500 Internal Server Error`**: Falha no motor de PDF ou no upload do Storage.

---

### 1.2 `GET /api/admin/purchase-agreements/[id]/pdf`

Recupera ou regenera a partir do snapshot salvo a URL assinada para visualização/download do contrato.

- **Autenticação**: Obrigatória (Admin).
- **Parâmetro de URL**: `id` (UUID do contrato).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "agreement_id": "8f3b2c1a-4e5d-6a7b-8c9d-0e1f2a3b4c5d",
  "agreement_number": "AFM-COMPRA-20260831-A1B2",
  "pdf_url": "https://<supabase-project>.supabase.co/storage/v1/object/sign/agreements/purchases/...",
  "is_cached": true,
  "expires_in": 3600
}
```

---

## 2. Server Actions de Suporte

### 2.1 `preparePurchaseAgreementAction(input: PrepareInput)`
- **Função**: Agrega previamente os dados da moto (`motorcycles`), do vendedor (`customers` ou `sell_requests`), dados da loja (`site_settings`) e consulta de placa vinculada (`vehicle_plate_consultations`), retornando o payload pronto para conferência no modal administrativo.
