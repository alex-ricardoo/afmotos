# Research & Technical Architecture Decisions

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Date**: 2026-09-13

---

## 1. Diagnóstico do Estado Atual do Código

Foi realizada uma análise profunda dos arquivos existentes na base:

| Componente | Comportamento Atual Identificado | Risco Operacional / Limitação |
|---|---|---|
| `app/api/webhooks/mercadopago/route.ts` | Valida HMAC, busca pagamento e chama `confirmAndProcessPaymentTransaction`. | Responde rápido, mas a chamada encadeada à API Brasil é síncrona dentro da request. |
| `lib/mercadopago/payment-processing-service.ts` | Se status for `approved`, invoca `releaseVerifiedPaidConsultation(transaction.id)`. | Acoplamento direto entre confirmação financeira e entrega veicular externa. |
| `lib/mercadopago/consultation-releaser.ts` | Executa `executeVehiclePlateLookup` síncrono. Em caso de erro, apenas grava `status = 'failed'` e `lookup_error_message`. | Se a API Brasil falhar ou demorar, não há retries, não há enfileiramento, não há estorno. O cliente pagou e fica sem laudo. |
| `lib/mercadopago/reconciliation-service.ts` | Reconciliação sob demanda repete o mesmo fluxo síncrono de liberação. | Se falhou anteriormente, não consegue reprocessar se `payment_status` já foi alterado para `paid`. |
| `lib/vehicle-lookup/service.ts` | Lança `InsufficientBalanceError` ou `InvalidTokenError`. Se timeout, lança erro após 120s. | Nenhum mecanismo consome esses erros para classificar transitório vs permanente de modo transacional. |
| `components/customer/payment-return-status.tsx` | Quando `status === 'approved'`, se `consultationStatus !== 'completed'`, exibe spinner infinito "Aprovado! Gerando laudo...". | O cliente fica preso na tela de espera para sempre caso a consulta tenha ido para `failed`. |
| `app/api/mp/transactions/[transactionId]/status/route.ts` | Retorna `reportAvailable = status === 'approved' && consultationStatus === 'completed'`. | Não mapeia estados intermediários como `retry_scheduled`, `refund_pending`, `refunded`. |
| `supabase/migrations/` | Não existe tabela de jobs (`consultation_delivery_jobs`) nem de refunds (`payment_refunds`). | Ausência de persistência durável de tarefas assíncronas. |

---

## 2. Decisões Arquiteturais

### Decisão 1: Desacoplamento Estrito entre Pagamento e Entrega
- **Problema**: O webhook do Mercado Pago tem timeout restrito (~5 a 10 segundos). A API Brasil pode levar até 120 segundos para responder ou entrar em timeout. Fazer chamada síncrona dentro do webhook causa `504 Gateway Timeout` na Vercel e reenvios agressivos do Mercado Pago.
- **Solução**: Quando o pagamento for `approved`, o webhook apenas:
  1. Atualiza a transação como `approved` e `customer_plate_consultations.payment_status = 'paid'`.
  2. Cria o job de entrega persistido em `consultation_delivery_jobs` com status `pending`.
  3. Dispara um gatilho de execução assíncrona não-bloqueante (fire-and-forget via fetch interno protegido ou Vercel Serverless background invocation).
  4. Responde HTTP 200 ao Mercado Pago em < 500 ms.

### Decisão 2: Motor de Processamento de Fila Durável (Vercel Serverless + Supabase RPC)
- **Opções avaliadas**:
  1. *Fila em memória (BullMQ / Redis)*: Exigiria hospedar e gerenciar instância Redis externa (Upstash/Redis Labs), custo adicional e ponto único de falha.
  2. *Processo contínuo em background (Daemon / Worker)*: Incompatível com a infraestrutura serverless da Vercel (onde funções são efêmeras e congeladas).
  3. *Vercel Cron + PostgreSQL Atomic Lease (Escolhido)*: 
     - Rota protegida `/api/cron/process-delivery-jobs` acionada a cada minuto pelo Vercel Cron.
     - O processamento de concorrência utiliza uma procedure PostgreSQL (`claim_delivery_job`) com `SELECT ... FOR UPDATE SKIP LOCKED`.
     - Permite que múltiplos workers paralelos processem lotes de jobs sem colisão, sem risco de consulta duplicada e sem custo de infraestrutura extra.

### Decisão 3: Classificação Estrita de Falhas (Transitórias vs. Permanentes)
- **Transitórias**:
  - Timeout de conexão, HTTP 408, 429, 500, 502, 503, 504, erro de DNS.
  - Ação: Agendar `next_retry_at` com fórmula: `now() + base_delay * 2^(attempt - 1) + jitter`.
- **Permanentes**:
  - HTTP 401/403 (token inválido/expirado).
  - Saldo insuficiente no gateway da API Brasil (`InsufficientBalanceError`).
  - Placa inexistente ou formato rejeitado definitivamente.
  - Modo Mock ativado em ambiente de Produção.
  - Ação: Interrupção imediata das chamadas; marcação de `failed_permanent`; criação atômica de ordem em `payment_refunds`.

### Decisão 4: Estorno Total no Mercado Pago via `mp_payment_id`
- **Regra**: O Mercado Pago não aceita devoluções por `preference_id`. O SDK oficial (`new PaymentRefund(mpConfig).total({ payment_id })`) requer o `mp_payment_id`.
- **Idempotência**: Cada transação possui um `idempotency_key` (UUID v4) gerado e persistido no banco. O cabeçalho `X-Idempotency-Key` é enviado em toda requisição de estorno.
- **Duas Fases**:
  - Requisição aceita: `refund_status = 'pending'`.
  - Confirmação autoritativa: Quando o webhook do Mercado Pago enviar evento `payment` com status `refunded`, ou quando a rota de reconciliação de refunds verificar `status: "refunded"`.

### Decisão 5: Higienização e Proteção de Dados Sensíveis
- Todos os logs passam por `lib/mercadopago/observability.ts` e `security.ts`.
- Nomes de credenciais e tokens nunca são interpolados em mensagens de erro ou logs estruturados.
- Se a API Brasil estiver sem saldo, o cliente recebe uma mensagem amigável de indisponibilidade geral com aviso de estorno. O suporte interno recebe alerta claro e explícito: *"Ação necessária: recarregar saldo da API Brasil"*.
