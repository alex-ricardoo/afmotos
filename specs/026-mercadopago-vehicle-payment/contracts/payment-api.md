# Payment API Contract: Mercado Pago Vehicle Consultation

**Feature**: `026-mercadopago-vehicle-payment`  
**Date**: 2026-09-12  

---

## 1. Overview
Endpoints and Server Actions for processing payments using Mercado Pago Payment Brick in the Customer Area.

---

## 2. Server Actions & Routes

### 2.1 `createPaymentPreference(consultationId)`
Creates or retrieves the payment preference for a customer's consultation session, enforcing server-side price from settings.

**Request**:
```typescript
{
  consultationId: string; // UUID
}
```

**Response (Success - 200)**:
```typescript
{
  success: true,
  data: {
    preferenceId?: string,
    publicKey: string,
    amount: number, // BRL, e.g. 19.90
    consultationId: string,
    plate: string,
    payerEmail: string
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: "Consulta veicular não encontrada ou usuário não autenticado."
}
```

---

### 2.2 `processBrickPayment(formData)`
Processes the payload submitted by Mercado Pago Payment Brick (card token or pix transaction).

**Request Payload (from Payment Brick `onSubmit`)**:
```typescript
{
  consultationId: string;
  formData: {
    payment_method_id: string; // e.g. "master", "visa", "pix"
    transaction_amount?: number; // Ignored by server, recalculated canonically
    token?: string; // Card token for credit/debit
    installments?: number;
    payer: {
      email: string;
      identification?: {
        type: string;
        number: string;
      }
    }
  }
}
```

**Server Flow**:
1. Verify user session via `supabase.auth.getUser()`.
2. Fetch `customer_plate_consultations` record; verify ownership.
3. Fetch canonical price via `getVehicleConsultationPrice()`.
4. Call Mercado Pago API `Payment.create(...)` with:
   - `transaction_amount`: Canonical price
   - `token`: Brick token
   - `payment_method_id`: Brick payment method
   - `payer.email`: Authenticated user email
   - `external_reference`: `consultationId`
   - `metadata`: `{ consultation_id: consultationId, user_id: user.id }`
5. Store initial row in `payment_transactions` with status returned by MP.
6. If status is `approved`:
   - Trigger vehicle lookup execution via `executeVehiclePlateLookup(...)`.
   - On success: Update consultation to `completed` and return `{ status: 'approved', consultationId }`.
   - On failure: Trigger refund via `processAutoRefund(...)` and return `{ status: 'lookup_failed_refunded' }`.
7. If status is `pending` or `in_process` (e.g. Pix QR code generated):
   - Return `{ status: 'pending', qrCode: response.point_of_interaction?.transaction_data?.qr_code, qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 }`.

---

### 2.3 `getPaymentStatus(consultationId)`
Checks current status of a pending payment (polling or manual refresh button on client).

**Request**:
```typescript
{
  consultationId: string;
}
```

**Response**:
```typescript
{
  status: "pending" | "approved" | "rejected" | "refunded" | "completed",
  paymentStatus: "paid" | "unpaid" | "refunded" | "processing",
  lookupCompleted: boolean,
  errorMessage?: string
}
```
