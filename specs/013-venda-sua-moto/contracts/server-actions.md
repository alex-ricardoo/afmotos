# Server Actions & API Contracts: Venda sua Moto

**Feature**: `013-venda-sua-moto`  
**Date**: 2026-08-23  
**Status**: Ready

## 1. `createSellRequestAction` (Estendida)

Server Action invocada ao submeter o formulário de `/venda-sua-moto`.

- **Arquivo**: `lib/actions/leads.ts`
- **Contexto de Execução**: Servidor Next.js (Node.js runtime)

### Request Payload

```typescript
export interface CreateSellRequestInput {
  name: string;
  phone: string;
  email?: string | null;
  brand: string;
  brand_id?: string | null;
  model: string;
  model_id?: string | null;
  year_manufacture: number;
  year_model: number;
  year_id?: string | null;
  fuel_id?: string | null;
  fuel_name?: string | null;
  color?: string | null;
  mileage?: number | null;
  desired_price?: number | null;
  state: 'PE';
  city: string;
  notes?: string | null;
  offer_percentage?: number | null; // ex: 85 (85%)
  fipe_code?: string | null;
  fipe_price?: number | null;
  fipe_reference_period?: string | null;
  fipe_snapshot?: Record<string, unknown> | null;
  images?: Array<{
    url: string;
    provider?: string;
    storage_path?: string | null;
    delete_url?: string | null;
  }>;
}
```

### Regras de Negócio e Validações Server-Side

1. **Validação Zod**: Executa `sellRequestSchema.parse(input)`. Se falhar, retorna `{ success: false, error: 'Dados inválidos.' }`.
2. **Recálculo Seguro da Proposta**:
   ```typescript
   let estimatedOffer: number | null = null;
   if (input.fipe_price && input.offer_percentage) {
     const clampedPercentage = Math.min(Math.max(input.offer_percentage, 50), 100);
     estimatedOffer = Number(((input.fipe_price * clampedPercentage) / 100).toFixed(2));
   }
   ```
3. **Forçar Status Inicial**:
   ```typescript
   status = 'NEW' // Ignora qualquer valor enviado pelo cliente
   ```
4. **Inserção em `sell_requests`**:
   - Salva colunas tipadas `offer_percentage`, `estimated_offer`, `fipe_price`, `fipe_code`, etc.
   - Grava bloco estruturado em `motorcycle_data.offer_simulation`.
5. **Inserção em `sell_request_images`**:
   - Persiste até 5 imagens vinculadas ao `sell_request_id`.
6. **Sincronização em `leads`**:
   - Cria registro com `type: 'SELL_MOTORCYCLE'`, `source: 'WEBSITE'` e metadados de simulação.
7. **Revalidação de Cache**:
   - `revalidatePath('/admin/propostas')`

### Response

```typescript
export type CreateSellRequestResult =
  | { success: true; sellRequestId: string; message: string }
  | { success: false; error: string; details?: Record<string, string[]> };
```

---

## 2. `uploadPublicSellRequestImageAction`

- **Arquivo**: `lib/actions/leads.ts`
- **Entrada**: `FormData` contendo campo `file`
- **Validações**: Tipo MIME (`image/jpeg`, `image/png`, `image/webp`), tamanho `<= 5MB`.
- **Saída**: `{ success: boolean; image?: UploadedImage; url?: string; error?: string }`
