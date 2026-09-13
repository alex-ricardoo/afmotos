# Checklist de Tarefas: Hotfix Refund Seguro e Diagnóstico Mercado Pago

---

## Fase 1: Serializador Defensivo de Erros do Mercado Pago
- [x] 1.1 Criar `lib/mercadopago/error-serializer.ts` com `serializeMercadoPagoError` e tipos `SafeProviderError`.
- [x] 1.2 Implementar sanitização defensiva contra tokens, headers de autorização e objetos circulares/vazios.
- [x] 1.3 Criar testes unitários em `lib/mercadopago/__tests__/error-serializer.test.ts` cobrindo todos os cenários.

## Fase 2: Motor Central de Elegibilidade e Idempotência de Refund
- [x] 2.1 Atualizar `evaluateRefundEligibility` em `lib/mercadopago/refund-service.ts` com validações completas e suporte a flag `RECHARGE_APIBRASIL`.
- [x] 2.2 Atualizar `initiateRefundForFailedDelivery` para repassar `requestOptions: { idempotencyKey }` ao SDK do Mercado Pago.
- [x] 2.3 Implementar logging estruturado padronizado `[PAYMENT_REFUND]` para todo o ciclo de vida do refund.
- [x] 2.4 Atualizar `reconcileSingleRefund` para consultar `refundClient.list({ payment_id })` e mapear `mp_refund_id` e status real.

## Fase 3: Endpoint de Reconciliação e Trilha de Auditoria
- [x] 3.1 Criar endpoint `POST /api/mp/transactions/[transactionId]/refund/reconcile`.
- [x] 3.2 Proteger o endpoint com autenticação de sessão e autorização (proprietário ou admin).
- [x] 3.3 Garantir auditoria atômica em `consultation_audit_logs`.

## Fase 4: Experiência do Cliente (UX & Mensagens)
- [x] 4.1 Atualizar `app/api/mp/transactions/[transactionId]/status/route.ts` para fornecer dados dos 4 estados obrigatórios.
- [x] 4.2 Atualizar `components/customer/payment-return-status.tsx` com mensagens claras e suporte WhatsApp seguro.

## Fase 5: Ferramenta de Recuperação Operacional da Transação Real
- [x] 5.1 Criar `scripts/reprocess-failed-refund.ts` com suporte a `--dry-run` e execução segura no backend.
- [x] 5.2 Testar a execução em modo `--dry-run`.

## Fase 6: Validação Completa da Suíte
- [x] 6.1 Executar `npm test`.
- [x] 6.2 Executar `npm run typecheck`.
- [x] 6.3 Executar `npx eslint` nos arquivos modificados.
- [x] 6.4 Executar `npm run build`.
