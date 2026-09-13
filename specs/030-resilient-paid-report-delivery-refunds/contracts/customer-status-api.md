# Contract: Customer Status API

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Contract Type**: HTTP API Route Handler  
**Location**: `app/api/mp/transactions/[transactionId]/status/route.ts`

---

## 1. Get Transaction & Delivery Status

Retorna o estado consolidado e sanitizado para acompanhamento da consulta pelo cliente autenticado.

- **Endpoint**: `GET /api/mp/transactions/[transactionId]/status`
- **Autenticação**: Sessão de usuário autenticado (proprietário ou admin).

### Payload de Resposta (JSON)

#### Caso 1: Pagamento Aprovado e Laudo Pronto (`completed`)
```json
{
  "success": true,
  "transactionId": "d3b07384-d113-40e9-a5c9-9405626be4f1",
  "consultationId": "9c1c4f52-8255-46b0-9b48-18e0d6bc9f01",
  "status": "approved",
  "statusDetail": "accredited",
  "consultationStatus": "completed",
  "paymentStatus": "paid",
  "reportAvailable": true,
  "reportUrl": "/cliente/consultas/9c1c4f52-8255-46b0-9b48-18e0d6bc9f01",
  "retryable": false,
  "nextAction": "view_report",
  "customerTitle": "Seu laudo está disponível",
  "customerMessage": "Seu laudo veicular foi gerado com sucesso e já está liberado para visualização."
}
```

#### Caso 2: API Brasil em Retry Transitório (`retry_scheduled`)
```json
{
  "success": true,
  "transactionId": "d3b07384-d113-40e9-a5c9-9405626be4f1",
  "consultationId": "9c1c4f52-8255-46b0-9b48-18e0d6bc9f01",
  "status": "approved",
  "statusDetail": "accredited",
  "consultationStatus": "retry_scheduled",
  "paymentStatus": "paid",
  "reportAvailable": false,
  "retryable": true,
  "nextAction": "wait",
  "customerTitle": "Preparando seu Laudo",
  "customerMessage": "Estamos enfrentando uma instabilidade temporária para preparar seu laudo. Nossa equipe já está acompanhando; tentaremos novamente automaticamente em instantes."
}
```

#### Caso 3: Falha Definitiva com Estorno Solicitado (`refund_pending`)
```json
{
  "success": true,
  "transactionId": "d3b07384-d113-40e9-a5c9-9405626be4f1",
  "consultationId": "9c1c4f52-8255-46b0-9b48-18e0d6bc9f01",
  "status": "approved",
  "statusDetail": "accredited",
  "consultationStatus": "refund_pending",
  "paymentStatus": "paid",
  "reportAvailable": false,
  "retryable": false,
  "nextAction": "contact_support",
  "customerTitle": "Consulta Indisponível",
  "customerMessage": "Não foi possível concluir sua consulta neste momento devido a uma indisponibilidade nas bases oficiais. Solicitamos o estorno integral do seu pagamento."
}
```

#### Caso 4: Estorno Confirmado (`refunded`)
```json
{
  "success": true,
  "transactionId": "d3b07384-d113-40e9-a5c9-9405626be4f1",
  "consultationId": "9c1c4f52-8255-46b0-9b48-18e0d6bc9f01",
  "status": "refunded",
  "statusDetail": "refunded",
  "consultationStatus": "refunded",
  "paymentStatus": "refunded",
  "reportAvailable": false,
  "retryable": false,
  "nextAction": "contact_support",
  "customerTitle": "Pagamento Estornado",
  "customerMessage": "Seu pagamento foi estornado integralmente. O prazo para o valor constar depende do método de pagamento e da instituição financeira."
}
```
