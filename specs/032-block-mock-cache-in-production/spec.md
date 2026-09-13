# Feature Specification: Impedir Reutilização de Laudo Mock em Compras Reais de Produção

**Feature**: Bloqueio de Cache Mock em Produção, Elegibilidade Estrita de Cache, Validação de Laudo Oficial e Reprocessamento Seguro  
**Branch**: `fix/block-mock-cache-in-production`  
**Base**: `fix/hobby-screen-driven-delivery-retries` (ou `master`)  
**Data**: 2026-09-13  
**Status**: Specified / In Implementation  

---

## 1. Contexto do Problema & Incidente

### O Incidente
Em produção, a aplicação confirmou corretamente o pagamento aprovado via Mercado Pago para uma consulta veicular paga, porém entregou ao cliente um laudo fictício/mock contendo dados como:
- **Marca**: Marca Fictícia
- **Modelo**: SUV Conceito Flex
- **Placa**: PFX3G12

**Identificadores do Incidente:**
- `transactionId`: `edaf3e59-fb2e-48ee-aa0d-c652bfedd886`
- `paymentId`: `177868720379`
- `consultationId`: `1c633982-c4a7-4692-a08a-517689f9449d`
- `sourceConsultationId` reutilizado: `4b6f3e33-ce83-43a6-b146-fc27b9b3d129`

### Causa Raiz Identificada
1. **Cache Fallback Indevido**: A função `findExistingConsultation(plate, supabase)` em `lib/vehicle-lookup/service.ts` realizava busca com `order('mode', { ascending: false })`. Quando inexiste uma consulta prévia com `mode = 'live'`, a ordenação retorna o registro com `mode = 'mock'` (`is_mock = true`).
2. **Ausência de Guarda de Ambiente/Mock no Worker de Entrega**: O executor do job de entrega (`executeSingleDeliveryJob` em `lib/vehicle-delivery/delivery-service.ts`) validava apenas se `cached && cached.status === 'COMPLETED' && cached.raw_response`. Não havia checagem se o registro era mock nem se o ambiente era uma compra real em produção.
3. **Persistência Acidental de Mock**: O snapshot do mock foi copiado para `customer_plate_consultations.vehicle_data` e o status foi marcado como `completed`.
4. **UI Sem Validação de Autenticidade do Laudo**: O componente `CustomerVehicleDetail` exibia incondicionalmente os selos "Laudo Oficial Emitido" e "Base Senatran" e permitia download de PDF como "Laudo Oficial", mesmo com `dto.is_mock === true`.

---

## 2. Objetivos Principais

1. **Garantia Absoluta Zero Mock em Produção Paga**: Compras reais em produção nunca recebem dados mock, fixture ou simulados.
2. **Reutilização Segura de Cache Live**: Cache autêntico concluído da API Brasil (`is_mock = false`, `mode = 'live'`, `provider = 'apibrasil'`) continua sendo reutilizado para economizar custos e entregar instantaneamente.
3. **Rejeição Explícita de Cache Mock**: Qualquer cache mock encontrado durante entrega de compra real em produção é explicitamente rejeitado com evento estruturado `vehicle_delivery.cache_rejected` (`reasonCode: 'MOCK_CACHE_IN_PRODUCTION'`) e auditoria, prosseguindo imediatamente para chamada live da API Brasil.
4. **Guarda de Configuração do Ambiente**: Se a Vercel Production estiver com `VEHICLE_LOOKUP_MODE=mock` ou sem `APIBRASIL_TOKEN`, o sistema bloqueia a entrega do mock, aciona falha permanente de configuração (`APIBRASIL_MOCK_MODE_IN_PRODUCTION`), notifica via log/alerta interno e aciona o estorno automático idempotente sem lesar o cliente.
5. **Verificação de Selo Oficial na UI e no PDF**: Os selos "Laudo Oficial Emitido", "Base Senatran" e o download de PDF oficial só são exibidos quando `status = 'completed'`, `payment_status = 'paid'` e `is_mock = false`. Se for mock em ambiente não-produção/teste, exibe badge "Dados de demonstração" e bloqueia selo oficial.
6. **Reprocessamento Seguro e Idempotente**: Rotina sem alteração manual destrutiva via SQL para reprocessar a consulta `1c633982-c4a7-4692-a08a-517689f9449d` (`transactionId: edaf3e59-fb2e-48ee-aa0d-c652bfedd886`), limpando o vínculo mock, chamando a API Brasil live e entregando o laudo oficial autêntico ou estornando se a API falhar.

---

## 3. Requisitos Funcionais & Regras de Negócio

