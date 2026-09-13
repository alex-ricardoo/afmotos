# Runbook Operacional: Incident Response & Reprocessamento de Consultas

---

## 1. Identificação de Sintomas de Reutilização de Mock

Se um cliente reportar dados veiculares contendo `"Marca Fictícia"` ou `"SUV Conceito Flex"` ou os logs apresentarem:
```text
vehicle_delivery.cache_hit
sourceConsultationId: <id de consulta antiga mock>
```
Isso indica que uma consulta mock foi indevidamente reaproveitada para uma compra real.

---

## 2. Procedimento de Diagnóstico

1. Inspecionar o registro da consulta na tabela `customer_plate_consultations`:
   ```sql
   SELECT id, plate_normalized, status, payment_status, source_consultation_id
   FROM customer_plate_consultations
   WHERE id = '1c633982-c4a7-4692-a08a-517689f9449d';
   ```
2. Inspecionar a origem do laudo em `vehicle_plate_consultations`:
   ```sql
   SELECT id, mode, is_mock, provider, consulted_at, brand, model
   FROM vehicle_plate_consultations
   WHERE id = '4b6f3e33-ce83-43a6-b146-fc27b9b3d129';
   ```
   Se `is_mock = true`, a consulta foi afetada por reaproveitamento de cache mock.

---

## 3. Reprocessamento Seguro (Sem SQL Manual Destrutivo)

Executar o comando oficial de reprocessamento:
```bash
npx tsx scripts/reprocess-mocked-paid-consultation.ts edaf3e59-fb2e-48ee-aa0d-c652bfedd886
```

### O que o Script Executa:
1. Conecta-se ao banco via client administrativo (`createAdminClient`).
2. Verifica se o pagamento da transação está confirmado (`status = 'approved'`).
3. Limpa com segurança o campo `vehicle_data` e o `source_consultation_id` mock da consulta do cliente, alterando o status temporariamente para `processing`.
4. Dispara a chamada live à API Brasil (`executeVehiclePlateLookup` com `currentMode = 'live'`).
5. Se a API Brasil responder com sucesso:
   - Salva o laudo autêntico (`is_mock = false`, `mode = 'live'`).
   - Atualiza `customer_plate_consultations` com o laudo oficial.
   - Registra auditoria com evento `reprocess_live_provider_succeeded`.
6. Se a API Brasil falhar de forma permanente (ex: sem saldo ou erro 4xx):
   - Transita para `failed_permanent`.
   - Inicia o estorno total automático no Mercado Pago.
   - Registra auditoria com evento `reprocess_refund_initiated`.

---

## 4. Comunicação com o Cliente

Enquanto o reprocessamento ocorre:
- O cliente visualiza a tela `/cliente/consultas/[id]` com o status de processamento ativo ("Compilando histórico e laudo oficial...").
- Nenhum laudo mock é exibido.
- Se concluído com sucesso, o cliente passa a visualizar o laudo oficial autêntico emitido pela base Senatran.
- Se ocorrer estorno, o cliente visualiza o aviso de reembolso aprovado e o comprovante do estorno.
