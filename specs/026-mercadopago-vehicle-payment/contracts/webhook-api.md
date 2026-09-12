# Webhook API Contract: Mercado Pago Notifications

**Feature**: `026-mercadopago-vehicle-payment`  
**Date**: 2026-09-12  

---

## 1. Route Definition

- **Path**: `/api/webhooks/mercadopago`
- **Method**: `POST`
- **Authentication**: HMAC-SHA256 signature in `x-signature` header using `MERCADO_PAGO_WEBHOOK_SECRET`

---

## 2. Request Headers & Parameters

### Headers:
- `x-signature`: e.g. `ts=1710000000,v1=5d...`
- `x-request-id`: e.g. `c08d98d2-5712-40f9-a2e6-c1be01c5f3e9`
- `content-type`: `application/json`

### Query Parameters (Standard MP):
- `data.id`: ID of the resource (e.g. payment ID `1234567890`)
- `type`: `payment`

### Payload Example:
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2026-09-12T12:00:00Z",
  "id": 1054321,
  "live_mode": false,
  "type": "payment",
  "user_id": "1234567"
}
```

---

## 3. Server Processing Lifecycle

```text
1. Read raw body & headers (x-signature, x-request-id).
2. Extract data.id from URL query or body payload.
3. If secret configured, verify HMAC signature:
   - Invalid signature -> Return HTTP 401 Unauthorized, record event with signature_valid=false.
4. Record incoming event in `webhook_events` with idempotency check (event_id/mp_resource_id).
5. If type != 'payment' -> Return HTTP 200 OK (ignored).
6. Fetch payment details from Mercado Pago API (`Payment.get({ id: data.id })`).
7. Match external_reference (consultationId) or transaction_id in database.
8. If payment status is 'approved':
   - If consultation already completed -> Return HTTP 200 OK.
   - If not yet completed -> Trigger vehicle lookup workflow.
   - If lookup succeeds -> Mark completed.
   - If lookup fails -> Trigger auto-refund via Mercado Pago SDK.
9. Return HTTP 200 OK.
```

---

## 4. Response Codes

- `200 OK`: Webhook received and processed / queued.
- `400 Bad Request`: Missing resource ID or malformed payload.
- `401 Unauthorized`: Invalid HMAC signature.
- `500 Internal Server Error`: Transient database or network failure (Mercado Pago will retry).