### RF-01: Função Pura de Elegibilidade de Cache (`isCacheEntryEligibleForPaidProduction`)
Deve existir uma função pura e deterministicamente testável:
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
```

**Regras Estritas de Elegibilidade**:
- Se `runtimeEnvironment === 'production'` ou `isPaidTransaction === true`:
  - `cacheRecord` deve existir.
  - `cacheRecord.status === 'COMPLETED'`.
  - `cacheRecord.is_mock === false`.
  - `cacheRecord.mode === 'live'` (ou equivalente não-mock).
  - `cacheRecord.provider === 'apibrasil'`.
  - `cacheRecord.raw_response` deve ser um objeto JSON não vazio, sem indicativo de fixture/mock (`message !== 'Consulta simulada (Mock Fallback)'` e sem flags de mock no payload).
  - Se houver TTL configurado, não pode estar expirado.
- Se qualquer condição for violada, retorna `eligible: false` com o código de razão correspondente.
- Se o cache for mock em ambiente pago/produção, retorna `eligible: false`, `reasonCode: 'MOCK_CACHE_IN_PRODUCTION'`, `nextAction: 'CALL_LIVE_PROVIDER'`.

### RF-02: Consulta de Cache no Banco (`findExistingConsultation`)
- A função `findExistingConsultation(plate, supabase, options?)` deve aceitar a opção `{ requireLiveOnly?: boolean }`.
- Quando `requireLiveOnly === true`:
  - Filtra explicitamente `.eq('is_mock', false)`.
  - Filtra `.eq('mode', 'live')`.
  - Nunca retorna registros mock, mesmo que sejam os únicos existentes para a placa.

### RF-03: Fluxo de Entrega no Worker (`executeSingleDeliveryJob`)
Ao processar um job de entrega para compra paga:
1. Buscar cache com preferência estrita por registros live (`findExistingConsultation(plate, adminDb, { requireLiveOnly: true })` ou validação imediata via `isCacheEntryEligibleForPaidProduction`).
2. Se cache for encontrado e for elegível:
   - Registrar log `vehicle_delivery.cache_hit`.
   - Copiar snapshot `raw_response` para `customer_plate_consultations.vehicle_data`.
   - Vincular `source_consultation_id`.
   - Marcar `customer_plate_consultations.status = 'completed'` e `job.status = 'completed'`.
   - Registrar auditoria `delivery_cache_hit`.
3. Se cache for encontrado mas NÃO for elegível (ex: mock em produção):
   - Registrar log `vehicle_delivery.cache_rejected` com `reasonCode: 'MOCK_CACHE_IN_PRODUCTION'`, IDs mascarados e `nextAction: 'CALL_LIVE_PROVIDER'`.
   - Registrar auditoria `cache_mock_rejected_in_production`.
   - **NÃO copiar dados para o cliente.**
   - **NÃO marcar como completed.**
   - Avançar para a chamada live da API Brasil.
4. Se nenhum cache for encontrado:
   - Registrar log `vehicle_delivery.cache_miss`.
   - Avançar para a chamada live da API Brasil.

### RF-04: Guarda de Configuração de Produção
- Se `process.env.VERCEL_ENV === 'production'`:
  - O sistema valida se `VEHICLE_LOOKUP_MODE` está configurado como `live` e se `APIBRASIL_TOKEN` está presente.
  - Se `config.mode === 'mock'` em produção paga:
    - O sistema **NUNCA** executa fixture de demonstração para o cliente pago.
    - O job falha com `failureCode: 'APIBRASIL_MOCK_MODE_IN_PRODUCTION'` e `failureClass: 'permanent'`.
    - Dispara estorno total automático idempotente no Mercado Pago.
    - Emite alerta estruturado nos logs para a equipe de infraestrutura/desenvolvimento.

### RF-05: Regras de UI e Emissão de Selo Oficial
- Componente `CustomerVehicleDetail`:
  - **Condição para Selo Oficial**:
    ```ts
    const isOfficialReport =
      consultation.status === 'completed' &&
      consultation.payment_status === 'paid' &&
      dto?.is_mock === false &&
      dto?.mode === 'live';
    ```
  - Se `isOfficialReport === true`:
    - Exibe badge esmeralda pulsante: `"Laudo Oficial Emitido"`.
    - Exibe badge dourado: `"Base Senatran"`.
    - Exibe botão: `"Baixar Laudo Oficial PDF"`.
  - Se `dto?.is_mock === true`:
    - Exibe badge âmbar/cinza: `"Dados de demonstração (Ambiente de Teste)"`.
    - **NÃO exibe** `"Laudo Oficial Emitido"`.
    - **NÃO exibe** `"Base Senatran"`.
    - O botão de PDF exibe `"Baixar Prévia de Demonstração"`.
- Endpoint de PDF (`/api/cliente/consultas/[id]/pdf/route.ts`):
  - Verifica autenticidade antes da compilação do documento.
  - Em ambiente de produção (`process.env.VERCEL_ENV === 'production'`), se a consulta tiver `is_mock === true`, bloqueia o download oficial com status HTTP 403 (`"Laudo oficial indisponível para registros simulados em produção"`).

### RF-06: Procedimento de Reprocessamento da Consulta Afetada
- Desenvolver rotina segura (CLI script idempotente / endpoint de manutenção protegido):
  - Transação `edaf3e59-fb2e-48ee-aa0d-c652bfedd886` / Consulta `1c633982-c4a7-4692-a08a-517689f9449d`.
  - Confirma status `approved` no Mercado Pago.
  - Detecta que `vehicle_data` e `source_consultation_id` apontam para mock `4b6f3e33-ce83-43a6-b146-fc27b9b3d129`.
  - Invalida a associação do mock na consulta do cliente (`vehicle_data = null`, `source_consultation_id = null`, `status = 'processing'`).
  - Cria/ativa job de entrega para reexecutar live na API Brasil.
  - Se a chamada live obtiver sucesso: persiste resultado oficial, vincula novo ID live e conclui.
  - Se falhar definitivamente: executa estorno idempotente no Mercado Pago.
  - Mantém histórico integral de auditoria sem deleções destrutivas.

---

## 4. Requisitos Não-Funcionais & Segurança

1. **Privacidade e Redação de Segredos**: Nunca registrar em logs ou em campos de auditoria: `APIBRASIL_TOKEN`, `MERCADO_PAGO_ACCESS_TOKEN`, headers de autorização ou payloads brutos contendo segredos.
2. **Idempotência**: Reprocessamentos concorrentes ou múltiplas tentativas de tela nunca devem duplicar chamadas à API Brasil nem disparar estornos duplicados no Mercado Pago.
3. **Isolamento Server-Side**: Nenhuma chamada à API Brasil ocorre no cliente/navegador. Toda resolução de dados veiculares é estritamente realizada em Serverless Functions / Route Handlers do Next.js.
4. **Compatibilidade Vercel Hobby**: Zero dependência de crons frequentes no `vercel.json`.
