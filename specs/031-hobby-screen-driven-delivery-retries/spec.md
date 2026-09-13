# Feature Specification: Resilient Paid Report Delivery without Frequent Cron (Screen-Driven Retries & Safe Refund)

**Feature**: Hotfix de entrega resiliente de laudo veicular sem dependência de cron frequente na Vercel Hobby  
**Branch**: `fix/hobby-screen-driven-delivery-retries`  
**Base**: `master`  
**Date**: 2026-09-13  
**Status**: Implemented

---

## 1. Problem Statement & Motivation

Na PR #8, foi implementado o desacoplamento do pagamento aprovado via Mercado Pago da busca veicular na API Brasil por meio de uma fila persistida no PostgreSQL (`consultation_delivery_jobs`) e um Vercel Cron executando a cada minuto (`* * * * *`).

Contudo, a conta Vercel do projeto opera no plano **Vercel Hobby**, cuja política estrita de deploy rejeita qualquer cron com frequência maior do que uma vez por dia (bloqueando expressões como `* * * * *` e `*/5 * * * *`). O deploy foi recusado pela Vercel.

### Solução Arquitetural Oficial (Hotfix)

1. **Remoção total de crons frequentes do `vercel.json`** para permitir o deploy imediato e limpo na Vercel Hobby.
2. **Primeira tentativa imediata e desacoplada**: Ao confirmar o pagamento no webhook ou reconciliação, o job persistido é criado atomicamente e executado na mesma hora (tentativa #1). Se tiver cache no banco, conclui instantaneamente (`cache_hit`).
3. **Retentativa guiada pela presença em tela (*Screen-Driven Delivery*)**:
   - Se a API Brasil apresentar falha transitória (timeout, 5xx, rate limit 429), o job é salvo como `retry_scheduled` com timestamp futuro `next_retry_at` (1m, 5m, 15m, 30m; máx 5 tentativas).
   - O cliente na página `/cliente/pagamento/retorno/[transactionId]` ou em "Minhas Consultas" visualiza status amigável ("Estamos enfrentando instabilidade temporária. Você não precisa pagar novamente").
   - Enquanto a tela estiver aberta, o frontend efetua chamada autenticada a `POST /api/cliente/consultas/[consultationId]/process-delivery` **apenas quando `next_retry_at` for atingido**, com timer único, rate-limit de segurança e locks atômicos no PostgreSQL.
4. **Estorno Seguro e Automático (*Zero Prejuízo ao Cliente*)**:
   - Se a API Brasil apresentar falha definitiva (ex: saldo insuficiente, token inválido, ou 5 tentativas esgotadas), o job transita para `failed_permanent`.
   - O backend inicia estorno total idempotente no Mercado Pago (`PaymentRefund.total({ payment_id })`) usando exclusivamente `mp_payment_id`.
   - O estorno é reconciliado sob demanda sempre que o cliente ou o administrador consultar o status.
5. **Zero Fila em Memória / Zero `setTimeout` no Servidor**: O banco de dados PostgreSQL (Supabase) continua sendo a única fonte de verdade e idempotência.

---

## 2. Requisitos Funcionais & Regras de Negócio

### RF-01: Remoção de Cron Incompatível
- O arquivo `vercel.json` não deve conter nenhum cron com frequência inferior a 24 horas. Para eliminar qualquer risco de rejeição no deploy da Vercel Hobby, os agendamentos da feature são removidos de `vercel.json`.

### RF-02: Transição de Estados Persistidos Monotônicos
- `payment_transactions`: `pending` -> `approved` -> `refunded`. Nunca permite downgrade de `approved` para `pending`.
- `customer_plate_consultations`: `pending` -> `paid` / `approved_pending_report` -> `retry_scheduled` -> `completed` | `failed_permanent` -> `refund_pending` -> `refunded`.
- `consultation_delivery_jobs`: `pending` -> `processing` -> `retry_scheduled` -> `completed` | `failed_permanent`.
- `payment_refunds`: `none` -> `requested` -> `pending` -> `confirmed` | `failed`.

### RF-03: Processamento Inicial Imediato
- Webhook ou Reconciliação confirmam pagamento -> atualizam transação para `approved` -> registram `mp_payment_id` real -> criam job de entrega no Supabase -> executam tentativa #1 imediatamente em background não-bloqueante.
- Webhook responde com HTTP 200/201 sem travar esperando resposta longa da API Brasil.

### RF-04: Endpoint do Cliente para Retry em Tela
- `POST /api/cliente/consultas/[consultationId]/process-delivery`
- Autenticado com sessão Supabase do cliente logado.
- Validação estrita de posse: apenas o proprietário da consulta pode acionar.
- Verifica elegibilidade no banco: pagamento deve ser `approved`, e estado do job não pode ser terminal (`completed`, `refund_pending`, `refunded`, `failed_permanent`).
- Validação de horário: se `Date.now() < next_retry_at`, rejeita a chamada ao provedor externo e retorna HTTP 200 informando `nextRetryAt` e status atual (`retry_not_due`).
- Lock atômico: se duas abas chamarem ao mesmo tempo, apenas uma ganha o lock com lease de expiração.

### RF-05: Comportamento do Frontend (UI/UX)
- Exibe mensagens claras para cada estado sem expor termos técnicos.
- Mantém único timer ativo agendado estritamente para `nextRetryAt`.
- Botão "Verificar Status": revalida o pagamento e, se elegível, aciona o endpoint de entrega.
- Botão "Falar com suporte no WhatsApp": mensagem pré-formatada sem chaves, tokens, CPF ou dados sensíveis.

### RF-06: Estorno Seguro no Mercado Pago
- Disparado em caso de erro permanente ou após 5 tentativas de retentativa.
- Requer `mp_payment_id` numérico oficial do Mercado Pago.
- Idempotência garantida pelo cabeçalho `X-Idempotency-Key` e tabela `payment_refunds`.
- Reconciliado automaticamente na visualização de status do cliente e no painel administrativo.
