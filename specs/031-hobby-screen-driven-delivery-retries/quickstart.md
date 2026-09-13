# Quickstart: Screen-Driven Delivery Retries & Safe Refunds

## 1. Configuração do Repositório (Vercel Hobby)

Nenhum cron frequente deve existir no `vercel.json`. O arquivo `vercel.json` deve permanecer sem tarefas de cron para aceitação imediata de deploy:

```json
{
  "crons": []
}
```

## 2. Variáveis de Ambiente Necessárias

```env
# Mercado Pago (Checkout Pro e Refund)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=...

# Provedor Veicular (API Brasil Veículos Total)
VEHICLE_LOOKUP_MODE=live
APIBRASIL_TOKEN=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Testando o Fluxo de Entrega em Tela

1. **Aprovação de Pagamento**: O cliente conclui o pagamento no Checkout Pro do Mercado Pago.
2. **Redirecionamento**: O cliente retorna para `/cliente/pagamento/retorno/[transactionId]`.
3. **Primeira Tentativa Imediata**: O servidor processa o webhook/reconcile e cria o job. Se a API Brasil responder com sucesso ou houver cache, o laudo é entregue instantaneamente.
4. **Instabilidade Transitória**: Se a API Brasil der timeout ou rate-limit, o job entra em `retry_scheduled` com `next_retry_at`. A tela exibe aviso amigável e contador inteligente.
5. **Tentativa Orientada à Tela**: O frontend aguarda o horário exato de `next_retry_at` e aciona `POST /api/cliente/consultas/[consultationId]/process-delivery`.
6. **Estorno Automático**: Se o provedor retornar falta de saldo ou esgotar 5 tentativas, o status é alterado para `refund_pending` e o estorno é emitido no Mercado Pago via `mp_payment_id`.
