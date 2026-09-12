# Quickstart Guide: Mercado Pago Vehicle Consultation Payment

**Feature**: `026-mercadopago-vehicle-payment`  
**Date**: 2026-09-12  

---

## 1. Environment Variables Setup

Ensure the following variables are defined in `.env.local`:

```env
# Mercado Pago Sandbox / Live Credentials
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
MERCADO_PAGO_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Development fallback toggle (Optional, default false)
ENABLE_DEV_PAYMENT_SIMULATION=false
```

---

## 2. Testing Payment Flow in Sandbox

1. Navigate to `/cliente/login` and log in with a test customer account.
2. In the customer dashboard (`/cliente`), enter a test plate (e.g. `ABC1D23` or `BRA2E19`).
3. Proceed to the payment screen: `/cliente/pagamento/[consultationId]`.
4. The Mercado Pago Payment Brick will render.
5. Use Mercado Pago test credit card credentials or Pix:
   - **Pix**: Choose Pix option, click Pay, copy the test Pix code or QR simulation.
   - **Card**: Use official Mercado Pago test cards (e.g. Master/Visa test cards provided in MP developer docs with test CPF).
6. Upon approval, observe immediate redirection to the consultation results page with verified vehicle data.

---

## 3. Testing Automatic Refund on Failure

1. Configure mock lookup failure or enter a test error plate configured to throw an exception in mock mode.
2. Complete a test payment.
3. Observe:
   - Vehicle lookup failure is caught.
   - Auto-refund is triggered against Mercado Pago sandbox API.
   - UI informs the customer that the service is temporarily unavailable and that their payment was refunded, displaying the WhatsApp support button.
   - Check `/admin/transacoes-consultas` to verify that the transaction is marked with `refund_status: 'refunded'`.

---

## 4. Testing Webhook Locally (ngrok / loco)

1. Expose local Next.js server:
   ```bash
   npx ngrok http 3000
   ```
2. Set webhook URL in Mercado Pago Dashboard:
   `https://your-ngrok-url.ngrok-free.app/api/webhooks/mercadopago`
3. Trigger test webhook notifications or perform an async Pix payment to confirm receipt and HMAC validation.
