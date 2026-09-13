# Especificação: Correção de Refund após Falha de Provedor e Diagnóstico Mercado Pago

## 1. Contexto e Problema
Quando a API Brasil retorna erro `402 Payment Required` (classificado como `APIBRASIL_INSUFFICIENT_CREDITS`), o laudo veicular não pode ser emitido.
O sistema classifica o erro como definitivo e aciona o estorno automático integral no Mercado Pago.
No entanto, no incidente da transação `4c8e1227-293b-41a7-a3f4-f3f0437f8e46` (`mp_payment_id: 177874977077`), a chamada de refund gerou o log:
`[initiateRefundForFailedDelivery] Erro ao chamar Mercado Pago refund: [object Object]`
sem persistência do status de erro real, sem envio do cabeçalho `X-Idempotency-Key` e sem reconciliação via lista de refunds do Mercado Pago.

## 2. Requisitos Obrigatórios
1. **Serialização Defensiva de Erros**:
   - Criar `serializeMercadoPagoError(error: unknown): SafeProviderError`.
   - Extrair `errorName`, `errorMessage`, `httpStatus`, `apiCode`, `causeCode`, `causeMessage`, `retryable`, `requestIdMasked`.
   - Sanitizar qualquer token ou dado sensível.
   - Nunca emitir `[object Object]`.
2. **Elegibilidade Central**:
   - `evaluateRefundEligibility` com checagem de pagamento aprovado, laudo não entregue, ausência de refund ativo/confirmado e motivo permanente.
   - Para `APIBRASIL_INSUFFICIENT_CREDITS`, registrar tag de suporte `support_action_required = RECHARGE_APIBRASIL`.
3. **Idempotência**:
   - Passar `idempotencyKey` determinística (`buildRefundIdempotencyKey`) nas `requestOptions` do SDK do Mercado Pago.
   - Garantir que apenas 1 refund ativo exista por transação.
4. **Reconciliação Aprofundada**:
   - Consultar o pagamento e a lista de refunds do Mercado Pago (`refundClient.list`).
   - Endpoint `POST /api/mp/transactions/[transactionId]/refund/reconcile`.
5. **Interface do Cliente**:
   - Exibir com precisão os 4 estados de refund: Solicitado, Pendente, Confirmado, Falha/Manual Review.
   - Suporte WhatsApp sem expor segredos ou falhas internas de saldo.
6. **Ferramenta de Recuperação Segura**:
   - Script CLI `scripts/reprocess-failed-refund.ts` com `--transaction` e `--dry-run`.
