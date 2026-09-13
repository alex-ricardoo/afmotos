# Quickstart: Resilient Delivery & Safe Refunds

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Date**: 2026-09-13

---

## 1. Configuração de Variáveis de Ambiente

No arquivo `.env.local` (desenvolvimento) e no painel da Vercel (produção):

```env
# Provedor de Consulta Veicular
VEHICLE_LOOKUP_MODE=live
APIBRASIL_TOKEN=seu_token_aqui
APIBRASIL_BASE_URL=https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits

# Provedor de Pagamento
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui
MERCADO_PAGO_APP_URL=https://afmotos.vercel.app
MERCADO_PAGO_WEBHOOK_URL=https://afmotos.vercel.app/api/webhooks/mercadopago

# Agendador Serverless & Crons
CRON_SECRET=super_secret_cron_token_min_32_chars
```

> [!IMPORTANT]
> Em produção (`process.env.VERCEL_ENV === 'production'`), `VEHICLE_LOOKUP_MODE` deve ser obrigatoriamente `live`. Se estiver configurado como `mock`, o sistema detectará anomalia operacional e recusará entregar relatórios simulados a clientes pagantes.

---

## 2. Configuração do Vercel Cron (`vercel.json`)

Adicione as rotas de cron ao arquivo de configuração do projeto:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-delivery-jobs",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/reconcile-pending-refunds",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 3. Disparo e Teste Local das Rotas de Cron

Para simular o Vercel Cron em ambiente de desenvolvimento local:

```bash
# 1. Processar lote de jobs de entrega
curl -X POST http://localhost:3000/api/cron/process-delivery-jobs \
  -H "Authorization: Bearer super_secret_cron_token_min_32_chars"

# 2. Reconciliar estornos pendentes
curl -X POST http://localhost:3000/api/cron/reconcile-pending-refunds \
  -H "Authorization: Bearer super_secret_cron_token_min_32_chars"
```

---

## 4. Verificação de Funcionamento

1. **Simular Pagamento Aprovado**:
   - Inicie o pagamento pelo Checkout Pro.
   - Ao receber o webhook `payment.updated` com status `approved`, observe nos logs:
     `[VEHICLE_DELIVERY] {"event": "vehicle_delivery.job_created", ...}`
2. **Observar o Processamento**:
   - O worker processa o laudo imediatamente via trigger assíncrono ou pelo cron tick seguinte.
   - Se a placa já existir no banco, o log indicará:
     `[VEHICLE_DELIVERY] {"event": "vehicle_delivery.cache_hit", ...}`
   - O laudo é instantaneamente liberado na tela `/cliente/pagamento/retorno/[transactionId]`.
3. **Simular Falha de Saldo**:
   - Se a API Brasil retornar saldo insuficiente, observe:
     `[VEHICLE_DELIVERY] {"event": "vehicle_delivery.failed_permanent", "failureCode": "APIBRASIL_INSUFFICIENT_CREDITS"}`
     `[PAYMENT_REFUND] {"event": "payment_refund.request_started", ...}`
   - A tela do cliente informará com delicadeza a indisponibilidade e o estorno em andamento.
