# Contract: Cache Eligibility for Paid Production Vehicle Deliveries

---

## Assinatura da Função

```ts
export interface CacheEligibilityParams {
  runtimeEnvironment: 'production' | 'preview' | 'development' | 'test';
  cacheRecord: {
    id?: string;
    status: string;
    is_mock?: boolean | null;
    mode?: string | null;
    provider?: string | null;
    raw_response?: Record<string, unknown> | null;
    consulted_at?: string | null;
  } | null | undefined;
  isPaidTransaction?: boolean;
  ttlSeconds?: number;
}

export interface CacheEligibilityResult {
  eligible: boolean;
  reasonCode?:
    | 'MOCK_CACHE_IN_PRODUCTION'
    | 'UNKNOWN_CACHE_ORIGIN'
    | 'INVALID_PROVIDER'
    | 'INCOMPLETE_RESULT'
    | 'EXPIRED_CACHE'
    | 'STATUS_NOT_COMPLETED'
    | 'NO_RECORD';
  nextAction: 'CALL_LIVE_PROVIDER' | 'USE_CACHE' | 'MANUAL_REVIEW';
}

export function isCacheEntryEligibleForPaidProduction(
  params: CacheEligibilityParams
): CacheEligibilityResult;
```

---

## Matriz de Decisão

| Ambiente | Pago? | Status Cache | is_mock | mode | provider | Resultado | reasonCode | nextAction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `production` | Sim | `COMPLETED` | `false` | `live` | `apibrasil` | `eligible: true` | - | `USE_CACHE` |
| `production` | Sim | `COMPLETED` | `true` | `mock` | `apibrasil` | `eligible: false`| `MOCK_CACHE_IN_PRODUCTION` | `CALL_LIVE_PROVIDER` |
| `production` | Sim | `COMPLETED` | `null` | `unknown` | `apibrasil` | `eligible: false`| `UNKNOWN_CACHE_ORIGIN` | `CALL_LIVE_PROVIDER` |
| `production` | Sim | `COMPLETED` | `false` | `live` | `mock` | `eligible: false`| `INVALID_PROVIDER` | `CALL_LIVE_PROVIDER` |
| `production` | Sim | `FAILED` | `false` | `live` | `apibrasil` | `eligible: false`| `STATUS_NOT_COMPLETED` | `CALL_LIVE_PROVIDER` |
| `production` | Sim | `null` | - | - | - | `eligible: false`| `NO_RECORD` | `CALL_LIVE_PROVIDER` |
| `development`| Não | `COMPLETED` | `true` | `mock` | `apibrasil` | `eligible: true` | - | `USE_CACHE` |
