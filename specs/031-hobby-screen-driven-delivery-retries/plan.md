# Implementation Plan: Screen-Driven Delivery Retries & Safe Refunds (Vercel Hobby)

**Feature**: Hotfix de entrega sem cron frequente, retry orientado à tela e estorno seguro  
**Branch**: `fix/hobby-screen-driven-delivery-retries`  
**Date**: 2026-09-13

---

## 1. Contexto e Justificativa

A Vercel Hobby rejeita `crons` com frequência inferior a 1 dia. A arquitetura passa a depender de:
1. Primeira tentativa imediata server-side ao aprovar o pagamento.
2. Retry em tela (*Screen-Driven*) acionado pelo cliente com lock persistido e verificação estrita de `next_retry_at`.
3. Verificação sob demanda ("Verificar Status" e abertura de tela).
4. Ação administrativa com auditoria completa.
5. Reconciliação sob demanda de estorno.

---

## 2. Fases de Execução

### Fase 1: Limpeza do Deploy da Vercel (`vercel.json`)
- Remover expressões de cron com frequência < 1 dia do `vercel.json` (deixar vazio ou sem cron para conformidade 100% com Vercel Hobby).

### Fase 2: Reutilização do Schema de Dados Existente
- Reutilizar as tabelas criadas na PR #8: `consultation_delivery_jobs`, `payment_refunds`, `customer_plate_consultations` e `consultation_audit_logs`.
- Nenhuma migration destrutiva adicional necessária.

### Fase 3: Endpoint de Processamento do Cliente em Tela
- Criar rota autenticada `POST /api/cliente/consultas/[consultationId]/process-delivery`.
- Validações: autenticação Supabase, ownership da consulta, status do pagamento `approved`, elegibilidade de horário (`next_retry_at`), rate-limit e lock atômico.

### Fase 4: Integração no Frontend (`payment-return-status.tsx`)
- Gerenciar timer para disparar `process-delivery` exatamente em `nextRetryAt`.
- Atualizar botão "Verificar Status".
- Implementar mensagens transparentes ao cliente.
- Botão de WhatsApp com mensagem sanitizada.

### Fase 5: Observabilidade e Auditoria
- Logs estruturados `[CHECKOUT_PRO]`, `[VEHICLE_DELIVERY]` e `[PAYMENT_REFUND]`.
- Alerta explícito de saldo insuficiente para administradores.

### Fase 6: Validação de Testes e Build
- Criar testes unitários para o endpoint do cliente e regras de retry em tela.
- Executar `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.
