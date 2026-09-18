# Runbook Operacional: Checkout Pro para Pacotes de Créditos B2B

## 1. Visão Geral e Responsabilidades

Este documento orienta os operadores e administradores do sistema na operação diária, monitoramento, reconciliação manual e tratamento de incidentes relacionados à venda automatizada de pacotes de créditos B2B via Mercado Pago Checkout Pro.

---

## 2. Eventos de Log Estruturados e Observabilidade

O sistema emite eventos imutáveis com mascaramento automático de dados sensíveis (sem tokens, CPF ou números de cartão):

| Nome do Evento | Nível | Descrição |
|---|---|---|
| `credit_package.checkout_started` | INFO | Cliente iniciou o fluxo de compra de um pacote comercial. |
| `credit_package.order_created` | INFO | Ordem interna de compra criada com snapshot de preço e créditos. |
| `credit_package.preference_created` | INFO | Preferência criada no Mercado Pago com `external_reference = order.id`. |
| `credit_package.payment_pending` | INFO | Pagamento gerado no gateway e aguardando liquidação. |
| `credit_package.payment_approved` | INFO | Webhook ou reconciliação confirmou aprovação autoritativa. |
| `credit_package.grant_started` | INFO | Início da concessão atômica dos créditos para o cliente. |
| `credit_package.granted` | INFO | Créditos liberados com sucesso e lançados no livro contábil. |
| `credit_package.grant_duplicate_prevented`| WARN | Tentativa de concessão redundante bloqueada com segurança. |
| `credit_package.amount_mismatch` | ERROR | Valor pago no provedor diverge do preço canônico do pedido. |
| `credit_package.reconcile_started` | INFO | Início de reconciliação manual ou periódica. |
| `credit_package.refund_started` | WARN | Solicitação de estorno de pacote iniciada. |
| `credit_package.refund_confirmed` | WARN | Estorno confirmado com revogação total de créditos não usados. |
| `credit_package.refund_manual_review` | ERROR | Estorno solicitado para pacote com consumo parcial de créditos. |

---

## 3. Diagnóstico e Resolução de Problemas Comuns

### 3.1 Cliente relata que pagou, mas os créditos não foram liberados

**Causa Provável**:
1. O webhook do Mercado Pago atrasou ou sofreu timeout transitório de rede.
2. O cliente fechou a aba antes do retorno e a notificação está na fila de retentativas do gateway.

**Procedimento de Diagnóstico**:
1. Acesse o Painel Administrativo em `/admin/pagamentos` ou `/admin/configuracoes/pacotes-consultas`.
2. Localize o pedido pelo nome/e-mail do cliente ou pelo `external_reference` (ID da ordem).
3. Verifique o status da ordem e o status da transação em `payment_transactions`.
4. Clique no botão **"Reconciliar com Mercado Pago"**.
   - O backend buscará o pagamento oficial no Mercado Pago.
   - Se estiver `approved` e o valor coincidir, a RPC `grant_credit_package_from_paid_order` será executada imediatamente.
   - O saldo do cliente será atualizado e um evento `reconciliation_payment_confirmed` será gravado no log.
5. Confirme com o cliente a visualização do novo saldo.

---

### 3.2 Alerta de Divergência de Valor (`amount_mismatch`)

**Causa Provável**:
Tentativa de pagamento fora do padrão ou configuração alterada incorretamente.

**Procedimento**:
1. Não force a liberação manual sem verificar a transação na conta oficial do Mercado Pago.
2. Acesse o console do Mercado Pago e confirme o valor líquido e bruto cobrado.
3. Se houver divergência real por falha operacional, ajuste via concessão administrativa manual justificando a auditoria.

---

### 3.3 Tratamento de Solicitação de Estorno (Refund)

**Regra Operacional**:
1. **Pacote Sem Nenhum Uso** (`credits_remaining == credits_granted`):
   - O administrador pode aprovar o estorno no painel.
   - O sistema emite o reembolso via API do Mercado Pago, cancela o pacote, deduz os créditos do saldo disponível e registra a revogação no ledger contábil.
2. **Pacote com Uso Parcial** (`credits_remaining < credits_granted`):
   - O sistema bloqueia o estorno automático.
   - O pacote é colocado em `manual_review`.
   - O operador deve calcular os laudos já consumidos (preço unitário avulso) e decidir junto à diretoria se fará estorno parcial (pro-rata) via console do Mercado Pago ou transferência bancária.
   - NUNCA exclua laudos já emitidos do histórico do cliente.

---

## 4. Auditoria e Rotação de Credenciais

- Em caso de vazamento suspeito de chaves:
  1. Revogue o `MERCADOPAGO_ACCESS_TOKEN` no painel do desenvolvedor Mercado Pago.
  2. Gere novo token de produção e novo Webhook Secret HMAC.
  3. Atualize as variáveis no painel da Vercel e reimplante o projeto.
  4. Teste o fluxo de checkout em staging antes de liberar para os clientes finais.
