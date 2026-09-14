# Contract: Pricing Configuration API

**File**: `specs/037-vehicle-history-financial-accountant-reports/contracts/pricing-configuration-api.md`  
**Domain**: Configuração Administrativa de Preço e Custo do Histórico Veicular  

---

## 1. Helper Central Server-Side

### `getVehicleHistoryPricingConfig()`

Lê a versão ativa de precificação do banco de dados com fallback auditado e sanitização rigorosa.

```typescript
export interface VehicleHistoryPricingConfig {
  versionId: string;
  publicPriceCents: number;       // Ex: 3990 (R$ 39,90)
  apiBrasilLiveCostCents: number; // Ex: 3000 (R$ 30,00)
  currency: 'BRL';
  effectiveFrom: string;          // ISO 8601
  version: string | number;
  marginCents: number;            // publicPriceCents - apiBrasilLiveCostCents
  marginPercentage: number;
}
```

---

## 2. Server Action de Atualização de Preço e Custo

### `updateVehicleHistoryPricingAction`

Atualiza a configuração de precificação criando uma nova versão imutável em `vehicle_history_pricing_versions` e atualizando o snapshot em `site_settings.settings.vehicleHistory`.

#### Endpoint / Assinatura
```typescript
export async function updateVehicleHistoryPricingAction(
  payload: UpdateVehicleHistoryPricingInput
): Promise<UpdateVehicleHistoryPricingResult>;
```

#### Input Schema (Zod)
```typescript
export const updateVehicleHistoryPricingSchema = z.object({
  publicPrice: z
    .number({ required_error: 'Preço de venda é obrigatório.' })
    .positive('Preço de venda deve ser maior que zero.')
    .max(1000, 'Preço de venda não pode exceder R$ 1.000,00.'),
  apiBrasilLiveCost: z
    .number({ required_error: 'Custo da API Brasil é obrigatório.' })
    .nonnegative('Custo não pode ser negativo.')
    .max(500, 'Custo não pode exceder R$ 500,00.'),
  changeReason: z
    .string()
    .max(500, 'Motivo deve ter no máximo 500 caracteres.')
    .optional(),
  effectiveImmediately: z.boolean().default(true),
});

export type UpdateVehicleHistoryPricingInput = z.infer<typeof updateVehicleHistoryPricingSchema>;
```

#### Output
```typescript
export interface UpdateVehicleHistoryPricingResult {
  success: boolean;
  versionId?: string;
  publicPriceCents?: number;
  apiBrasilLiveCostCents?: number;
  marginCents?: number;
  effectiveFrom?: string;
  error?: string;
}
```

#### Regras de Negócio e Validações
1. **Autenticação**: Exige perfil ativo com role `admin` ou `super_admin` (`requireActiveAdmin()`).
2. **Atomicidade Transacional**: Em uma transação:
   - Marca a versão atual como `is_active = false` e `effective_to = now()`.
   - Insere a nova versão com `is_active = true` e `effective_from = now()`.
   - Sincroniza `site_settings.settings.vehicleHistory.price` com o novo preço público.
3. **Auditoria**: Registra evento `vehicle_history_pricing.updated` em `consultation_audit_logs`.
4. **Imutabilidade**: Consultas passadas já finalizadas permanecem vinculadas à `pricing_version_id` anterior e mantêm seus snapshots intactos.
