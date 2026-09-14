# Runbook Operacional: Gestão de Incidentes em Pagamentos e Consultas

## 1. Incidente: Saldo Esgotado na API Brasil (`APIBRASIL_INSUFFICIENT_CREDITS`)

### Sintomas
- Alerta visual no topo do painel: card **"Saldo API Brasil Insuficiente"** com contagem > 0.
- Jobs de entrega marcados como `failed_permanent` com código HTTP `402`.
- Clientes reportando demora na liberação do laudo veicular pago via WhatsApp/Suporte.

### Procedimento de Resolução
1. **Passo 1 — Recarga da Conta**:
   - Acesse o painel corporativo oficial da API Brasil (ou entre em contato com o responsável financeiro da loja).
   - Realize a recarga do pacote de créditos de consultas veiculares por placa.
2. **Passo 2 — Triagem Operacional**:
   - Na Central Administrativa (`/admin/pagamentos-consultas`), clique no card de alerta **"Saldo API Brasil Insuficiente"** para listar as transações afetadas.
   - Avalie se os clientes optaram por aguardar ou solicitaram devolução imediata.
3. **Passo 3A — Reprocessar Consultas (Clientes que aguardam)**:
   - Para as transações mantidas, clique em **"Reprocessar entrega"**.
   - No modal de confirmação, marque o checkbox afirmando que o saldo da API Brasil foi recarregado.
   - Confirme a operação. O sistema consultará a API Brasil e disponibilizará o laudo ao cliente.
4. **Passo 3B — Estornar Consultas (Clientes que solicitaram devolução)**:
   - Caso o cliente não deseje mais aguardar, clique em **"Solicitar estorno"**.
   - Digite `ESTORNAR`, selecione `APIBRASIL_INSUFFICIENT_CREDITS` e confirme a devolução integral no Mercado Pago.

---

## 2. Incidente: Estorno com Status Pendente (`pending` ou `manual_review`)

### Sintomas
- O estorno foi enviado ao gateway, mas não retornou confirmação síncrona imediata (ex.: instabilidade temporária de rede ou processamento assíncrono no Mercado Pago).

### Procedimento de Resolução
1. Aguarde alguns minutos para que o gateway processe a transação bancária.
2. Na linha da transação correspondente, clique em **"Reconciliar estorno"**.
3. O sistema consultará os endpoints oficiais do Mercado Pago (`fetchAuthoritativePayment` e `refundClient.list`).
4. Se o estorno já constar como aprovado no gateway, a base de dados local será atualizada atomicamente para `confirmed` e `refunded`.
5. Se persistir como não localizado após 24 horas, acione o suporte corporativo do Mercado Pago informando o `mp_payment_id`.

---

## 3. Prevenção de Estorno Duplicado

- O sistema conta com restrição única de integridade no banco de dados (`idx_unique_active_refund_per_transaction` em `payment_refunds`), impossibilitando múltiplos estornos ativos para a mesma transação.
- O botão de estorno no frontend é desabilitado imediatamente após o primeiro clique e bloqueado caso o registro possua status `requested`, `pending` ou `confirmed`.
- O cabeçalho `X-Idempotency-Key` é enviado em todas as chamadas à API do Mercado Pago no formato determinístico `refund-{transactionId}-{mpPaymentId}`.

---

## 4. Análise de Logs Estruturados

Para investigar operações administrativas nos logs do servidor (Vercel ou console local), filtre pelo prefixo:
```text
[ADMIN_PAYMENTS]
```

Eventos monitoráveis:
- `admin_payments.list_viewed`: Visualização da listagem com contagem de filtros.
- `admin_payments.refund_requested`: Disparo de estorno pelo administrador (com `adminUserIdMasked` e `transactionIdMasked`).
- `admin_payments.refund_duplicate_prevented`: Tentativa concorrente bloqueada pela trava de idempotência.
- `admin_payments.refund_reconciled`: Reconciliação autoritativa finalizada com sucesso.
- `admin_payments.delivery_reprocessed`: Disparo de nova tentativa de emissão de laudo.
