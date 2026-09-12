# Research: Mercado Pago Integration for Vehicle Plate Consultation

**Feature**: `026-mercadopago-vehicle-payment`  
**Date**: 2026-09-12  
**Status**: Completed  

---

## 1. Executive Summary & Architectural Decisions

This document consolidates research and design decisions for replacing the simulated payment in the customer area with a real **Mercado Pago Payment Brick (SDK v2)** integration, secure HMAC webhook validation, server-side idempotency, automatic refund on consultation lookup failure, and admin transaction auditing.

### Key Architectural Tenets:
1. **Server-authoritative pricing**: The frontend never dictates the consultation price. Price is fetched canonically from system settings (`site_settings` / `getVehicleConsultationPrice()`).
2. **Double verification on Webhook**: When Mercado Pago fires a webhook notification (`x-signature` header), the server validates the HMAC SHA-256 signature, parses the `data.id`, queries the Mercado Pago API directly (`/v1/payments/{id}`) using the server-side SDK, and checks that `transaction_amount` matches the database record.
3. **Idempotency & Concurrency Safety**: All incoming webhook events and client status queries are deduplicated using database unique constraints (`mp_payment_id`, `idempotency_key`, `webhook_events.event_id`).
4. **Resilient Failure Handling with Auto-Refund**: If payment succeeds (`status: approved`) but vehicle consultation fails (external provider outage, timeout, zero balance), the system records the failure and immediately triggers an automatic refund via Mercado Pago API (`/v1/payments/{id}/refunds`), notifying the customer with clear messaging and WhatsApp support fallback.
5. **Admin Reconciler & Auditing**: A dedicated admin panel at `/admin/transacoes-consultas` enables admins to audit transactions, filter by customer/plate/status, view detailed lifecycle timelines, and manually retry refunds or reconcile orphaned payments.

---

## 2. Mercado Pago SDK & Payment Brick Architecture

### 2.1 Frontend: Payment Brick
Mercado Pago's Payment Brick provides a modular, pre-built, PCI-compliant UI component that handles:
- Credit / Debit Cards (with tokenization done directly on MP servers)
- Pix (with QR Code generation and copy-paste key)
- Boleto Bancário (when applicable)

#### SDK Integration:
- Client-side loader: `@mercadopago/sdk-react` or `initMercadoPago(publicKey, { locale: 'pt-BR' })`
- Script tag: `https://sdk.mercadopago.com/js/v2`
- Initialization parameters:
  - `amount`: Retrieved from server session / consultation endpoint
  - `callbacks`:
    - `onReady`: UI loading state finished
    - `onSubmit`: Passes the generated card token / payment form data to our server action (`/api/payments/process` or server action)
    - `onError`: Surfaces localized user-friendly errors

### 2.2 Backend: Official SDK (`mercadopago`)
The official Node.js SDK `mercadopago` (v2.x) will be used server-side:
```typescript
import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 10000 }
});

const payment = new Payment(client);
const refund = new PaymentRefund(client);
```

---

## 3. Webhook Security & HMAC SHA-256 Verification

Mercado Pago sends webhook notifications with HMAC authentication via request headers:
- `x-signature`: Composed of `ts=<timestamp>,v1=<hash>`
- `x-request-id`: Unique request ID

### Signature Verification Algorithm:
```typescript
import crypto from 'crypto';

export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  if (!params.xSignature || !params.secret) return false;

  const parts = params.xSignature.split(',');
  let ts = '';
  let v1 = '';

  for (const part of parts) {
    const [key, val] = part.trim().split('=');
    if (key === 'ts') ts = val;
    if (key === 'v1') v1 = val;
  }

  if (!ts || !v1) return false;

  // Manifest string template according to Mercado Pago specs:
  // "id:<data.id_url_param>;request-id:<x-request-id_header>;ts:<ts_header>;"
  const manifest = `id:${params.dataId};request-id:${params.xRequestId || ''};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', params.secret).update(manifest).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
}
```

---

## 4. Refund (Estorno) Strategy & State Machine

### 4.1 Trigger Conditions
An automatic refund is triggered if and only if:
1. Payment status is `approved`
2. Vehicle lookup execution throws an error, times out, or returns a permanent provider failure
3. Consultation is NOT already marked as `completed`

### 4.2 Refund Execution Flow
```text
[Payment Approved]
       ↓
[Trigger Plate Lookup Service]
       ↓
   [Success?]
    ├── YES → [Save Vehicle Data] → [Mark Consultation Completed] → [Notify Client]
    └── NO  → [Catch Error] 
                ↓
              [Trigger MP Refund API (PaymentRefund.create)]
                ↓
            [Refund Success?]
              ├── YES → [Mark Payment Status 'refunded'] → [Customer sees auto-refund message]
              └── NO  → [Mark Status 'refund_failed'] → [Flag for Admin Manual Reconciliation]
```

---

## 5. Mock vs. Live Orchestration for Vehicle Lookup

Vehicle consultation mode is controlled via existing environment variables:
- `VEHICLE_LOOKUP_MODE=mock|live`
- `VEHICLE_LOOKUP_API_TOKEN=...`

When testing in sandbox / staging:
- Mercado Pago credentials operate in Test / Sandbox mode
- Vehicle lookup can operate in `mock` mode (returning fixed mock data from `lib/vehicle-lookup/fixtures/mock-plate-response.json`) or `live` mode without coupling payment state to the mock provider.
- Test failure simulations can be triggered via a designated test plate (e.g. `ERR9999` or mock error flag) to verify the automatic refund mechanism end-to-end.

---

## 6. Audit & Admin Oversight

All operations are recorded in structured tables:
1. `payment_transactions`: Tracks individual payment attempts, Mercado Pago payment ID, payer email, method, amounts, and refund status.
2. `webhook_events`: Stores raw webhook payloads, verification results, timestamps, and processing logs.
3. `consultation_audit_logs`: Detailed timeline of all state transitions (initiated, payment_created, payment_approved, lookup_started, lookup_failed, refund_initiated, refund_completed).

---

## 7. Migration from Simulated Payments

- Existing records in `payment_simulations` remain intact as historical records.
- The UI `/cliente/pagamento/[consultationId]` is updated to render the Payment Brick instead of the simulation radio buttons.
- A fallback "Simular Pagamento (Dev Mode)" button is available ONLY when `NODE_ENV === 'development'` and `ENABLE_DEV_PAYMENT_SIMULATION === 'true'`.
