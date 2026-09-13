# Research & Root Cause Analysis: Mock Cache Reuse in Production

**Data**: 2026-09-13  
**Incidente**: Transação `edaf3e59-fb2e-48ee-aa0d-c652bfedd886` / Consulta `1c633982-c4a7-4692-a08a-517689f9449d`  

---

## 1. Como o Cache é Atualmente Consultado?

Na tabela `vehicle_plate_consultations`, o método de busca histórico era:
```ts
// lib/vehicle-lookup/service.ts (findExistingConsultation)
const { data, error } = await supabase
  .from('vehicle_plate_consultations')
  .select('*')
  .eq('plate_normalized', normalized)
  .in('status', ['COMPLETED'])
  .order('mode', { ascending: false }) // 'live' first
  .order('consulted_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Análise da Vulnerabilidade
- O SQL usa `.order('mode', { ascending: false })`. Em ordem alfabética decrescente:
  `'mock'` > `'live'`!
  **Atenção Crítica**: No PostgreSQL, a letra `'m'` vem DEPOIS da letra `'l'` no alfabeto!
  Logo:
  `'mock' > 'live'`!
  Portanto, `ORDER BY mode DESC` colocava `'mock'` PRIMEIRO, e não `'live'`!
  Mesmo que houvesse um registro live, o `'mock'` seria retornado primeiro se a ordenação estivesse em `DESC`!
  E se houvesse apenas o `'mock'`, ele era retornado como consulta válida.

---

## 2. Quais Colunas Indicam Mock/Live no Schema Atual?

Na tabela `vehicle_plate_consultations`:
- `mode`: tipo `text`, com restrição `CHECK (mode IN ('mock', 'live'))`.
- `is_mock`: tipo `boolean`, com `DEFAULT true`. Quando executado via API Brasil real, o service grava `is_mock: false`. Quando mock, grava `is_mock: true`.
- `provider`: tipo `text`, com `DEFAULT 'apibrasil'`.
- `raw_response`: `jsonb`, contendo a resposta integral. No caso de mock, contém `"message": "Consulta simulada (Mock Fallback)"` ou a fixture `vehicle-total.mock.json`.
- `status`: tipo `text`, com restrição `CHECK (status IN ('PENDING_CONFIRMATION', 'PROCESSING', 'COMPLETED', 'FAILED', 'CHARGE_STATUS_UNKNOWN'))`.

Na tabela `customer_plate_consultations`:
- `source_consultation_id`: chave estrangeira para `vehicle_plate_consultations(id)`.
- `vehicle_data`: snapshot JSONB copiado do `raw_response`.
- `status`: estado do ciclo de vida da consulta do cliente (`'completed'`, etc.).

---

## 3. Por que o Cache `4b6f3e33-ce83-43a6-b146-fc27b9b3d129` foi Considerado Elegível?

1. No banco de dados, o registro `4b6f3e33-ce83-43a6-b146-fc27b9b3d129` estava gravado com `status = 'COMPLETED'` e `mode = 'mock'`, `is_mock = true`.
2. O worker de entrega `executeSingleDeliveryJob` realizava a checagem:
   ```ts
   const cached = await findExistingConsultation(plateToLookup, adminDb);
   if (cached && cached.status === 'COMPLETED' && cached.raw_response) {
     logVehicleDeliveryEvent('cache_hit', ...);
     // copia dados e finaliza com completed!
   }
   ```
3. Não havia qualquer validação das propriedades `cached.is_mock` ou `cached.mode`.
4. Como `cached.status === 'COMPLETED'` era verdadeiro e havia um objeto `raw_response`, o código emitiu `vehicle_delivery.cache_hit` e copiou a fixture mock diretamente para a consulta de produção do cliente pagante!

---

## 4. Onde a UI Decide Mostrar “Laudo Oficial Emitido”?

No componente `components/customer/customer-vehicle-detail.tsx`:
```tsx
<div className="flex items-center gap-2">
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    Laudo Oficial Emitido
  </span>
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#c9a44c]/10 text-[#c9a44c] border border-[#c9a44c]/25">
    <Sparkles className="w-3 h-3" />
    Base Senatran
  </span>
</div>
```
Estes elementos estavam renderizados de forma estática e incondicional sempre que o DTO existia.
A correção exige que esses badges dependam estritamente de:
```ts
const isOfficialReport =
  consultation.status === 'completed' &&
  consultation.payment_status === 'paid' &&
  dto?.is_mock === false &&
  dto?.mode === 'live';
```

---

## 5. Como a API Brasil Live é Selecionada e Status da Vercel Production

Em `lib/vehicle-lookup/config.ts`:
```ts
const token =
  process.env.APIBRASIL_TOKEN ||
  process.env.API_BRASIL_TOKEN ||
  process.env.VEHICLE_LOOKUP_API_KEY ||
  null;

const modeEnv = (process.env.VEHICLE_LOOKUP_MODE || (token ? 'live' : 'mock')).toLowerCase().trim();
const mode: VehicleLookupMode = modeEnv === 'mock' ? 'mock' : 'live';
```

### Regra de Segurança para Produção
Na Vercel Production (`process.env.VERCEL_ENV === 'production'`), é imperativo:
- `VEHICLE_LOOKUP_MODE=live`
- `APIBRASIL_TOKEN` configurado e válido na Vercel (Production Environment Variables, Serverless Function).
Se `config.mode === 'mock'` em produção, o sistema nunca entrega mock para cliente pagante, interrompendo com `APIBRASIL_MOCK_MODE_IN_PRODUCTION` e efetuando estorno.
