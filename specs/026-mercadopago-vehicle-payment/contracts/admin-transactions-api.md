# Admin Transactions API Contract: Vehicle Consultation Auditing

**Feature**: `026-mercadopago-vehicle-payment`  
**Date**: 2026-09-12  

---

## 1. Overview
Server queries and actions for the `/admin/transacoes-consultas` admin section. Accessible only to authenticated active administrators.

---

## 2. Admin Server Queries

### 2.1 `getAdminPaymentTransactions(params)`
Lists and filters transactions with customer details and lifecycle metrics.

**Parameters**:
```typescript
{
  page?: number;        // default: 1
  pageSize?: number;    // default: 20
  search?: string;      // search by plate, email, or MP payment ID
  status?: string;      // 'all' | 'pending' | 'approved' | 'rejected' | 'refunded'
  refundStatus?: string;// 'all' | 'none' | 'pending' | 'refunded' | 'failed'
  startDate?: string;   // ISO date
  endDate?: string;     // ISO date
}
```

**Returns**:
```typescript
{
  transactions: Array<{
    id: string;
    consultation_id: string;
    user_id: string;
    customer_email: string;
    customer_name?: string;
    plate: string;
    mp_payment_id: string;
    payment_method_id: string;
    payment_type_id: string;
    transaction_amount: number;
    status: string;
    status_detail: string;
    refund_status: string;
    refund_amount?: number;
    refund_reason?: string;
    created_at: string;
    updated_at: string;
  }>;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalRevenue: number;
    approvedCount: number;
    pendingCount: number;
    refundedCount: number;
    failedRefundsCount: number;
  };
}
```

---

## 3. Admin Server Actions

### 3.1 `retryPaymentRefund(transactionId, reason)`
Manually triggers a refund retry for a transaction where auto-refund failed.

**Request**:
```typescript
{
  transactionId: string;
  reason?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  refundId?: string;
  error?: string;
}
```

---

### 3.2 `reconcilePaymentWithMercadoPago(mpPaymentId)`
Forces a direct status lookup against Mercado Pago API for an unconfirmed or desynced transaction and syncs database records.

**Request**:
```typescript
{
  mpPaymentId: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  updatedStatus: string;
  consultationProcessed: boolean;
  error?: string;
}
```
